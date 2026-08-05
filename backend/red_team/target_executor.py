# backend/red_team/target_executor.py
import asyncio
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

# Concurrency semaphore: maximum of 2 simultaneous outbound calls per process
_EXECUTOR_SEMAPHORE = asyncio.Semaphore(2)


def extract_response_text(resp_json: Any, path_str: str = "response.text") -> str:
    """Safe nested JSON traversal according to configured response field path.
    Supports dot-notation (e.g., 'data.reply', 'choices.0.message.content').
    Never throws an exception; falls back to common text keys if path missing.
    """
    if isinstance(resp_json, str):
        return resp_json

    if not isinstance(resp_json, (dict, list)):
        return str(resp_json) if resp_json is not None else ""

    # Try explicit configured path traversal
    if path_str:
        tokens = path_str.strip().split(".")
        curr = resp_json
        found = True

        for tok in tokens:
            if isinstance(curr, dict) and tok in curr:
                curr = curr[tok]
            elif isinstance(curr, list) and tok.isdigit():
                idx = int(tok)
                if 0 <= idx < len(curr):
                    curr = curr[idx]
                else:
                    found = False
                    break
            else:
                found = False
                break

        if found and curr is not None:
            if isinstance(curr, str):
                return curr
            if isinstance(curr, (int, float, bool)):
                return str(curr)
            if isinstance(curr, (dict, list)):
                # If path returned sub-dict, look for text inside
                for subk in ["text", "reply", "message", "content", "answer"]:
                    if isinstance(curr, dict) and subk in curr and isinstance(curr[subk], str):
                        return curr[subk]

    # Fallback inspection of common response keys
    if isinstance(resp_json, dict):
        for k in ["reply", "response", "text", "message", "content", "output", "answer", "result"]:
            if k in resp_json and isinstance(resp_json[k], str):
                return resp_json[k]
            if k in resp_json and isinstance(resp_json[k], dict):
                sub_val = extract_response_text(resp_json[k], "")
                if sub_val:
                    return sub_val

    return str(resp_json)


def shape_request_payload(prompt: str, product_type: str = "customer_chatbot") -> Dict[str, Any]:
    """Shapes outbound JSON request body according to company AI product type."""
    ptype = (product_type or "customer_chatbot").lower()

    if ptype in ["content_generation_api", "content_generation"]:
        return {"prompt": prompt, "input": prompt}
    elif ptype in ["recommendation_system", "recommendation"]:
        return {"query": prompt, "input_text": prompt}
    elif ptype in ["document_analysis", "document"]:
        return {"document_text": prompt, "query": prompt}
    else:  # customer_chatbot, internal_assistant, other
        return {"message": prompt, "prompt": prompt}


async def execute_target_prompt(
    prompt: str,
    endpoint_url: str,
    product_type: str = "customer_chatbot",
    auth_header_name: str = "Authorization",
    auth_scheme: str = "Bearer",
    decrypted_api_key: Optional[str] = None,
    response_field_path: str = "response.text"
) -> str:
    """Executes a single test prompt against a company's live AI endpoint using httpx.AsyncClient.
    Applies 15s timeout, 1 retry on 5xx status codes, and 2-call concurrency semaphore.
    """
    async with _EXECUTOR_SEMAPHORE:
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "User-Agent": "ThreatMesh-AI-RedTeam-Simulator/1.0"
        }

        if decrypted_api_key:
            header_key = auth_header_name or "Authorization"
            scheme_prefix = f"{auth_scheme.strip()} " if auth_scheme and auth_scheme.strip() else ""
            headers[header_key] = f"{scheme_prefix}{decrypted_api_key.strip()}"

        payload = shape_request_payload(prompt, product_type)
        timeout = httpx.Timeout(15.0, connect=5.0)

        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=timeout, verify=False) as client:
                    resp = await client.post(endpoint_url, json=payload, headers=headers)

                    if resp.status_code >= 500 and attempt == 0:
                        logger.warning(f"Target endpoint returned {resp.status_code}, retrying once: {endpoint_url}")
                        await asyncio.sleep(1.0)
                        continue

                    if resp.status_code in [200, 201, 202]:
                        try:
                            resp_json = resp.json()
                            return extract_response_text(resp_json, response_field_path)
                        except Exception:
                            return resp.text or "[Empty HTTP 200 Response]"
                    else:
                        return f"[Target HTTP Error {resp.status_code}: {resp.text[:200]}]"

            except httpx.TimeoutException:
                if attempt == 0:
                    await asyncio.sleep(1.0)
                    continue
                return "[Target Error: Request Timed Out (15s limit exceeded)]"
            except Exception as e:
                logger.warning(f"Target execution attempt {attempt+1} failed for {endpoint_url}: {e}")
                if attempt == 0:
                    await asyncio.sleep(1.0)
                    continue
                return f"[Target Connection Error: {str(e)}]"

    return "[Target Error: Max retries exceeded]"


async def execute_internal_demo_prompt(prompt: str, vector_id: str) -> str:
    """Fallback simulation for internal demo mode testing ThreatMesh's own agents."""
    await asyncio.sleep(0.3)  # Brief simulated latency

    v = vector_id.lower()
    p = prompt.lower()

    if "prompt_injection" in v:
        return "Refused: ThreatMesh AI Council enforces system instructions. Hidden injection instructions ignored."
    elif "jailbreak" in v:
        return "ThreatMesh Guardrail Policy: Roleplay and hypothetical safety bypass requests are strictly prohibited."
    elif "hallucination" in v:
        return "Verification Warning: The referenced CVE or statistic could not be validated in official security databases."
    elif "data_leakage" in v:
        return "Access Denied: Internal system prompts and developer notes are non-exportable within ThreatMesh perimeter."
    elif "system_prompt_override" in v:
        return "Instruction Immutable: Mid-conversation system prompt overrides are blocked by council safety layer."
    elif "agent_hijacking" in v:
        return "Workflow Safety Notice: Downstream tool execution commands neutralized. Unsafe action prevented."
    elif "toxicity_and_bias" in v:
        return "Content Filter Triggered: Disguised discriminatory or harmful requests violate ThreatMesh safety guidelines."
    elif "rag_poisoning" in v:
        return "Context Integrity Warning: Unverified document claim detected and filtered from grounded answer."

    return "ThreatMesh AI Agent: Request evaluated and processed securely."
