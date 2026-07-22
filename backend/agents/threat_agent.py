import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)

async def run(context: dict) -> dict:
    fallback = {
        "threat_type": "Unknown",
        "exploit_method": "Unknown",
        "attack_category": "unknown",
        "severity_assessment": "Medium",
        "affected_components": "Unknown",
        "mitigation_urgency": "Medium"
    }
    if not settings.ANTHROPIC_API_KEY:
        return fallback

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30.0)
        sys_prompt = "You are a cybersecurity threat analyst. Analyze the CVE data and characterize the threat. Return a JSON object with keys: threat_type, exploit_method, attack_category (RCE/data_exfil/privilege_escalation/dos/supply_chain), severity_assessment, affected_components, mitigation_urgency."
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
        logger.error(f"Error in threat_agent: {e}")
        return fallback
