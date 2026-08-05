# backend/governance/audit_logger.py
import sys
import uuid
import logging
from governance.policy_engine import GovernancePolicyResult

logger = logging.getLogger(__name__)

# Global reference populated on app startup or request
_postgres_client = None

def set_audit_postgres_client(client):
    global _postgres_client
    _postgres_client = client

async def log_governance_event(
    event_type: str,
    prompt: str,
    response: str,
    model: str,
    policy_result: GovernancePolicyResult
) -> str:
    event_id = str(uuid.uuid4())
    try:
        from models.schemas import GovernanceEvent
        evt = GovernanceEvent(
            id=event_id,
            event_type=event_type,
            prompt=prompt[:2000] if prompt else None,
            response=response[:2000] if response else None,
            model=model,
            policy_result=policy_result.action_taken,
            risk_level=policy_result.risk_level,
            details=policy_result.details or {}
        )

        if _postgres_client:
            await _postgres_client.save_governance_event(evt)
        else:
            logger.info(f"Audit log stored in memory (event {event_id}): {policy_result.action_taken} ({policy_result.risk_level})")
    except Exception as e:
        print(f"[AUDIT LOGGER FAILURE] Failed to persist governance event {event_id}: {e}", file=sys.stderr)

    return event_id
