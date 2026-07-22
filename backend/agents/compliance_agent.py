import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)

async def run(context: dict) -> dict:
    fallback = {
        "nist_csf_functions": ["IDENTIFY", "PROTECT"],
        "mitre_attack_techniques": [],
        "owasp_category": "A06:2021-Vulnerable and Outdated Components",
        "eu_ai_act_relevant": False,
        "iso_27001_controls": [],
        "compliance_gaps": "Unknown",
        "remediation_timeline": "30 days"
    }
    if not settings.ANTHROPIC_API_KEY:
        return fallback

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30.0)
        sys_prompt = "You are a regulatory compliance analyst. Map findings to frameworks. Return JSON with keys: nist_csf_functions (list), mitre_attack_techniques (list), owasp_category, eu_ai_act_relevant (bool), iso_27001_controls (list), compliance_gaps, remediation_timeline."
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
        logger.error(f"Error in compliance_agent: {e}")
        return fallback
