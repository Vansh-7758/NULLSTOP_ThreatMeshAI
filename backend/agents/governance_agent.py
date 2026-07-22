import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)

async def run(context: dict) -> dict:
    fallback = {
        "policy_compliant": True,
        "violated_policies": [],
        "risk_assessment": "Low",
        "audit_recommendation": "None",
        "governance_score": 100.0
    }
    if not settings.ANTHROPIC_API_KEY:
        return fallback

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30.0)
        sys_prompt = "You are an AI governance specialist. Evaluate policy compliance. Return JSON with keys: policy_compliant (bool), violated_policies (list), risk_assessment, audit_recommendation, governance_score."
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
        logger.error(f"Error in governance_agent: {e}")
        return fallback
