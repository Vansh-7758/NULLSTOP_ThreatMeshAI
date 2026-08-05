# backend/agents/compliance_agent.py
import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from config import settings
from api.websocket import manager
from governance.prompt_safety import safe_anthropic_call

logger = logging.getLogger(__name__)

COMPLIANCE_AGENT_PROMPT = """You are a Regulatory Compliance Specialist in ThreatMesh AI Council.
Map the security vulnerabilities in dependency {package_name}@{package_version} against compliance frameworks.

Vulnerability Data:
- Trust Score: {trust_score}
- CVE Count: {cve_count}

Your task: Provide a structured compliance mapping.
Output MUST be a raw valid JSON object with EXACTLY these keys:
- "nist_csf": String (e.g. "DE.CM-4: Vulnerable software components must be identified and remediated").
- "mitre_attack": String (e.g. "T1190: Exploit Public-Facing Application / T1059: Command and Scripting Interpreter").
- "owasp": String (e.g. "A06:2021 - Vulnerable and Outdated Components").
- "iso_27001": String (e.g. "A.12.6.1: Technical Vulnerability Management").
- "eu_ai_act": String (e.g. "Article 15: Cybersecurity & System Robustness requirements").

Respond with ONLY the JSON object. Do not include markdown code block syntax or extra commentary.
"""

async def run_compliance_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    package_name = state.get("package_name", "unknown")
    package_version = state.get("package_version", "1.0.0")
    trust_score = state.get("trust_score", 100.0)
    cves = state.get("cves", [])
    scan_id = state.get("scan_id", "default")

    cve_count = len(cves)

    fallback_output = {
        "nist_csf": "DE.CM-4: Software Component Vulnerability Monitoring",
        "mitre_attack": "T1190: Exploit Public-Facing Application",
        "owasp": "A06:2021 Vulnerable and Outdated Components",
        "iso_27001": "A.12.6.1 Technical Vulnerability Management",
        "eu_ai_act": "Article 15 Cybersecurity & Robustness Standards"
    }

    output_dict = fallback_output

    if settings.ANTHROPIC_API_KEY:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt_text = COMPLIANCE_AGENT_PROMPT.format(
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
                if isinstance(parsed, dict) and "owasp" in parsed:
                    output_dict = parsed
            except Exception:
                output_dict = {
                    "nist_csf": "DE.CM-4",
                    "mitre_attack": "T1190",
                    "owasp": raw_text[:300],
                    "iso_27001": "A.12.6.1",
                    "eu_ai_act": "Article 15"
                }
        except Exception as e:
            logger.warning(f"Compliance Agent API call failed or timed out for {package_name}: {e}")

    output_str = json.dumps(output_dict)
    one_sentence_verdict = f"Mapped compliance violations across NIST, MITRE {output_dict.get('mitre_attack')}, and OWASP {output_dict.get('owasp')}."

    try:
        if manager:
            await manager.broadcast({
                "event_type": "agent_completed",
                "agent_name": "Compliance Agent",
                "scan_id": scan_id,
                "package_name": package_name,
                "verdict": one_sentence_verdict,
                "output": output_dict
            })
    except Exception as e:
        logger.warning(f"Error broadcasting WS event for Compliance Agent: {e}")

    return {"compliance_agent_output": output_str}
