import asyncpg
import json
import asyncio
import logging
import uuid
from config import settings
from models.schemas import Playbook, AttackPath, GovernanceEvent, RedTeamResult, PredictedRisk

logger = logging.getLogger(__name__)

class PostgresClient:
    def __init__(self):
        self.dsn = settings.POSTGRES_URL.replace("postgresql+asyncpg://", "postgresql://")
        self.pool = None

    async def connect(self):
        try:
            self.pool = await asyncpg.create_pool(self.dsn, timeout=5.0)
            await self._create_tables()
        except Exception as e:
            logger.warning(f"PostgreSQL connection deferred (db queries will fallback): {e}")
        return self

    async def close(self):
        if self.pool:
            await self.pool.close()

    async def health_check(self) -> bool:
        try:
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Postgres health check failed: {e}")
            return False

    async def _execute_with_retry(self, query: str, *args):
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
                attack_type TEXT DEFAULT 'software',
                created_at TIMESTAMP DEFAULT NOW()
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
                score FLOAT DEFAULT 100.0,
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
            """
        ]
        for query in queries:
            for attempt in range(2):
                try:
                    async with self.pool.acquire() as conn:
                        await conn.execute(query)
                    break
                except Exception as e:
                    if attempt == 1:
                        logger.error(f"Failed to create tables: {e}")
                        raise
                    await asyncio.sleep(1)

    async def create_scan(self, scan_id: str, sbom_filename: str) -> dict:
        query = """
        INSERT INTO scans (scan_id, sbom_filename)
        VALUES ($1, $2)
        RETURNING *
        """
        records = await self._execute_with_retry(query, scan_id, sbom_filename)
        return dict(records[0]) if records else {}

    async def update_scan_status(self, scan_id: str, status: str, progress: float, current_stage: str, **kwargs):
        set_clauses = ["status = $2", "progress = $3", "current_stage = $4", "updated_at = NOW()"]
        args = [scan_id, status, progress, current_stage]
        
        idx = 5
        for k, v in kwargs.items():
            set_clauses.append(f"{k} = ${idx}")
            args.append(v)
            idx += 1
            
        query = f"""
        UPDATE scans
        SET {', '.join(set_clauses)}
        WHERE scan_id = $1
        """
        for attempt in range(2):
            try:
                async with self.pool.acquire() as conn:
                    await conn.execute(query, *args)
                return
            except Exception as e:
                if attempt == 1:
                    logger.error(f"Failed to update scan: {e}")
                    raise
                await asyncio.sleep(1)

    async def get_scan(self, scan_id: str) -> dict | None:
        query = "SELECT * FROM scans WHERE scan_id = $1"
        records = await self._execute_with_retry(query, scan_id)
        return dict(records[0]) if records else None

    async def save_playbook(self, playbook: Playbook):
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

    async def get_playbooks(self, scan_id: str) -> list[dict]:
        query = "SELECT * FROM playbooks WHERE scan_id = $1"
        records = await self._execute_with_retry(query, scan_id)
        return [dict(r) for r in records]

    async def save_attack_path(self, attack_path: AttackPath):
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

    async def get_attack_paths(self, scan_id: str) -> list[dict]:
        query = "SELECT * FROM attack_paths WHERE scan_id = $1"
        records = await self._execute_with_retry(query, scan_id)
        return [dict(r) for r in records]

    async def save_pull_request(self, scan_id: str, package_name: str, pr_url: str, pr_title: str, old_version: str, new_version: str):
        pr_id = str(uuid.uuid4())
        query = """
        INSERT INTO pull_requests (
            id, scan_id, package_name, pr_url, pr_title, old_version, new_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        await self._execute_with_retry(query, pr_id, scan_id, package_name, pr_url, pr_title, old_version, new_version)

    async def get_pull_requests(self, scan_id: str) -> list[dict]:
        query = "SELECT * FROM pull_requests WHERE scan_id = $1"
        records = await self._execute_with_retry(query, scan_id)
        return [dict(r) for r in records]

    async def save_governance_event(self, event: GovernanceEvent):
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

    async def get_governance_events(self, limit: int = 50) -> list[dict]:
        query = "SELECT * FROM governance_events ORDER BY timestamp DESC LIMIT $1"
        records = await self._execute_with_retry(query, limit)
        return [dict(r) for r in records]

    async def save_red_team_result(self, result: RedTeamResult):
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

    async def get_red_team_results(self, scan_id: str) -> list[dict]:
        query = "SELECT * FROM red_team_results WHERE scan_id = $1"
        records = await self._execute_with_retry(query, scan_id)
        return [dict(r) for r in records]

    async def save_prediction(self, scan_id: str, prediction: PredictedRisk):
        pred_id = str(uuid.uuid4())
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

    async def get_predictions(self, scan_id: str) -> list[dict]:
        query = "SELECT * FROM predictions WHERE scan_id = $1"
        records = await self._execute_with_retry(query, scan_id)
        return [dict(r) for r in records]
