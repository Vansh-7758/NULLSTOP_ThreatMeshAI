async def check_prompt_safety(prompt: str) -> dict:
    issues = []
    safe = True
    risk_level = "low"
    
    p_lower = prompt.lower()
    if "select " in p_lower or "drop " in p_lower:
        issues.append("Potential SQL injection")
        safe = False
        risk_level = "high"
    if "<script>" in p_lower:
        issues.append("Potential XSS")
        safe = False
        risk_level = "high"
    if "ignore previous" in p_lower or "dan" in p_lower:
        issues.append("Potential prompt injection")
        safe = False
        risk_level = "high"
        
    return {
        "safe": safe,
        "risk_level": risk_level,
        "issues": issues,
        "sanitized_prompt": prompt.replace("<script>", "")
    }

async def validate_response(response: str) -> dict:
    issues = []
    safe = True
    r_lower = response.lower()
    
    if "password:" in r_lower or "ssn:" in r_lower:
        issues.append("Contains PII")
        safe = False
        
    return {
        "safe": safe,
        "issues": issues,
        "contains_pii": "ssn" in r_lower or "password" in r_lower,
        "contains_code": "```" in response
    }
