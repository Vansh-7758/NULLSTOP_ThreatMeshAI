# backend/governance/policy_engine.py
import re
import asyncio
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

@dataclass
class GovernancePolicyResult:
    allowed: bool
    policy_triggered: Optional[str]
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW, SAFE
    details: Dict[str, Any] = field(default_factory=dict)
    action_taken: str = "ALLOWED"  # BLOCKED, ALLOWED, FLAGGED

# ── Module-level Compiled Regex Constants ──

SQLI_PATTERNS = [
    re.compile(r"(?i)\bSELECT\b.*"),
    re.compile(r"(?i)\bDROP\s+TABLE\b"),
    re.compile(r"(?i)\bUNION\s+SELECT\b"),
    re.compile(r"(?i)'\s*OR\s*['\"]?1['\"]?\s*=\s*['\"]?1"),
    re.compile(r"(?i)\bINSERT\s+INTO\b"),
    re.compile(r"(?i)\bDELETE\s+FROM\b"),
    re.compile(r"(?i)\bUPDATE\b.*\bSET\b")
]

PII_SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
PII_CARD_PATTERN = re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b")
PII_PASSWORD_PATTERN = re.compile(r"(?i)\bpassword\s*[:=]\s*\S+")
PII_KEY_PATTERN = re.compile(r"-----BEGIN (?:RSA )?PRIVATE KEY-----")

HARMFUL_KEYWORDS = [
    "create malware",
    "write exploit",
    "generate shellcode",
    "bypass authentication",
    "craft payload",
    "reverse shell",
    "keylogger",
    "rootkit",
    "ransomware"
]

JAILBREAK_PATTERNS = [
    re.compile(r"(?i)\bdan\b.*"),
    re.compile(r"(?i)ignore\s+previous\s+instructions"),
    re.compile(r"(?i)ignore\s+your\s+instructions"),
    re.compile(r"(?i)disregard\s+your\s+guidelines"),
    re.compile(r"(?i)pretend\s+you\s+are"),
    re.compile(r"(?i)forget\s+everything")
]

CONTENT_SAFETY_PATTERNS = [
    re.compile(r"(?i)threaten\s+violence"),
    re.compile(r"(?i)explicit\s+harassment"),
    re.compile(r"(?i)hate\s+speech"),
    re.compile(r"(?i)self-harm")
]

def check_prompt_safety(prompt: str, response: str = "", model: str = "claude-sonnet-4-6", event_type: str = "internal_ai_check") -> GovernancePolicyResult:
    combined_text = f"{prompt}\n{response}"

    # Policy GOV-P1: no_sql_injection
    for pattern in SQLI_PATTERNS:
        if pattern.search(combined_text):
            res = GovernancePolicyResult(
                allowed=False,
                policy_triggered="GOV-P1: no_sql_injection",
                risk_level="CRITICAL",
                details={
                    "policy": "GOV-P1",
                    "reason": "SQL injection syntax pattern detected in prompt or response text.",
                    "matched_pattern": pattern.pattern
                },
                action_taken="BLOCKED"
            )
            _schedule_audit_log(event_type, prompt, response, model, res)
            return res

    # Policy GOV-P2: no_pii_exposure
    if PII_SSN_PATTERN.search(combined_text) or PII_CARD_PATTERN.search(combined_text) or \
       PII_PASSWORD_PATTERN.search(combined_text) or PII_KEY_PATTERN.search(combined_text):
        res = GovernancePolicyResult(
            allowed=False,
            policy_triggered="GOV-P2: no_pii_exposure",
            risk_level="HIGH",
            details={
                "policy": "GOV-P2",
                "reason": "Sensitive PII, credentials, or private key data detected in stream."
            },
            action_taken="BLOCKED"
        )
        _schedule_audit_log(event_type, prompt, response, model, res)
        return res

    # Policy GOV-P3: no_harmful_content
    combined_lower = combined_text.lower()
    for kw in HARMFUL_KEYWORDS:
        if kw in combined_lower:
            res = GovernancePolicyResult(
                allowed=False,
                policy_triggered="GOV-P3: no_harmful_content",
                risk_level="CRITICAL",
                details={
                    "policy": "GOV-P3",
                    "reason": f"Exploit generation or weaponization keyword '{kw}' detected.",
                    "keyword": kw
                },
                action_taken="BLOCKED"
            )
            _schedule_audit_log(event_type, prompt, response, model, res)
            return res

    # Policy GOV-P4: no_jailbreak
    for pattern in JAILBREAK_PATTERNS:
        if pattern.search(combined_text):
            res = GovernancePolicyResult(
                allowed=False,
                policy_triggered="GOV-P4: no_jailbreak",
                risk_level="HIGH",
                details={
                    "policy": "GOV-P4",
                    "reason": "Adversarial jailbreak or instruction override phrase detected.",
                    "matched_pattern": pattern.pattern
                },
                action_taken="BLOCKED"
            )
            _schedule_audit_log(event_type, prompt, response, model, res)
            return res

    # Policy GOV-P5: content_safety
    for pattern in CONTENT_SAFETY_PATTERNS:
        if pattern.search(combined_text):
            res = GovernancePolicyResult(
                allowed=False,
                policy_triggered="GOV-P5: content_safety",
                risk_level="MEDIUM",
                details={
                    "policy": "GOV-P5",
                    "reason": "Toxic language or harassment phrase detected in safety evaluation.",
                    "matched_pattern": pattern.pattern
                },
                action_taken="BLOCKED"
            )
            _schedule_audit_log(event_type, prompt, response, model, res)
            return res

    # All checks passed
    res = GovernancePolicyResult(
        allowed=True,
        policy_triggered=None,
        risk_level="SAFE",
        details={
            "status": "All 5 policy checks passed successfully",
            "checked_policies": ["GOV-P1", "GOV-P2", "GOV-P3", "GOV-P4", "GOV-P5"]
        },
        action_taken="ALLOWED"
    )
    _schedule_audit_log(event_type, prompt, response, model, res)
    return res

def _schedule_audit_log(event_type: str, prompt: str, response: str, model: str, policy_result: GovernancePolicyResult):
    try:
        from governance.audit_logger import log_governance_event
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(log_governance_event(event_type, prompt, response, model, policy_result))
    except Exception as e:
        logger.debug(f"Audit log task scheduling skipped: {e}")
