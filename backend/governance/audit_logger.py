from models.schemas import GovernanceEvent, AIHealthMetrics

class AuditLogger:
    async def log_event(self, postgres_client, event: GovernanceEvent):
        # mock insert
        pass

    async def get_audit_trail(self, postgres_client, limit=50) -> list[GovernanceEvent]:
        # mock retrieve
        return []

    async def get_metrics(self, postgres_client) -> AIHealthMetrics:
        # mock compute
        return AIHealthMetrics()
