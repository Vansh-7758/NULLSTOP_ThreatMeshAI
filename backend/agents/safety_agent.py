# backend/agents/safety_agent.py
import json
import asyncio
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from config import settings
from api.websocket import manager
from governance.prompt_safety import safe_anthropic_call

logger = logging.getLogger(__name__)

SAFETY_AGENT_PROMPT = """You are an AI Safety & Pipeline Integrity Specialist in ThreatMesh AI Council.
Evaluate AI safety, hallucination risk, prompt injection vectors, and data poisoning risks for dependency {package_name}@{package_version}.

Package Context:
- Trust Score: {trust_score}
- CVE Count: {cve_count}

Your task: Provide a structured AI safety assessment.
Output MUST be a raw valid JSON object with EXACTLY these keys:
- "safety_score": Integer (0 to 100, where 100 = completely safe, <50 = severe AI pipeline vulnerability).
- "general_safety_assessment": A 2-3 sentence evaluation of prompt injection, model weight tampering, or data poisoning risks.

Respond with ONLY the JSON object. Do not include markdown code block syntax or extra commentary.
"""

async def run_safety_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    package_name = state.get("package_name", "unknown")
    package_version = state.get("package_version", "1.0.0")
    trust_score = state.get("trust_score", 100.0)
    cves = state.get("cves", [])
    scan_id = state.get("scan_id", "default")

    cve_count = len(cves)

    fallback_output = {
        "safety_score": int(trust_score),
        "general_safety_assessment": f"Evaluated AI supply chain safety for {package_name}@{package_version}. Component trust score {trust_score:.1f}/100 indicates potential exposure to unvalidated data processing pipelines."
    }

    output_dict = fallback_output

    if settings.ANTHROPIC_API_KEY:
        try:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt_text = SAFETY_AGENT_PROMPT.format(
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
                if isinstance(parsed, dict) and "safety_score" in parsed:
                    output_dict = parsed
            except Exception:
                output_dict = {
                    "safety_score": int(trust_score),
                    "general_safety_assessment": raw_text[:300]
                }
        except Exception as e:
            logger.warning(f"Safety Agent API call failed or timed out for {package_name}: {e}")

    output_str = json.dumps(output_dict)
    one_sentence_verdict = f"Assessed AI safety score as {output_dict.get('safety_score')}/100 for {package_name}."

    try:
        if manager:
            await manager.broadcast({
                "event_type": "agent_completed",
                "agent_name": "Safety Agent",
                "scan_id": scan_id,
                "package_name": package_name,
                "verdict": one_sentence_verdict,
                "output": output_dict
            })
    except Exception as e:
        logger.warning(f"Error broadcasting WS event for Safety Agent: {e}")

    return {"safety_agent_output": output_str}
