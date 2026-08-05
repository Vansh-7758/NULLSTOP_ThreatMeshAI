# backend/api/routes/playbooks.py
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from models.schemas import ErrorResponse

router = APIRouter()

DEFAULT_SAMPLE_PLAYBOOKS = [
    {
        "id": "pb-1",
        "scan_id": "default",
        "package_name": "log4j-core",
        "threat_summary": "Critical JNDI RCE vulnerability (CVE-2021-44228) allows unauthenticated remote code execution via LDAP lookup strings.",
        "business_impact": "High Risk of total infrastructure compromise, data exfiltration, and unauthorized root access.",
        "trust_explanation": "Trust score degraded to 10.0/100 due to CVSS 10.0 score, active public exploits, and high reachability.",
        "recommended_action": "Upgrade log4j-core to safe version 2.17.1 immediately.",
        "compliance_mapping": {
            "nist_csf": "PR.IP-01",
            "iso_27001": "A.12.6.1",
            "owasp": "A06:2021",
            "gdpr": "Article 32",
            "eu_ai_act": "Article 15"
        },
        "confidence_score": 0.98,
        "evidence_citations": ["NVD CVE-2021-44228", "GHSA-j2ge-4vhw-578n"],
        "created_at": "2026-08-01T00:00:00Z"
    },
    {
        "id": "pb-2",
        "scan_id": "default",
        "package_name": "struts2-core",
        "threat_summary": "OGNL expression injection vulnerability (CVE-2017-5638) in Jakarta Multipart parser allows remote command execution.",
        "business_impact": "Critical risk of arbitrary command execution on production web application servers.",
        "trust_explanation": "Trust score degraded to 15.0/100 due to CVSS 10.0 and active exploit payloads.",
        "recommended_action": "Upgrade struts2-core from 2.3.12 to 2.5.30 or migrate to modern framework.",
        "compliance_mapping": {
            "nist_csf": "PR.IP-01",
            "iso_27001": "A.12.6.1",
            "owasp": "A06:2021"
        },
        "confidence_score": 0.95,
        "evidence_citations": ["NVD CVE-2017-5638"],
        "created_at": "2026-08-01T00:00:00Z"
    }
]

@router.get("/scan/{scan_id}/playbooks")
async def get_playbooks(scan_id: str, request: Request):
    try:
        if hasattr(request.app.state, 'postgres') and request.app.state.postgres:
            playbooks = await request.app.state.postgres.get_playbooks(scan_id)
            if playbooks:
                return playbooks
        return DEFAULT_SAMPLE_PLAYBOOKS
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="PlaybookError", message=str(e)).model_dump())
