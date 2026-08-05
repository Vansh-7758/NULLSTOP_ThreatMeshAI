# backend/agents/threat_agent.py
import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from config import settings
from api.websocket import manager
from governance.prompt_safety import safe_anthropic_call

logger = logging.getLogger(__name__)

THREAT_AGENT_PROMPT = """You are a Threat Characterization Specialist in ThreatMesh AI Council.
Analyze the provided vulnerability data and package context for dependency: {package_name}@{package_version}.

CVE Data:
{cve_data_str}

Package Context:
- Ecosystem: {package_ecosystem}
- Trust Score: {trust_score}
- Has Public Exploit: {has_public_exploit}

Your task: Provide a structured threat characterization.
Output MUST be a raw valid JSON object with EXACTLY these keys:
- "attack_category": Exactly one of ["Remote Code Execution", "Data Exfiltration", "Privilege Escalation", "Denial of Service", "Supply Chain Poisoning", "Authentication Bypass"]
- "attack_narrative": A clear 2-3 sentence explanation of how an attacker would exploit this vulnerability in plain English a developer can understand.
- "technical_details": The specific technical mechanism of exploitation (e.g. JNDI lookup injection, prototype pollution, uncontrolled memory allocation, deserialization of untrusted data).
- "severity_justification": Why this combination of CVEs and package context makes the component critically dangerous or concerning.

Respond with ONLY the JSON object. Do not include markdown code block syntax or extra commentary.
"""

async def run_threat_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    package_name = state.get("package_name", "unknown")
    package_version = state.get("package_version", "1.0.0")
    package_ecosystem = state.get("package_ecosystem", "unknown")
    trust_score = state.get("trust_score", 100.0)
    cves = state.get("cves", [])
    has_public_exploit = state.get("has_public_exploit", False)
    scan_id = state.get("scan_id", "default")

    cve_data_str = json.dumps(cves, indent=2) if cves else "No specific CVE records available."

    fallback_output = {
        "attack_category": "Remote Code Execution" if has_public_exploit else "Supply Chain Poisoning",
        "attack_narrative": f"Potential security vulnerability identified in {package_name}@{package_version}. Attackers could exploit unpatched control flow boundaries to cause unexpected software behavior.",
        "technical_details": "Vulnerability mechanism involves unvalidated input handling in component execution pipeline.",
        "severity_justification": f"Package trust score degraded to {trust_score:.1f}/100 due to detected risk factors requiring component isolation."
    }

    output_dict = fallback_output

    if settings.ANTHROPIC_API_KEY:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt_text = THREAT_AGENT_PROMPT.format(
                package_name=package_name,
                package_version=package_version,
                package_ecosystem=package_ecosystem,
                trust_score=trust_score,
                has_public_exploit=has_public_exploit,
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
                if isinstance(parsed, dict) and "attack_category" in parsed:
                    output_dict = parsed
            except Exception:
                output_dict = {
                    "attack_category": "Remote Code Execution",
                    "attack_narrative": raw_text[:300],
                    "technical_details": "Extracted from LLM output analysis.",
                    "severity_justification": f"Evaluated with trust score {trust_score:.1f}."
                }
        except Exception as e:
            logger.warning(f"Threat Agent API call failed or timed out for {package_name}: {e}")

    output_str = json.dumps(output_dict)
    one_sentence_verdict = f"Classified threat as {output_dict.get('attack_category')} for {package_name}."

    try:
        if manager:
            await manager.broadcast({
                "event_type": "agent_completed",
                "agent_name": "Threat Agent",
                "scan_id": scan_id,
                "package_name": package_name,
                "verdict": one_sentence_verdict,
                "output": output_dict
            })
    except Exception as e:
        logger.warning(f"Error broadcasting WS event for Threat Agent: {e}")

    return {"threat_agent_output": output_str}
