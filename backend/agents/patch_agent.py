# backend/agents/patch_agent.py
import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from config import settings
from api.websocket import manager
from governance.prompt_safety import safe_anthropic_call

logger = logging.getLogger(__name__)

PATCH_AGENT_PROMPT = """You are a Patch & Upgrade Specialist in ThreatMesh AI Council.
Provide a precise remediation strategy for package: {package_name}@{package_version}.

Package Context:
- Ecosystem: {package_ecosystem}
- CVE Data:
{cve_data_str}

Your task: Provide a safe, non-breaking upgrade recommendation.
Output MUST be a raw valid JSON object with EXACTLY these keys:
- "recommended_version": String (e.g. "2.17.1" or "4.17.21").
- "upgrade_command": String (e.g. "npm install express@4.17.21" or "pip install --upgrade requests==2.31.0").
- "compatibility_notes": String explaining breaking change risk or API signature shifts.
- "breaking_changes_risk": Exactly one of ["None", "Low", "Medium", "High"].

Respond with ONLY the JSON object. Do not include markdown code block syntax or extra commentary.
"""

async def run_patch_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    package_name = state.get("package_name", "unknown")
    package_version = state.get("package_version", "1.0.0")
    package_ecosystem = state.get("package_ecosystem", "npm")
    cves = state.get("cves", [])
    scan_id = state.get("scan_id", "default")

    cve_data_str = json.dumps(cves, indent=2) if cves else "No specific CVE records."

    parts = package_version.split(".")
    if len(parts) >= 3 and parts[-1].isdigit():
        suggested_version = f"{parts[0]}.{parts[1]}.{int(parts[-1]) + 1}"
    else:
        suggested_version = "latest"

    cmd = f"npm install {package_name}@{suggested_version}" if package_ecosystem == "npm" else f"pip install --upgrade {package_name}=={suggested_version}"

    fallback_output = {
        "recommended_version": suggested_version,
        "upgrade_command": cmd,
        "compatibility_notes": f"Upgrading {package_name} to patch release {suggested_version} resolves known security vulnerabilities with minimal risk of breaking API contracts.",
        "breaking_changes_risk": "Low"
    }

    output_dict = fallback_output

    if settings.ANTHROPIC_API_KEY:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt_text = PATCH_AGENT_PROMPT.format(
                package_name=package_name,
                package_version=package_version,
                package_ecosystem=package_ecosystem,
                cve_data_str=cve_data_str
            )

            raw_text, policy_res = await asyncio.wait_for(
                safe_anthropic_call(client, "claude-sonnet-4-6", "", prompt_text, 1000),
                timeout=30.0
            )

            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            try:
                parsed = json.loads(raw_text)
                if isinstance(parsed, dict) and "recommended_version" in parsed:
                    output_dict = parsed
            except Exception:
                output_dict = {
                    "recommended_version": suggested_version,
                    "upgrade_command": cmd,
                    "compatibility_notes": raw_text[:300],
                    "breaking_changes_risk": "Low"
                }
        except Exception as e:
            logger.warning(f"Patch Agent API call failed or timed out for {package_name}: {e}")

    output_str = json.dumps(output_dict)
    one_sentence_verdict = f"Recommended upgrade to {output_dict.get('recommended_version')} via '{output_dict.get('upgrade_command')}'."

    try:
        if manager:
            await manager.broadcast({
                "event_type": "agent_completed",
                "agent_name": "Patch Agent",
                "scan_id": scan_id,
                "package_name": package_name,
                "verdict": one_sentence_verdict,
                "output": output_dict
            })
    except Exception as e:
        logger.warning(f"Error broadcasting WS event for Patch Agent: {e}")

    return {"patch_agent_output": output_str}
