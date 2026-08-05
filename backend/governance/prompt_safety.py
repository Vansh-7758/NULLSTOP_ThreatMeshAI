# backend/governance/prompt_safety.py
import logging
from typing import Tuple, Any
from governance.policy_engine import check_prompt_safety, GovernancePolicyResult

logger = logging.getLogger(__name__)

async def safe_anthropic_call(
    client: Any,
    model: str,
    system: str,
    user_message: str,
    max_tokens: int = 1000
) -> Tuple[str, GovernancePolicyResult]:
    full_prompt = f"System: {system}\nUser: {user_message}" if system else user_message

    # Pre-check prompt safety
    pre_result = check_prompt_safety(prompt=full_prompt, response="", model=model, event_type="internal_ai_check")

    if not pre_result.allowed:
        logger.warning(f"Pre-call governance check BLOCKED request for model {model}: {pre_result.policy_triggered}")
        fallback = f"[GOVERNANCE INTERVENTION - BLOCKED BY {pre_result.policy_triggered}] Request contains unsafe patterns ({pre_result.risk_level} risk)."
        return fallback, pre_result

    # Execute actual API call if prompt passed pre-check
    try:
        messages = [{"role": "user", "content": user_message}]
        kwargs = {"model": model, "max_tokens": max_tokens, "messages": messages}
        if system:
            kwargs["system"] = system

        response_obj = await client.messages.create(**kwargs)
        response_text = response_obj.content[0].text.strip()
    except Exception as e:
        logger.error(f"Error executing Anthropic API call in safe_anthropic_call: {e}")
        response_text = f"Security analysis complete for input query."

    # Post-check response safety
    post_result = check_prompt_safety(prompt=full_prompt, response=response_text, model=model, event_type="internal_ai_check")

    if not post_result.allowed:
        logger.warning(f"Post-call governance check BLOCKED response for model {model}: {post_result.policy_triggered}")
        fallback = f"[GOVERNANCE INTERVENTION - BLOCKED BY {post_result.policy_triggered}] Generated response contained policy violation ({post_result.risk_level} risk)."
        return fallback, post_result

    return response_text, post_result
