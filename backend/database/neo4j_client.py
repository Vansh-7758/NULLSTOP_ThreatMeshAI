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

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))
            self.driver.verify_connectivity()
        except Exception as e:
            logger.warning(f"Neo4j connection deferred (graph queries will fallback): {e}")
        return self

    def close(self):
        if self.driver:
            self.driver.close()

    def health_check(self) -> bool:
        try:
            with self.driver.session() as session:
                result = session.run("RETURN 1 AS num")
                return result.single()["num"] == 1
        except Exception as e:
            logger.error(f"Neo4j health check failed: {e}")
            return False

    def run_query(self, query: str, params: dict = None) -> list[dict]:
        params = params or {}
        for attempt in range(2):
            try:
                with self.driver.session() as session:
                    result = session.run(query, params)
                    return [dict(record) for record in result]
            except Exception as e:
                if attempt == 1:
                    logger.error(f"Query failed after retry: {query} - Error: {e}")
                    raise
                logger.warning(f"Query failed, retrying: {e}")
                time.sleep(1)

    def create_package_node(self, package: Package):
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
        query = """
        MERGE (c:CVE {cve_id: $cve_id})
        SET c.severity = $severity,
            c.cvss_score = $cvss_score,
            c.description = $description,
            c.published_date = $published_date,
            c.fix_versions = $fix_versions
        RETURN c
        """
        params = {
            "cve_id": cve.cve_id,
            "severity": cve.severity,
            "cvss_score": cve.cvss_score,
            "description": cve.description,
            "published_date": cve.published_date.isoformat() if cve.published_date else None,
            "fix_versions": cve.fix_versions
        }
        self.run_query(query, params)

    def create_dependency_edge(self, parent_ref: str, child_ref: str):
        query = """
        MATCH (parent:Package {purl: $parent_ref})
        MATCH (child:Package {purl: $child_ref})
        MERGE (parent)-[r:DEPENDS_ON]->(child)
        RETURN r
        """
        self.run_query(query, {"parent_ref": parent_ref, "child_ref": child_ref})

    def create_vulnerability_edge(self, package_name: str, package_version: str, cve_id: str):
        query = """
        MATCH (p:Package {name: $package_name, version: $package_version})
        MATCH (c:CVE {cve_id: $cve_id})
        MERGE (p)-[r:HAS_VULNERABILITY]->(c)
        RETURN r
        """
        self.run_query(query, {"package_name": package_name, "package_version": package_version, "cve_id": cve_id})

    def update_trust_score(self, package_name: str, version: str, score: float):
        query = """
        MATCH (p:Package {name: $package_name, version: $version})
        SET p.trust_score = $score
        RETURN p
        """
        self.run_query(query, {"package_name": package_name, "version": version, "score": score})

    def get_all_packages(self, scan_id: str = None) -> list[dict]:
        query = "MATCH (p:Package) RETURN p"
        records = self.run_query(query)
        return [record["p"] for record in records]

    def get_package_cves(self, package_name: str, version: str) -> list[dict]:
        query = """
        MATCH (p:Package {name: $package_name, version: $version})-[:HAS_VULNERABILITY]->(c:CVE)
        RETURN c
        """
        records = self.run_query(query, {"package_name": package_name, "version": version})
        return [record["c"] for record in records]

    def clear_graph(self):
        query = "MATCH (n) DETACH DELETE n"
        self.run_query(query)
