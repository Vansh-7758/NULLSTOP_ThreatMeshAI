import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)

async def run(context: dict) -> dict:
    fallback = {
        "affected_services": [],
        "data_at_risk": "Unknown",
        "business_impact_severity": "medium",
        "estimated_blast_radius": "Unknown",
        "recommended_priority": "Medium"
    }
    if not settings.ANTHROPIC_API_KEY:
        return fallback

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30.0)
        sys_prompt = "You are a business risk analyst. Assess the business impact of the vulnerability. Return a JSON object with keys: affected_services, data_at_risk, business_impact_severity (critical/high/medium/low), estimated_blast_radius, recommended_priority."
        prompt = f"Context: {json.dumps(context)}\nRespond with JSON only."
        
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=sys_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        try:
            return json.loads(response.content[0].text)
        except Exception:
            return fallback
    except Exception as e:
        logger.error(f"Error in risk_agent: {e}")
        return fallback
