from models.schemas import GovernanceEvent, PolicyResult, RiskLevel

class PolicyEngine:
    def __init__(self):
        self.policies = [
            {"name": "no_sql_injection", "rules": ["SELECT", "UNION", "DROP"], "severity": "high"},
            {"name": "no_pii_exposure", "rules": ["SSN", "credit card", "password"], "severity": "critical"},
            {"name": "no_harmful_content", "rules": ["malware", "exploit", "weapon"], "severity": "critical"},
            {"name": "no_jailbreak", "rules": ["ignore previous", "pretend you are", "DAN"], "severity": "high"},
            {"name": "content_safety", "rules": ["hate", "toxic"], "severity": "medium"}
        ]

    async def check_prompt(self, prompt: str, model: str) -> GovernanceEvent:
        violations = []
        p_lower = prompt.lower()
        risk_level = RiskLevel.LOW
        result = PolicyResult.ALLOWED
        
        for pol in self.policies:
            for rule in pol["rules"]:
                if rule.lower() in p_lower:
                    violations.append(pol["name"])
                    result = PolicyResult.BLOCKED
                    if pol["severity"] == "critical":
                        risk_level = RiskLevel.CRITICAL
                    elif pol["severity"] == "high" and risk_level != RiskLevel.CRITICAL:
                        risk_level = RiskLevel.HIGH
                    elif risk_level == RiskLevel.LOW:
                        risk_level = RiskLevel.MEDIUM

        return GovernanceEvent(
            event_type="prompt_check",
            prompt=prompt,
            model=model,
            policy_result=result,
            risk_level=risk_level,
            details={"violations": violations}
        )

    def get_policies(self) -> list[dict]:
        return self.policies

    def add_policy(self, name, rules, severity):
        self.policies.append({"name": name, "rules": rules, "severity": severity})
