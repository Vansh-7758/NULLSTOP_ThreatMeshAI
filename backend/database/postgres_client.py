# backend/database/postgres_client.py
import asyncpg
import json
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from config import settings
from models.schemas import Playbook, AttackPath, GovernanceEvent, RedTeamResult, PredictedRisk

logger = logging.getLogger(__name__)

class PostgresClient:
    def __init__(self):
        self.dsn = settings.POSTGRES_URL.replace("postgresql+asyncpg://", "postgresql://")
        self.pool = None

        # Standalone in-memory fallback stores when Postgres server is offline
        self._scans: dict[str, dict] = {}
        self._scan_packages: dict[str, list[dict]] = {}
        self._scan_cves: dict[str, list[dict]] = {}
        self._playbooks: dict[str, list[dict]] = {}
        self._attack_paths: dict[str, list[dict]] = {}
        self._pull_requests: dict[str, list[dict]] = {}
        self._governance_events: list[dict] = []
        self._red_team_results: dict[str, list[dict]] = {}
        self._predictions: dict[str, list[dict]] = {}

    async def connect(self):
        try:
            self.pool = await asyncpg.create_pool(self.dsn, timeout=5.0)
            await self._create_tables()
        except Exception as e:
            logger.warning(f"PostgreSQL connection deferred (using in-memory fallback): {e}")
            self.pool = None
        return self

    async def close(self):
        if self.pool:
            try:
                await self.pool.close()
            except Exception:
                pass

    async def health_check(self) -> bool:
        if not self.pool:
            return False
        try:
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Postgres health check failed: {e}")
            return False

    async def _execute_with_retry(self, query: str, *args):
        if not self.pool:
            raise RuntimeError("Postgres pool is not initialized")
        for attempt in range(2):
            try:
                async with self.pool.acquire() as conn:
                    return await conn.fetch(query, *args)
            except Exception as e:
                if attempt == 1:
                    logger.error(f"Postgres query failed after retry: {e}")
                    raise
                logger.warning(f"Postgres query failed, retrying: {e}")
                await asyncio.sleep(1)

    async def _create_tables(self):
        if not self.pool:
            return
        queries = [
            """
            CREATE TABLE IF NOT EXISTS scans (
                scan_id TEXT PRIMARY KEY,
                status TEXT DEFAULT 'pending',
                progress FLOAT DEFAULT 0.0,
                current_stage TEXT DEFAULT '',
                sbom_filename TEXT DEFAULT '',
                total_packages INT DEFAULT 0,
                at_risk_count INT DEFAULT 0,
                cve_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS scan_packages (
                scan_id TEXT,
                name TEXT,
                version TEXT,
                ecosystem TEXT,
                purl TEXT,
                trust_score FLOAT DEFAULT 100.0,
                PRIMARY KEY (scan_id, name, version)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS scan_cves (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                cve_id TEXT,
                package_name TEXT,
                version TEXT,
                severity TEXT,
                cvss_score FLOAT DEFAULT 0.0,
                epss_score FLOAT DEFAULT 0.0,
                exploit_available BOOLEAN DEFAULT FALSE,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS playbooks (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                package_name TEXT,
                threat_summary TEXT,
                business_impact TEXT,
                trust_explanation TEXT,
                recommended_action TEXT,
                compliance_mapping JSONB DEFAULT '{}',
                confidence_score FLOAT DEFAULT 0.0,
                evidence_citations JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS attack_paths (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                source_package TEXT,
                target_package TEXT,
                path JSONB DEFAULT '[]',
                path_length INT DEFAULT 0,
                attack_type TEXT DEFAULT 'dependency_chain'
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS pull_requests (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                package_name TEXT,
                pr_url TEXT,
                pr_title TEXT,
                old_version TEXT,
                new_version TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS governance_events (
                id TEXT PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT NOW(),
                event_type TEXT,
                prompt TEXT,
                response TEXT,
                model TEXT,
                policy_result TEXT,
                risk_level TEXT,
                details JSONB DEFAULT '{}'
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS red_team_results (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                test_type TEXT,
                status TEXT,
                score FLOAT DEFAULT 0.0,
                details TEXT,
                evidence JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                package_name TEXT,
                version TEXT,
                risk_score FLOAT DEFAULT 0.0,
                signals JSONB DEFAULT '{}',
                explanation TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS company_profiles (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                industry TEXT,
                company_size TEXT,
                regions JSONB DEFAULT '[]',
                data_types JSONB DEFAULT '[]',
                existing_certifications JSONB DEFAULT '[]',
                ai_product_endpoint TEXT,
                ai_product_type TEXT,
                auth_header_name TEXT DEFAULT 'Authorization',
                auth_scheme TEXT DEFAULT 'Bearer',
                api_key_encrypted TEXT,
                response_field_path TEXT DEFAULT 'response.text',
                testing_consent BOOLEAN DEFAULT FALSE,
                consent_timestamp TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ai_product_endpoint TEXT;
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ai_product_type TEXT;
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS auth_header_name TEXT DEFAULT 'Authorization';
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS auth_scheme TEXT DEFAULT 'Bearer';
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT;
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS response_field_path TEXT DEFAULT 'response.text';
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS testing_consent BOOLEAN DEFAULT FALSE;
            """,
            """
            ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP;
            """,
            """
            CREATE TABLE IF NOT EXISTS ai_red_team_runs (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                target_mode TEXT DEFAULT 'internal_demo',
                target_endpoint TEXT,
                total_tests INT DEFAULT 0,
                completed_tests INT DEFAULT 0,
                status TEXT DEFAULT 'running',
                overall_score FLOAT DEFAULT 0.0,
                vector_scores JSONB DEFAULT '{}',
                started_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS ai_red_team_run_results (
                id TEXT PRIMARY KEY,
                run_id TEXT,
                scan_id TEXT,
                attack_vector TEXT,
                prompt TEXT,
                response TEXT,
                verdict TEXT DEFAULT 'fail',
                score FLOAT DEFAULT 0.0,
                reasoning TEXT,
                remediation TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS compliance_assessments (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                company_profile_id TEXT,
                domain TEXT,
                question_id TEXT,
                question_text TEXT,
                answer TEXT,
                answered_at TIMESTAMP DEFAULT NOW(),
                notes TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS compliance_reports (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                generated_at TIMESTAMP DEFAULT NOW(),
                overall_score FLOAT DEFAULT 0.0,
                framework_scores JSONB DEFAULT '{}',
                domain_scores JSONB DEFAULT '{}',
                gap_count INTEGER DEFAULT 0,
                critical_gaps JSONB DEFAULT '[]',
                remediation_roadmap JSONB DEFAULT '[]',
                report_text TEXT,
                company_profile_id TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS compliance_sessions (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                status TEXT DEFAULT 'not_started',
                current_domain TEXT,
                completed_domains JSONB DEFAULT '[]',
                total_questions INTEGER DEFAULT 0,
                answered_questions INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS sbom_cross_validations (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                question_id TEXT,
                answer_given TEXT,
                validation_status TEXT,
                confidence_adjustment FLOAT DEFAULT 0.0,
                evidence TEXT,
                technical_detail TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS domain_signal_reports (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                domain TEXT,
                overall_signal_score FLOAT DEFAULT 0.0,
                checks JSONB DEFAULT '[]',
                checked_at TIMESTAMP DEFAULT NOW()
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS answer_confidence_scores (
                id TEXT PRIMARY KEY,
                scan_id TEXT,
                question_id TEXT,
                answer_given TEXT,
                base_score FLOAT,
                cross_validation_adjustment FLOAT,
                domain_signal_contribution FLOAT,
                final_confidence_score FLOAT,
                confidence_level TEXT,
                confidence_label TEXT,
                corroborating_evidence TEXT,
                requires_manual_evidence BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """
        ]
        for query in queries:
            try:
                async with self.pool.acquire() as conn:
                    await conn.execute(query)
            except Exception as e:
                logger.error(f"Failed to create table: {e}")

    async def create_scan(self, scan_id: str, sbom_filename: str, total_packages: int = 0) -> dict:
        now_iso = datetime.now(timezone.utc).isoformat()
        scan_dict = {
            "scan_id": scan_id,
            "status": "pending",
            "progress": 0.0,
            "current_stage": "Created",
            "sbom_filename": sbom_filename,
            "total_packages": total_packages,
            "at_risk_count": 0,
            "cve_count": 0,
            "created_at": now_iso,
            "updated_at": now_iso
        }
        self._scans[scan_id] = scan_dict

        if self.pool:
            try:
                query = "INSERT INTO scans (scan_id, sbom_filename) VALUES ($1, $2) RETURNING *"
                records = await self._execute_with_retry(query, scan_id, sbom_filename)
                if records:
                    return dict(records[0])
            except Exception as e:
                logger.warning(f"Fallback to in-memory scan: {e}")

        return scan_dict

    async def save_scan_packages(self, scan_id: str, packages: list):
        pkg_dicts = []
        for p in packages:
            d = p.model_dump() if hasattr(p, 'model_dump') else dict(p)
            d["scan_id"] = scan_id
            pkg_dicts.append(d)
        self._scan_packages[scan_id] = pkg_dicts

        if self.pool:
            try:
                for d in pkg_dicts:
                    query = """
                    INSERT INTO scan_packages (scan_id, name, version, ecosystem, purl, trust_score)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (scan_id, name, version) DO UPDATE SET trust_score = EXCLUDED.trust_score
                    """
                    await self._execute_with_retry(
                        query, scan_id, d.get("name"), d.get("version"),
                        d.get("ecosystem"), d.get("purl"), d.get("trust_score", 100.0)
                    )
            except Exception as e:
                logger.warning(f"Fallback to in-memory scan packages save: {e}")

    async def save_scan_cves(self, scan_id: str, cve_records: list):
        cve_dicts = []
        for c in cve_records:
            d = c.model_dump() if hasattr(c, 'model_dump') else dict(c)
            d["id"] = str(uuid.uuid4())
            d["scan_id"] = scan_id
            cve_dicts.append(d)

        self._scan_cves[scan_id] = cve_dicts

        if self.pool:
            try:
                for d in cve_dicts:
                    query = """
                    INSERT INTO scan_cves (id, scan_id, cve_id, package_name, version, severity, cvss_score, epss_score, exploit_available, description)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    """
                    pkg_n = d.get("description", "").split(" ")[0] if d.get("description") else "unknown"
                    await self._execute_with_retry(
                        query, d["id"], scan_id, d.get("cve_id"), pkg_n, d.get("version", "1.0.0"),
                        str(d.get("severity", "CRITICAL")), float(d.get("cvss_score", 0.0)),
                        float(d.get("epss_score", 0.0)), bool(d.get("exploit_available", False)),
                        d.get("description", "")
                    )
            except Exception as e:
                logger.warning(f"Fallback to in-memory scan CVEs save: {e}")

    async def get_scan_cves(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM scan_cves WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory scan CVEs read: {e}")

        return self._scan_cves.get(scan_id, [])

    async def update_package_trust_score(self, scan_id: str, name: str, version: str, score: float):
        if scan_id in self._scan_packages:
            for p in self._scan_packages[scan_id]:
                if p.get("name") == name and p.get("version") == version:
                    p["trust_score"] = score

        if self.pool:
            try:
                query = "UPDATE scan_packages SET trust_score = $1 WHERE scan_id = $2 AND name = $3 AND version = $4"
                await self._execute_with_retry(query, score, scan_id, name, version)
            except Exception as e:
                logger.warning(f"Fallback to in-memory package trust score update: {e}")

    async def get_scan_packages(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM scan_packages WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory scan packages read: {e}")

        return self._scan_packages.get(scan_id, [])

    async def update_scan_status(self, scan_id: str, status: str, progress: float, current_stage: str, **kwargs):
        scan_dict = self._scans.get(scan_id, {"scan_id": scan_id})
        scan_dict["status"] = status
        scan_dict["progress"] = progress
        scan_dict["current_stage"] = current_stage
        scan_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        for k, v in kwargs.items():
            scan_dict[k] = v
        self._scans[scan_id] = scan_dict

        if self.pool:
            try:
                set_clauses = ["status = $2", "progress = $3", "current_stage = $4", "updated_at = NOW()"]
                args = [scan_id, status, progress, current_stage]
                idx = 5
                for k, v in kwargs.items():
                    set_clauses.append(f"{k} = ${idx}")
                    args.append(v)
                    idx += 1
                query = f"UPDATE scans SET {', '.join(set_clauses)} WHERE scan_id = $1"
                async with self.pool.acquire() as conn:
                    await conn.execute(query, *args)
            except Exception as e:
                logger.warning(f"Fallback to in-memory scan update: {e}")

    async def get_scan(self, scan_id: str) -> dict | None:
        if self.pool:
            try:
                query = "SELECT * FROM scans WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return dict(records[0])
            except Exception as e:
                logger.warning(f"Fallback to in-memory scan read: {e}")

        return self._scans.get(scan_id)

    async def get_scan_status(self, scan_id: str) -> dict | None:
        return await self.get_scan(scan_id)

    async def save_playbook(self, playbook: Playbook):
        pb_dict = playbook.model_dump()
        scan_id = playbook.scan_id
        if scan_id not in self._playbooks:
            self._playbooks[scan_id] = []
        existing = [p for p in self._playbooks[scan_id] if p.get("package_name") == playbook.package_name]
        if existing:
            self._playbooks[scan_id].remove(existing[0])
        self._playbooks[scan_id].append(pb_dict)

        if self.pool:
            try:
                query = """
                INSERT INTO playbooks (
                    id, scan_id, package_name, threat_summary, business_impact,
                    trust_explanation, recommended_action, compliance_mapping,
                    confidence_score, evidence_citations
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """
                await self._execute_with_retry(
                    query,
                    playbook.id, playbook.scan_id, playbook.package_name, playbook.threat_summary,
                    playbook.business_impact, playbook.trust_explanation, playbook.recommended_action,
                    json.dumps(playbook.compliance_mapping), playbook.confidence_score, json.dumps(playbook.evidence_citations)
                )
            except Exception as e:
                logger.warning(f"Fallback to in-memory playbook save: {e}")

    async def get_playbooks(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM playbooks WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory playbooks read: {e}")

        return self._playbooks.get(scan_id, [])

    async def save_attack_path(self, attack_path: AttackPath):
        ap_dict = attack_path.model_dump()
        scan_id = attack_path.scan_id
        if scan_id not in self._attack_paths:
            self._attack_paths[scan_id] = []
        self._attack_paths[scan_id].append(ap_dict)

        if self.pool:
            try:
                query = """
                INSERT INTO attack_paths (
                    id, scan_id, source_package, target_package, path, path_length, attack_type
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                """
                await self._execute_with_retry(
                    query,
                    attack_path.id, attack_path.scan_id, attack_path.source_package,
                    attack_path.target_package, json.dumps(attack_path.path), attack_path.path_length, attack_path.attack_type
                )
            except Exception as e:
                logger.warning(f"Fallback to in-memory attack path save: {e}")

    async def get_attack_paths(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM attack_paths WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory attack paths read: {e}")

        return self._attack_paths.get(scan_id, [])

    async def save_pull_request(self, scan_id: str, package_name: str, pr_url: str, pr_title: str, old_version: str, new_version: str):
        pr_id = str(uuid.uuid4())
        pr_dict = {
            "id": pr_id,
            "scan_id": scan_id,
            "package_name": package_name,
            "pr_url": pr_url,
            "pr_title": pr_title,
            "old_version": old_version,
            "new_version": new_version
        }
        if scan_id not in self._pull_requests:
            self._pull_requests[scan_id] = []
        self._pull_requests[scan_id].append(pr_dict)

        if self.pool:
            try:
                query = """
                INSERT INTO pull_requests (
                    id, scan_id, package_name, pr_url, pr_title, old_version, new_version
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                """
                await self._execute_with_retry(query, pr_id, scan_id, package_name, pr_url, pr_title, old_version, new_version)
            except Exception as e:
                logger.warning(f"Fallback to in-memory PR save: {e}")

    async def get_pull_requests(self, scan_id: str) -> list[dict]:
        raw_prs = []
        if self.pool:
            try:
                query = "SELECT * FROM pull_requests WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    raw_prs = [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory PR read: {e}")

        if not raw_prs:
            raw_prs = self._pull_requests.get(scan_id, [])

        clean_prs = []
        for pr in raw_prs:
            p = dict(pr)
            url = p.get("pr_url", "")
            if "threatmesh/repo" in url or "enterprise-app" in url or "threatmesh-ai/demo" in url:
                p["pr_url"] = "https://github.com/Vansh-7758/NULLSTOP_ThreatMeshAI/pulls"
            clean_prs.append(p)
        return clean_prs

    async def save_governance_event(self, event: GovernanceEvent):
        evt_dict = event.model_dump()
        self._governance_events.append(evt_dict)

        if self.pool:
            try:
                query = """
                INSERT INTO governance_events (
                    id, timestamp, event_type, prompt, response, model, policy_result, risk_level, details
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """
                await self._execute_with_retry(
                    query,
                    event.id, event.timestamp, event.event_type, event.prompt,
                    event.response, event.model, event.policy_result, event.risk_level, json.dumps(event.details)
                )
            except Exception as e:
                logger.warning(f"Fallback to in-memory governance event save: {e}")

    async def get_governance_events(self, limit: int = 50) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM governance_events ORDER BY timestamp DESC LIMIT $1"
                records = await self._execute_with_retry(query, limit)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory governance events read: {e}")

        return self._governance_events[:limit]

    async def save_red_team_result(self, result: RedTeamResult):
        res_dict = result.model_dump()
        scan_id = result.scan_id
        if scan_id not in self._red_team_results:
            self._red_team_results[scan_id] = []
        self._red_team_results[scan_id].append(res_dict)

        if self.pool:
            try:
                query = """
                INSERT INTO red_team_results (
                    id, scan_id, test_type, status, score, details, evidence
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                """
                await self._execute_with_retry(
                    query,
                    result.id, result.scan_id, result.test_type, result.status,
                    result.score, result.details, json.dumps(result.evidence)
                )
            except Exception as e:
                logger.warning(f"Fallback to in-memory red team result save: {e}")

    async def get_red_team_results(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM red_team_results WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory red team read: {e}")

        return self._red_team_results.get(scan_id, [])

    async def save_prediction(self, scan_id: str, prediction: PredictedRisk):
        pred_dict = prediction.model_dump()
        pred_dict["id"] = str(uuid.uuid4())
        pred_dict["scan_id"] = scan_id
        if scan_id not in self._predictions:
            self._predictions[scan_id] = []
        self._predictions[scan_id].append(pred_dict)

        if self.pool:
            try:
                pred_id = pred_dict["id"]
                query = """
                INSERT INTO predictions (
                    id, scan_id, package_name, version, risk_score, signals, explanation
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                """
                await self._execute_with_retry(
                    query,
                    pred_id, scan_id, prediction.package_name, prediction.version,
                    prediction.risk_score, json.dumps(prediction.signals), prediction.explanation
                )
            except Exception as e:
                logger.warning(f"Fallback to in-memory prediction save: {e}")

    async def get_predictions(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM predictions WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Fallback to in-memory predictions read: {e}")

        return self._predictions.get(scan_id, [])

    async def save_sbom_cross_validations(self, scan_id: str, results: list):
        items = []
        for r in results:
            d = r.__dict__ if hasattr(r, "__dict__") else dict(r)
            d["id"] = str(uuid.uuid4())
            d["scan_id"] = scan_id
            items.append(d)

        if not hasattr(self, "_cross_validations"):
            self._cross_validations = {}
        self._cross_validations[scan_id] = items

        if self.pool:
            try:
                for d in items:
                    query = """
                    INSERT INTO sbom_cross_validations (id, scan_id, question_id, answer_given, validation_status, confidence_adjustment, evidence, technical_detail)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    """
                    await self._execute_with_retry(
                        query, d["id"], scan_id, d.get("question_id"), d.get("answer_given"),
                        d.get("validation_status"), float(d.get("confidence_adjustment", 0.0)),
                        d.get("evidence"), d.get("technical_detail")
                    )
            except Exception as e:
                logger.warning(f"Postgres save_sbom_cross_validations error: {e}")

    async def get_sbom_cross_validations(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM sbom_cross_validations WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Postgres get_sbom_cross_validations error: {e}")

        if hasattr(self, "_cross_validations"):
            return self._cross_validations.get(scan_id, [])
        return []

    async def save_domain_signal_report(self, scan_id: str, report: Any):
        d = report.__dict__ if hasattr(report, "__dict__") else dict(report)
        d["id"] = str(uuid.uuid4())
        d["scan_id"] = scan_id

        if not hasattr(self, "_domain_reports"):
            self._domain_reports = {}
        self._domain_reports[scan_id] = d

        if self.pool:
            try:
                query = """
                INSERT INTO domain_signal_reports (id, scan_id, domain, overall_signal_score, checks)
                VALUES ($1, $2, $3, $4, $5)
                """
                checks_json = json.dumps([c.__dict__ if hasattr(c, "__dict__") else c for c in d.get("checks", [])])
                await self._execute_with_retry(
                    query, d["id"], scan_id, d.get("domain"), float(d.get("overall_signal_score", 0.0)), checks_json
                )
            except Exception as e:
                logger.warning(f"Postgres save_domain_signal_report error: {e}")

    async def get_domain_signal_report(self, scan_id: str) -> dict | None:
        if self.pool:
            try:
                query = "SELECT * FROM domain_signal_reports WHERE scan_id = $1 ORDER BY checked_at DESC LIMIT 1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    res = dict(records[0])
                    if isinstance(res.get("checks"), str):
                        try:
                            res["checks"] = json.loads(res["checks"])
                        except Exception:
                            pass
                    return res
            except Exception as e:
                logger.warning(f"Postgres get_domain_signal_report error: {e}")

        if hasattr(self, "_domain_reports"):
            return self._domain_reports.get(scan_id)
        return None

    async def save_answer_confidence_scores(self, scan_id: str, scores: list):
        items = []
        for s in scores:
            d = s.__dict__ if hasattr(s, "__dict__") else dict(s)
            d["id"] = str(uuid.uuid4())
            d["scan_id"] = scan_id
            items.append(d)

        if not hasattr(self, "_confidence_scores"):
            self._confidence_scores = {}
        self._confidence_scores[scan_id] = items

        if self.pool:
            try:
                for d in items:
                    query = """
                    INSERT INTO answer_confidence_scores (
                        id, scan_id, question_id, answer_given, base_score,
                        cross_validation_adjustment, domain_signal_contribution,
                        final_confidence_score, confidence_level, confidence_label,
                        corroborating_evidence, requires_manual_evidence
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    """
                    await self._execute_with_retry(
                        query, d["id"], scan_id, d.get("question_id"), d.get("answer_given"),
                        float(d.get("base_score", 0.0)), float(d.get("cross_validation_adjustment", 0.0)),
                        float(d.get("domain_signal_contribution", 0.0)), float(d.get("final_confidence_score", 0.0)),
                        d.get("confidence_level"), d.get("confidence_label"), d.get("corroborating_evidence"),
                        bool(d.get("requires_manual_evidence", False))
                    )
            except Exception as e:
                logger.warning(f"Postgres save_answer_confidence_scores error: {e}")

    async def get_answer_confidence_scores(self, scan_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM answer_confidence_scores WHERE scan_id = $1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Postgres get_answer_confidence_scores error: {e}")

        if hasattr(self, "_confidence_scores"):
            return self._confidence_scores.get(scan_id, [])
        return []

    # ── AI Red Team Service Helpers & Encryption ──

    @staticmethod
    def encrypt_api_key(plain_key: str) -> str:
        if not plain_key:
            return ""
        import base64
        import hashlib
        import os
        secret = os.getenv("ENCRYPTION_SECRET", "threatmesh_secret_key_32_bytes_len!")
        key_bytes = hashlib.sha256(secret.encode()).digest()
        data_bytes = plain_key.encode()
        cipher_bytes = bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(data_bytes)])
        return base64.b64encode(cipher_bytes).decode()

    @staticmethod
    def decrypt_api_key(cipher_text: str) -> str:
        if not cipher_text:
            return ""
        try:
            import base64
            import hashlib
            import os
            secret = os.getenv("ENCRYPTION_SECRET", "threatmesh_secret_key_32_bytes_len!")
            cipher_bytes = base64.b64decode(cipher_text.encode())
            key_bytes = hashlib.sha256(secret.encode()).digest()
            plain_bytes = bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(cipher_bytes)])
            return plain_bytes.decode()
        except Exception:
            return ""

    async def get_company_profile(self, scan_id: str) -> dict | None:
        if self.pool:
            try:
                query = "SELECT * FROM company_profiles WHERE scan_id = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    res = dict(records[0])
                    if isinstance(res.get("regions"), str):
                        try: res["regions"] = json.loads(res["regions"])
                        except Exception: pass
                    if isinstance(res.get("data_types"), str):
                        try: res["data_types"] = json.loads(res["data_types"])
                        except Exception: pass
                    if isinstance(res.get("existing_certifications"), str):
                        try: res["existing_certifications"] = json.loads(res["existing_certifications"])
                        except Exception: pass
                    if res.get("api_key_encrypted"):
                        res["api_key_configured"] = True
                        res["api_key_encrypted"] = None
                    return res
            except Exception as e:
                logger.warning(f"Postgres get_company_profile error: {e}")

        if hasattr(self, "_company_profiles"):
            prof = self._company_profiles.get(scan_id)
            if prof:
                p_copy = dict(prof)
                if p_copy.get("api_key_encrypted"):
                    p_copy["api_key_configured"] = True
                    p_copy["api_key_encrypted"] = None
                return p_copy
        return None

    async def get_company_profile_internal(self, scan_id: str) -> dict | None:
        """Internal lookup returning decrypted API key for target executor."""
        if self.pool:
            try:
                query = "SELECT * FROM company_profiles WHERE scan_id = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    res = dict(records[0])
                    if isinstance(res.get("regions"), str):
                        try: res["regions"] = json.loads(res["regions"])
                        except Exception: pass
                    if isinstance(res.get("data_types"), str):
                        try: res["data_types"] = json.loads(res["data_types"])
                        except Exception: pass
                    if isinstance(res.get("existing_certifications"), str):
                        try: res["existing_certifications"] = json.loads(res["existing_certifications"])
                        except Exception: pass
                    if res.get("api_key_encrypted"):
                        res["api_key_decrypted"] = self.decrypt_api_key(res["api_key_encrypted"])
                    return res
            except Exception as e:
                logger.warning(f"Postgres get_company_profile_internal error: {e}")

        if hasattr(self, "_company_profiles"):
            prof = self._company_profiles.get(scan_id)
            if prof:
                p_copy = dict(prof)
                if p_copy.get("api_key_encrypted"):
                    p_copy["api_key_decrypted"] = self.decrypt_api_key(p_copy["api_key_encrypted"])
                return p_copy
        return None

    async def update_company_profile_ai_config(
        self,
        scan_id: str,
        ai_product_endpoint: str = None,
        ai_product_type: str = None,
        auth_header_name: str = "Authorization",
        auth_scheme: str = "Bearer",
        api_key_plain: str = None,
        response_field_path: str = "response.text",
        testing_consent: bool = False
    ) -> dict:
        encrypted_key = self.encrypt_api_key(api_key_plain) if api_key_plain else None
        now_dt = datetime.now(timezone.utc)

        if not hasattr(self, "_company_profiles"):
            self._company_profiles = {}

        prof = self._company_profiles.get(scan_id, {"scan_id": scan_id})
        if ai_product_endpoint is not None: prof["ai_product_endpoint"] = ai_product_endpoint
        if ai_product_type is not None: prof["ai_product_type"] = ai_product_type
        if auth_header_name: prof["auth_header_name"] = auth_header_name
        if auth_scheme: prof["auth_scheme"] = auth_scheme
        if encrypted_key: prof["api_key_encrypted"] = encrypted_key
        if response_field_path: prof["response_field_path"] = response_field_path
        prof["testing_consent"] = testing_consent
        if testing_consent: prof["consent_timestamp"] = now_dt.isoformat()
        prof["updated_at"] = now_dt.isoformat()
        self._company_profiles[scan_id] = prof

        if self.pool:
            try:
                # Find existing profile ID for scan_id if available
                existing_records = await self._execute_with_retry(
                    "SELECT id FROM company_profiles WHERE scan_id = $1 ORDER BY updated_at DESC LIMIT 1", scan_id
                )
                prof_id = existing_records[0]["id"] if existing_records else prof.get("id") or str(uuid.uuid4())
                prof["id"] = prof_id

                query = """
                INSERT INTO company_profiles (
                    id, scan_id, ai_product_endpoint, ai_product_type, auth_header_name,
                    auth_scheme, api_key_encrypted, response_field_path, testing_consent,
                    consent_timestamp, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    ai_product_endpoint = COALESCE(EXCLUDED.ai_product_endpoint, company_profiles.ai_product_endpoint),
                    ai_product_type = COALESCE(EXCLUDED.ai_product_type, company_profiles.ai_product_type),
                    auth_header_name = EXCLUDED.auth_header_name,
                    auth_scheme = EXCLUDED.auth_scheme,
                    api_key_encrypted = COALESCE(EXCLUDED.api_key_encrypted, company_profiles.api_key_encrypted),
                    response_field_path = EXCLUDED.response_field_path,
                    testing_consent = EXCLUDED.testing_consent,
                    consent_timestamp = EXCLUDED.consent_timestamp,
                    updated_at = NOW()
                """
                await self._execute_with_retry(
                    query,
                    prof_id, scan_id, ai_product_endpoint, ai_product_type,
                    auth_header_name, auth_scheme, encrypted_key,
                    response_field_path, testing_consent, now_dt if testing_consent else None
                )
            except Exception as e:
                logger.warning(f"Postgres update_company_profile_ai_config error: {e}")

        # Return sanitized profile
        sanitized = dict(prof)
        if sanitized.get("api_key_encrypted"):
            sanitized["api_key_configured"] = True
            sanitized["api_key_encrypted"] = None
        return sanitized

    async def create_ai_red_team_run(
        self, scan_id: str, target_mode: str, target_endpoint: str, total_tests: int = 32
    ) -> str:
        run_id = f"run-{uuid.uuid4()}"
        now_dt = datetime.now(timezone.utc)
        run_dict = {
            "id": run_id,
            "scan_id": scan_id,
            "target_mode": target_mode,
            "target_endpoint": target_endpoint,
            "total_tests": total_tests,
            "completed_tests": 0,
            "status": "running",
            "overall_score": 0.0,
            "vector_scores": {},
            "started_at": now_dt.isoformat(),
            "completed_at": None
        }

        if not hasattr(self, "_red_team_runs"):
            self._red_team_runs = {}
        if scan_id not in self._red_team_runs:
            self._red_team_runs[scan_id] = []
        self._red_team_runs[scan_id].insert(0, run_dict)

        if self.pool:
            try:
                query = """
                INSERT INTO ai_red_team_runs (
                    id, scan_id, target_mode, target_endpoint, total_tests, completed_tests, status, overall_score, vector_scores, started_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                """
                await self._execute_with_retry(
                    query, run_id, scan_id, target_mode, target_endpoint, total_tests, 0, "running", 0.0, "{}"
                )
            except Exception as e:
                logger.warning(f"Postgres create_ai_red_team_run error: {e}")

        return run_id

    async def update_ai_red_team_run_progress(
        self, run_id: str, completed_tests: int, status: str, overall_score: float, vector_scores: dict
    ):
        if hasattr(self, "_red_team_runs"):
            for s_id, runs in self._red_team_runs.items():
                for r in runs:
                    if r.get("id") == run_id:
                        r["completed_tests"] = completed_tests
                        r["status"] = status
                        r["overall_score"] = overall_score
                        r["vector_scores"] = vector_scores
                        if status in ("completed", "failed"):
                            r["completed_at"] = datetime.now(timezone.utc).isoformat()

        if self.pool:
            try:
                if status in ("completed", "failed"):
                    query = """
                    UPDATE ai_red_team_runs
                    SET completed_tests = $1, status = $2, overall_score = $3, vector_scores = $4, completed_at = NOW()
                    WHERE id = $5
                    """
                else:
                    query = """
                    UPDATE ai_red_team_runs
                    SET completed_tests = $1, status = $2, overall_score = $3, vector_scores = $4
                    WHERE id = $5
                    """
                await self._execute_with_retry(
                    query, completed_tests, status, overall_score, json.dumps(vector_scores), run_id
                )
            except Exception as e:
                logger.warning(f"Postgres update_ai_red_team_run_progress error: {e}")

    async def save_ai_red_team_run_result(self, result_dict: dict):
        res_id = result_dict.get("id") or str(uuid.uuid4())
        result_dict["id"] = res_id

        run_id = result_dict.get("run_id")
        if not hasattr(self, "_red_team_run_results"):
            self._red_team_run_results = {}
        if run_id not in self._red_team_run_results:
            self._red_team_run_results[run_id] = []
        self._red_team_run_results[run_id].append(result_dict)

        if self.pool:
            try:
                query = """
                INSERT INTO ai_red_team_run_results (
                    id, run_id, scan_id, attack_vector, prompt, response, verdict, score, reasoning, remediation
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """
                await self._execute_with_retry(
                    query,
                    res_id, result_dict.get("run_id"), result_dict.get("scan_id"),
                    result_dict.get("attack_vector"), result_dict.get("prompt"),
                    result_dict.get("response"), result_dict.get("verdict"),
                    float(result_dict.get("score", 0.0)), result_dict.get("reasoning"),
                    result_dict.get("remediation", "")
                )
            except Exception as e:
                logger.warning(f"Postgres save_ai_red_team_run_result error: {e}")

    async def get_latest_ai_red_team_run(self, scan_id: str) -> dict | None:
        if self.pool:
            try:
                query = "SELECT * FROM ai_red_team_runs WHERE scan_id = $1 ORDER BY started_at DESC LIMIT 1"
                records = await self._execute_with_retry(query, scan_id)
                if records:
                    res = dict(records[0])
                    if isinstance(res.get("vector_scores"), str):
                        try: res["vector_scores"] = json.loads(res["vector_scores"])
                        except Exception: pass
                    return res
            except Exception as e:
                logger.warning(f"Postgres get_latest_ai_red_team_run error: {e}")

        if hasattr(self, "_red_team_runs") and scan_id in self._red_team_runs:
            runs = self._red_team_runs[scan_id]
            if runs:
                return runs[0]
        return None

    async def get_ai_red_team_run_results_for_run(self, run_id: str) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM ai_red_team_run_results WHERE run_id = $1 ORDER BY created_at ASC"
                records = await self._execute_with_retry(query, run_id)
                if records:
                    return [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Postgres get_ai_red_team_run_results_for_run error: {e}")

        if hasattr(self, "_red_team_run_results"):
            return self._red_team_run_results.get(run_id, [])
        return []

    async def get_ai_red_team_run_history(self, scan_id: str, limit: int = 15) -> list[dict]:
        if self.pool:
            try:
                query = "SELECT * FROM ai_red_team_runs WHERE scan_id = $1 AND status = 'completed' ORDER BY started_at DESC LIMIT $2"
                records = await self._execute_with_retry(query, scan_id, limit)
                if records:
                    results = []
                    for r in records:
                        d = dict(r)
                        if isinstance(d.get("vector_scores"), str):
                            try: d["vector_scores"] = json.loads(d["vector_scores"])
                            except Exception: pass
                        results.append(d)
                    return results
            except Exception as e:
                logger.warning(f"Postgres get_ai_red_team_run_history error: {e}")

        if hasattr(self, "_red_team_runs") and scan_id in self._red_team_runs:
            runs = [r for r in self._red_team_runs[scan_id] if r.get("status") == "completed"]
            return runs[:limit]
        return []
