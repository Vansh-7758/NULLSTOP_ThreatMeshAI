import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)

async def run(context: dict) -> dict:
    fallback = {
        "trust_verdict": "Neutral",
        "score_explanation": "Default explanation",
        "key_risk_signals": [],
        "confidence_level": "Medium",
        "recommendation": "Monitor"
    }
    if not settings.ANTHROPIC_API_KEY:
        return fallback

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30.0)
        sys_prompt = "You are a trust and reputation analyst. Explain the trust score. Return JSON with keys: trust_verdict, score_explanation, key_risk_signals, confidence_level, recommendation."
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
        logger.error(f"Error in trust_agent: {e}")
        return fallback
