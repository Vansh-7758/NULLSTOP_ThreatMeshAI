# backend/agents/governance_agent.py
import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from config import settings
from api.websocket import manager
from governance.prompt_safety import safe_anthropic_call

logger = logging.getLogger(__name__)

GOVERNANCE_AGENT_PROMPT = """You are a Corporate Governance & Audit Specialist in ThreatMesh AI Council.
Audit corporate policy compliance and enterprise risk exposure for dependency {package_name}@{package_version}.

Package Context:
- Trust Score: {trust_score}
- CVE Count: {cve_count}

Your task: Provide a structured corporate governance verdict.
Output MUST be a raw valid JSON object with EXACTLY these keys:
- "governance_risk_level": Exactly one of ["Critical Risk", "High Risk", "Moderate Risk", "Low Risk"].
- "violations": Array of strings (e.g. ["Deployment of Unapproved Dependency Version", "Violation of Section 4.2 Software Procurement Policy", "Unmitigated Remote Code Execution Vulnerability in Production"]).

Respond with ONLY the JSON object. Do not include markdown code block syntax or extra commentary.
"""

async def run_governance_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    package_name = state.get("package_name", "unknown")
    package_version = state.get("package_version", "1.0.0")
    trust_score = state.get("trust_score", 100.0)
    cves = state.get("cves", [])
    scan_id = state.get("scan_id", "default")

    cve_count = len(cves)

    violations = []
    if trust_score < 30:
        violations.append("Violation of Enterprise Secure Coding Standard Section 4.1 (Critical CVE)")
        violations.append("Unmitigated Remote Code Execution Vulnerability in Production Cluster")
    elif trust_score < 50:
        violations.append("Deployment of Unapproved Component Version with High Vulnerability Profile")

    if not violations:
        violations = ["Standard software procurement review required"]

    fallback_output = {
        "governance_risk_level": "Critical Risk" if trust_score < 30 else "High Risk" if trust_score < 50 else "Moderate Risk",
        "violations": violations
    }

    output_dict = fallback_output

    if settings.ANTHROPIC_API_KEY:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt_text = GOVERNANCE_AGENT_PROMPT.format(
                package_name=package_name,
                package_version=package_version,
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
                if isinstance(parsed, dict) and "governance_risk_level" in parsed:
                    output_dict = parsed
            except Exception:
                output_dict = {
                    "governance_risk_level": "High Risk",
                    "violations": violations
                }
        except Exception as e:
            logger.warning(f"Governance Agent API call failed or timed out for {package_name}: {e}")

    output_str = json.dumps(output_dict)
    one_sentence_verdict = f"Issued governance risk verdict of '{output_dict.get('governance_risk_level')}' for {package_name}."

    try:
        if manager:
            await manager.broadcast({
                "event_type": "agent_completed",
                "agent_name": "Governance Agent",
                "scan_id": scan_id,
                "package_name": package_name,
                "verdict": one_sentence_verdict,
                "output": output_dict
            })
    except Exception as e:
        logger.warning(f"Error broadcasting WS event for Governance Agent: {e}")

    return {"governance_agent_output": output_str}
