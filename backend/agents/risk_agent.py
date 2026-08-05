# backend/agents/risk_agent.py
import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from config import settings
from api.websocket import manager
from governance.prompt_safety import safe_anthropic_call

logger = logging.getLogger(__name__)

RISK_AGENT_PROMPT = """You are a Risk & Business Impact Specialist in ThreatMesh AI Council.
Analyze the business impact and operational blast radius for dependency: {package_name}@{package_version}.

Reachability Attack Path:
{attack_path_str}

Package Context:
- Trust Score: {trust_score}
- CVE Count: {cve_count}

Your task: Provide a structured business impact assessment.
Output MUST be a raw valid JSON object with EXACTLY these keys:
- "affected_services": Array of strings (e.g. ["Authentication Microservice", "User Profile API", "Payment Processing Pipeline"]).
- "data_at_risk": String (e.g. "User JWT Tokens, PII Data, Internal AWS Session Credentials").
- "blast_radius": Integer from 1 to 10 (1 = isolated internal helper, 10 = core transit node impacting entire enterprise cluster).
- "business_impact_severity": Exactly one of ["Critical", "High", "Medium", "Low"].
- "impact_narrative": A clear 2-3 sentence business summary explaining the financial, operational, and reputational risk if exploited.

Respond with ONLY the JSON object. Do not include markdown code block syntax or extra commentary.
"""

async def run_risk_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    package_name = state.get("package_name", "unknown")
    package_version = state.get("package_version", "1.0.0")
    trust_score = state.get("trust_score", 100.0)
    cves = state.get("cves", [])
    attack_path = state.get("attack_path", [])
    scan_id = state.get("scan_id", "default")

    attack_path_str = " -> ".join(attack_path) if attack_path else f"Direct dependency in root application ({package_name})"
    cve_count = len(cves)

    fallback_output = {
        "affected_services": ["Core Application Pipeline", "Runtime Execution Layer"],
        "data_at_risk": "Application Memory & Operational Session Data",
        "blast_radius": 8 if trust_score < 40 else 5,
        "business_impact_severity": "Critical" if trust_score < 30 else "High" if trust_score < 50 else "Medium",
        "impact_narrative": f"Exploitation of {package_name}@{package_version} threatens runtime execution integrity. A breach in this component exposes downstream API handlers to unauthorized data access."
    }

    output_dict = fallback_output

    if settings.ANTHROPIC_API_KEY:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt_text = RISK_AGENT_PROMPT.format(
                package_name=package_name,
                package_version=package_version,
                attack_path_str=attack_path_str,
                trust_score=trust_score,
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
                if isinstance(parsed, dict) and "blast_radius" in parsed:
                    output_dict = parsed
            except Exception:
                output_dict = {
                    "affected_services": ["API Service", "Database Gateway"],
                    "data_at_risk": "Application State",
                    "blast_radius": 7,
                    "business_impact_severity": "High",
                    "impact_narrative": raw_text[:300]
                }
        except Exception as e:
            logger.warning(f"Risk Agent API call failed or timed out for {package_name}: {e}")

    output_str = json.dumps(output_dict)
    one_sentence_verdict = f"Assessed blast radius as {output_dict.get('blast_radius')}/10 ({output_dict.get('business_impact_severity')} Severity) for {package_name}."

    try:
        if manager:
            await manager.broadcast({
                "event_type": "agent_completed",
                "agent_name": "Risk Agent",
                "scan_id": scan_id,
                "package_name": package_name,
                "verdict": one_sentence_verdict,
                "output": output_dict
            })
    except Exception as e:
        logger.warning(f"Error broadcasting WS event for Risk Agent: {e}")

    return {"risk_agent_output": output_str}
