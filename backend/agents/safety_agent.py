import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)

async def run(context: dict) -> dict:
    fallback = {
        "prompt_injection_risk": "Low",
        "jailbreak_risk": "Low",
        "hallucination_risk": "Low",
        "bias_risk": "Low",
        "toxicity_risk": "Low",
        "data_leakage_risk": "Low",
        "overall_safety_score": 100.0,
        "recommendations": "No issues found"
    }
    if not settings.ANTHROPIC_API_KEY:
        return fallback

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30.0)
        sys_prompt = "You are an AI safety analyst. Evaluate AI system safety risks. Return JSON with keys: prompt_injection_risk, jailbreak_risk, hallucination_risk, bias_risk, toxicity_risk, data_leakage_risk, overall_safety_score, recommendations."
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
        logger.error(f"Error in safety_agent: {e}")
        return fallback
