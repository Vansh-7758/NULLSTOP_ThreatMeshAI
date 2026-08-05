# backend/database/neo4j_client.py
from neo4j import GraphDatabase
import logging
import time
from config import settings
from models.schemas import Package, CVERecord

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.uri = settings.NEO4J_URI
        self.username = settings.NEO4J_USERNAME
        self.password = settings.NEO4J_PASSWORD
        self.driver = None

        # Standalone in-memory store when Neo4j server is offline
        self._packages: dict[str, dict] = {}
        self._cves: dict[str, dict] = {}
        self._edges: list[tuple[str, str]] = []
        self._pkg_cves: dict[str, list[dict]] = {}

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))
            self.driver.verify_connectivity()
        except Exception as e:
            logger.warning(f"Neo4j connection deferred (using in-memory fallback): {e}")
            self.driver = None
        return self

    def close(self):
        if self.driver:
            try:
                self.driver.close()
            except Exception:
                pass

    def health_check(self) -> bool:
        if not self.driver:
            return False
        try:
            with self.driver.session() as session:
                result = session.run("RETURN 1 AS num")
                return result.single()["num"] == 1
        except Exception as e:
            logger.error(f"Neo4j health check failed: {e}")
            return False

    def run_query(self, query: str, params: dict = None) -> list[dict]:
        params = params or {}
        if self.driver:
            for attempt in range(2):
                try:
                    with self.driver.session() as session:
                        result = session.run(query, params)
                        return [dict(record) for record in result]
                except Exception as e:
                    if attempt == 1:
                        logger.warning(f"Neo4j query failed: {query} - Error: {e}")
                    time.sleep(0.5)

        # Fallback handling for in-memory graph matching
        query_lower = query.lower()

        if "return p.name as name" in query_lower or "return p" in query_lower:
            return [
                {
                    "name": pkg.get("name"),
                    "version": pkg.get("version"),
                    "ecosystem": pkg.get("ecosystem"),
                    "purl": pkg.get("purl"),
                    "trust_score": pkg.get("trust_score", 100.0),
                    "first_seen": pkg.get("first_seen"),
                    "node_type": pkg.get("node_type", "package")
                }
                for pkg in self._packages.values()
            ]

        if "return c" in query_lower:
            pkg_name = params.get("package_name") or params.get("name")
            if pkg_name and pkg_name in self._pkg_cves:
                return [{"c": c} for c in self._pkg_cves[pkg_name]]
            return [{"c": c} for c in self._cves.values()]

        return []

    def create_package_node(self, package: Package):
        pkg_dict = package.model_dump()
        self._packages[package.name] = pkg_dict

        if self.driver:
            query = """
            MERGE (p:Package {name: $name, version: $version})
            SET p.ecosystem = $ecosystem,
                p.purl = $purl,
                p.trust_score = $trust_score,
                p.first_seen = $first_seen,
                p.node_type = $node_type
            RETURN p
            """
            params = {
                "name": package.name,
                "version": package.version,
                "ecosystem": package.ecosystem,
                "purl": package.purl,
                "trust_score": package.trust_score,
                "first_seen": package.first_seen.isoformat() if package.first_seen else None,
                "node_type": package.node_type
            }
            self.run_query(query, params)

    def create_cve_node(self, cve: CVERecord):
        cve_dict = cve.model_dump()
        self._cves[cve.cve_id] = cve_dict

        if self.driver:
            query = """
            MERGE (c:CVE {cve_id: $cve_id})
            SET c.severity = $severity,
                c.cvss_score = $cvss_score,
                c.description = $description,
                c.published_date = $published_date,
                c.fixed_in_versions = $fixed_in_versions
            RETURN c
            """
            params = {
                "cve_id": cve.cve_id,
                "severity": cve.severity,
                "cvss_score": cve.cvss_score,
                "description": cve.description,
                "published_date": cve.published_date.isoformat() if cve.published_date else None,
                "fixed_in_versions": getattr(cve, "fixed_in_versions", [])
            }
            self.run_query(query, params)

    def create_dependency_edge(self, parent_ref: str, child_ref: str):
        self._edges.append((parent_ref, child_ref))
        if self.driver:
            query = """
            MATCH (parent:Package {purl: $parent_ref})
            MATCH (child:Package {purl: $child_ref})
            MERGE (parent)-[r:DEPENDS_ON]->(child)
            RETURN r
            """
            self.run_query(query, {"parent_ref": parent_ref, "child_ref": child_ref})

    def create_vulnerability_edge(self, package_name: str, package_version: str, cve_id: str):
        if cve_id in self._cves:
            if package_name not in self._pkg_cves:
                self._pkg_cves[package_name] = []
            self._pkg_cves[package_name].append(self._cves[cve_id])

        if self.driver:
            query = """
            MATCH (p:Package {name: $package_name, version: $package_version})
            MATCH (c:CVE {cve_id: $cve_id})
            MERGE (p)-[r:HAS_VULNERABILITY]->(c)
            RETURN r
            """
            self.run_query(query, {"package_name": package_name, "package_version": package_version, "cve_id": cve_id})

    def update_trust_score(self, package_name: str, version: str, score: float):
        if package_name in self._packages:
            self._packages[package_name]["trust_score"] = score

        if self.driver:
            query = """
            MATCH (p:Package {name: $package_name, version: $version})
            SET p.trust_score = $score
            RETURN p
            """
            self.run_query(query, {"package_name": package_name, "version": version, "score": score})

    def get_all_packages(self, scan_id: str = None) -> list[dict]:
        if self.driver:
            query = "MATCH (p:Package) RETURN p.name AS name, p.version AS version, p.ecosystem AS ecosystem, p.purl AS purl, p.trust_score AS trust_score, p.first_seen AS first_seen, p.node_type AS node_type"
            records = self.run_query(query)
            if records:
                return records

        return list(self._packages.values())

    def get_package_cves(self, package_name: str, version: str) -> list[dict]:
        if self.driver:
            query = """
            MATCH (p:Package {name: $package_name, version: $version})-[:HAS_VULNERABILITY]->(c:CVE)
            RETURN c.cve_id AS cve_id, c.severity AS severity, c.cvss_score AS cvss_score, c.description AS description
            """
            records = self.run_query(query, {"package_name": package_name, "version": version})
            if records:
                return records

        return self._pkg_cves.get(package_name, [])

    def get_scan_packages_from_graph(self, scan_id: str) -> list[dict]:
        if self.driver:
            query = """
            MATCH (s:Scan {scan_id: $scan_id})-[:HAS_PACKAGE]->(p:Package)
            RETURN p.name AS name, p.version AS version, p.ecosystem AS ecosystem, p.trust_score AS trust_score
            """
            records = self.run_query(query, {"scan_id": scan_id})
            if records:
                return records
        return list(self._packages.values())

    def get_shared_packages_across_scans(self, scan_ids: list[str]) -> list[dict]:
        """Cypher Query: Find all Package nodes connected via HAS_PACKAGE edges to more than one of the scan_ids."""
        if self.driver and scan_ids:
            query = """
            MATCH (p:Package)<-[:HAS_PACKAGE]-(s:Scan)
            WHERE s.scan_id IN $scan_ids
            WITH p, count(DISTINCT s.scan_id) AS tenant_count, collect(DISTINCT s.scan_id) AS scan_list
            WHERE tenant_count > 1
            RETURN p.name AS name, p.trust_score AS trust_score, tenant_count, scan_list
            """
            records = self.run_query(query, {"scan_ids": scan_ids})
            if records:
                return records

        # Fallback for in-memory graph
        return []

    def clear_graph(self):
        self._packages.clear()
        self._cves.clear()
        self._edges.clear()
        self._pkg_cves.clear()
        if self.driver:
            query = "MATCH (n) DETACH DELETE n"
            self.run_query(query)
