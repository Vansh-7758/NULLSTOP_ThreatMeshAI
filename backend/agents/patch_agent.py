import json
import logging
from anthropic import Anthropic
from config import settings

logger = logging.getLogger(__name__)

async def run(context: dict) -> dict:
    fallback = {
        "safe_version": context.get("current_version", "latest"),
        "upgrade_type": "patch",
        "breaking_changes_risk": "Low",
        "compatibility_notes": "None",
        "upgrade_command": "npm update" if context.get("ecosystem") == "npm" else "pip install --upgrade"
    }
    if not settings.ANTHROPIC_API_KEY:
        return fallback

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=30.0)
        sys_prompt = "You are a software patch analyst. Find the safest upgrade version. Suggest specific version bumps: for known packages like lodash 4.17.20 -> 4.17.21, Pillow 9.0.0 -> 10.3.0, log4j 2.14.1 -> 2.17.1. Return JSON with keys: safe_version, upgrade_type (patch/minor/major), breaking_changes_risk, compatibility_notes, upgrade_command."
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
        logger.error(f"Error in patch_agent: {e}")
        return fallback
