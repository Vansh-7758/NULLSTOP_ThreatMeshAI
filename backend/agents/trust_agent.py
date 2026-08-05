# backend/agents/trust_agent.py
import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from config import settings
from api.websocket import manager
from governance.prompt_safety import safe_anthropic_call

logger = logging.getLogger(__name__)

TRUST_AGENT_PROMPT = """You are a Trust Score & Signal Breakdown Specialist in ThreatMesh AI Council.
Explain the ADTG trust score breakdown for dependency: {package_name}@{package_version}.

Signal Breakdown Data:
- Overall Trust Score: {trust_score} / 100
- Maintainer Days Inactive: {maintainer_days_inactive}
- Has Public Exploit: {has_public_exploit}
- Total CVEs: {cve_count}

Your task: Provide a clear breakdown explanation of why this trust score was calculated.
Output MUST be a raw valid JSON object with EXACTLY these keys:
- "trust_explanation": A 2-3 sentence technical explanation for security engineers detailing which signals degraded the score most severely.
- "key_degradation_factors": Array of strings (e.g. ["Critical CVE-2021-44228 detected (-40 pts)", "Public RCE exploit code available (-20 pts)", "Maintainer inactive for 120 days (-15 pts)"]).
- "trust_trajectory": Exactly one of ["Degrading", "Stable", "Critical Drop", "Improving"].

Respond with ONLY the JSON object. Do not include markdown code block syntax or extra commentary.
"""

async def run_trust_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    package_name = state.get("package_name", "unknown")
    package_version = state.get("package_version", "1.0.0")
    trust_score = state.get("trust_score", 100.0)
    cves = state.get("cves", [])
    maintainer_days = state.get("maintainer_days_inactive", 90)
    has_public_exploit = state.get("has_public_exploit", False)
    scan_id = state.get("scan_id", "default")

    cve_count = len(cves)

    factors = []
    if cve_count > 0:
        factors.append(f"Detected {cve_count} vulnerability record(s)")
    if has_public_exploit:
        factors.append("Public exploit code available in vulnerability databases")
    if maintainer_days > 90:
        factors.append(f"Maintainer commit inactivity ({maintainer_days} days)")

    if not factors:
        factors = ["Base component risk analysis applied"]

    fallback_output = {
        "trust_explanation": f"Trust score for {package_name}@{package_version} is calculated at {trust_score:.1f}/100. Degradation is driven by {cve_count} detected vulnerability indicator(s) and operational supply chain risks.",
        "key_degradation_factors": factors,
        "trust_trajectory": "Critical Drop" if trust_score < 30 else "Degrading" if trust_score < 60 else "Stable"
    }

    output_dict = fallback_output

    if settings.ANTHROPIC_API_KEY:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt_text = TRUST_AGENT_PROMPT.format(
                package_name=package_name,
                package_version=package_version,
                trust_score=trust_score,
                maintainer_days_inactive=maintainer_days,
                has_public_exploit=has_public_exploit,
                cve_count=cve_count
            )

            raw_text, policy_res = await asyncio.wait_for(
                safe_anthropic_call(client, "claude-sonnet-4-6", "", prompt_text, 1000),
                timeout=30.0
            )

            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            try:
                parsed = json.loads(raw_text)
                if isinstance(parsed, dict) and "trust_explanation" in parsed:
                    output_dict = parsed
            except Exception:
                output_dict = {
                    "trust_explanation": raw_text[:300],
                    "key_degradation_factors": factors,
                    "trust_trajectory": "Degrading"
                }
        except Exception as e:
            logger.warning(f"Trust Agent API call failed or timed out for {package_name}: {e}")

    output_str = json.dumps(output_dict)
    one_sentence_verdict = f"Trust score {trust_score:.1f}/100 with trajectory '{output_dict.get('trust_trajectory')}' for {package_name}."

    try:
        if manager:
            await manager.broadcast({
                "event_type": "agent_completed",
                "agent_name": "Trust Agent",
                "scan_id": scan_id,
                "package_name": package_name,
                "verdict": one_sentence_verdict,
                "output": output_dict
            })
    except Exception as e:
        logger.warning(f"Error broadcasting WS event for Trust Agent: {e}")

    return {"trust_agent_output": output_str}
