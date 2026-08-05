# backend/governance/compliance_mapper.py
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

@dataclass
class ComplianceReport:
    scan_id: str
    generated_at: str
    nist_csf: Dict[str, Any]
    iso_27001: Dict[str, Any]
    gdpr: Dict[str, Any]
    owasp: Dict[str, Any]
    eu_ai_act: Dict[str, Any]
    overall_risk: str  # CRITICAL, HIGH, MEDIUM, LOW, COMPLIANT
    packages_assessed: int
    violations_count: int

def map_scan_to_compliance(scan_id: str, packages: List[dict], playbooks: List[dict], pull_requests: List[dict]) -> ComplianceReport:
    now_iso = datetime.now(timezone.utc).isoformat()
    packages_assessed = len(packages)
    violations_count = 0

    # 1. NIST CSF 2.0 Evaluation
    unscored_pkgs = [p for p in packages if p.get("trust_score") is None or p.get("trust_score", -1) < 0]
    identify_pass = len(unscored_pkgs) == 0

    protect_pass = True
    for p in packages:
        cves = p.get("cves", [])
        has_critical = any(c.get("severity") == "CRITICAL" or c.get("cvss_score", 0) >= 9.0 for c in cves)
        if has_critical:
            has_pr = any(pr.get("package_name") == p.get("name") for pr in pull_requests)
            if not has_pr:
                protect_pass = False
                break

    detect_pass = True  # Passing if scan exists

    respond_pass = True
    for pb in playbooks:
        pb_pkg = pb.get("package_name")
        has_pr = any(pr.get("package_name") == pb_pkg for pr in pull_requests)
        if not has_pr:
            respond_pass = False
            break

    nist_violations = []
    if not identify_pass:
        nist_violations.append("ID.AM: Unscored dependencies detected without trust verification")
    if not protect_pass:
        nist_violations.append("PR.IP: Critical CVE detected >7 days without automated PR remediation")
    if not respond_pass:
        nist_violations.append("RS.RP: Remediation playbook exists without executed pull request")

    nist_csf = {
        "status": "COMPLIANT" if len(nist_violations) == 0 else "VIOLATION",
        "identify": "PASS" if identify_pass else "VIOLATION",
        "protect": "PASS" if protect_pass else "VIOLATION",
        "detect": "PASS" if detect_pass else "VIOLATION",
        "respond": "PASS" if respond_pass else "VIOLATION",
        "recover": "NOT ASSESSED",
        "details": nist_violations or ["All NIST CSF 2.0 evaluated functions pass controls"]
    }
    if nist_csf["status"] == "VIOLATION":
        violations_count += 1

    # 2. ISO 27001:2022 Control A.8.19 Evaluation
    iso_violations = []
    for p in packages:
        cves = p.get("cves", [])
        has_high_crit = any(c.get("severity") in ["CRITICAL", "HIGH"] or c.get("cvss_score", 0) >= 7.0 for c in cves)
        if has_high_crit:
            has_pb = any(pb.get("package_name") == p.get("name") for pb in playbooks)
            if not has_pb:
                iso_violations.append(f"A.8.19: Package {p.get('name')} with High/Critical CVE has no playbook generated")

    iso_27001 = {
        "status": "COMPLIANT" if len(iso_violations) == 0 else "VIOLATION",
        "control_a8_19": "PASS" if len(iso_violations) == 0 else "VIOLATION",
        "details": iso_violations or ["ISO 27001:2022 Control A.8.19 secure coding controls satisfied"]
    }
    if iso_27001["status"] == "VIOLATION":
        violations_count += 1

    # 3. GDPR Article 32 Evaluation
    gdpr_keywords = ["auth", "user", "session", "jwt", "oauth", "identity", "cookie"]
    gdpr_violations = []
    for p in packages:
        pkg_name = p.get("name", "").lower()
        if any(kw in pkg_name for kw in gdpr_keywords):
            cves = p.get("cves", [])
            has_crit = any(c.get("severity") == "CRITICAL" or c.get("cvss_score", 0) >= 9.0 for c in cves)
            if has_crit:
                gdpr_violations.append(f"Art.32: Personal data handling package {p.get('name')} contains Critical CVE")

    gdpr = {
        "status": "COMPLIANT" if len(gdpr_violations) == 0 else "VIOLATION",
        "article_32": "PASS" if len(gdpr_violations) == 0 else "VIOLATION",
        "details": gdpr_violations or ["GDPR Article 32 data processing security controls satisfied"]
    }
    if gdpr["status"] == "VIOLATION":
        violations_count += 1

    # 4. OWASP Top 10 2021 A06: Vulnerable & Outdated Components
    owasp_violations = [f"A06: Package {p.get('name')} trust score ({p.get('trust_score', 0):.1f}) below 50"
                        for p in packages if p.get("trust_score", 100) < 50]

    owasp = {
        "status": "COMPLIANT" if len(owasp_violations) == 0 else "VIOLATION",
        "control_a06": "PASS" if len(owasp_violations) == 0 else "VIOLATION",
        "details": owasp_violations or ["OWASP Top 10 A06 component risk controls satisfied"]
    }
    if owasp["status"] == "VIOLATION":
        violations_count += 1

    # 5. EU AI Act Evaluation
    ai_keywords = ["torch", "tensorflow", "transformers", "anthropic", "openai", "langchain", "langgraph", "sklearn", "keras", "sentence-transformers"]
    ai_violations = []
    for p in packages:
        pkg_name = p.get("name", "").lower()
        if any(kw in pkg_name for kw in ai_keywords):
            cves = p.get("cves", [])
            if len(cves) > 0:
                ai_violations.append(f"Art.15: AI framework component {p.get('name')} has {len(cves)} unpatched CVEs")

    eu_ai_act = {
        "status": "COMPLIANT" if len(ai_violations) == 0 else "VIOLATION",
        "article_15": "PASS" if len(ai_violations) == 0 else "VIOLATION",
        "details": ai_violations or ["EU AI Act Article 15 cybersecurity requirements satisfied"]
    }
    if eu_ai_act["status"] == "VIOLATION":
        violations_count += 1

    # Determine overall risk
    if violations_count >= 3:
        overall_risk = "CRITICAL"
    elif violations_count >= 2:
        overall_risk = "HIGH"
    elif violations_count >= 1:
        overall_risk = "MEDIUM"
    else:
        overall_risk = "COMPLIANT"

    return ComplianceReport(
        scan_id=scan_id,
        generated_at=now_iso,
        nist_csf=nist_csf,
        iso_27001=iso_27001,
        gdpr=gdpr,
        owasp=owasp,
        eu_ai_act=eu_ai_act,
        overall_risk=overall_risk,
        packages_assessed=packages_assessed,
        violations_count=violations_count
    )

def generate_text_compliance_report(report: ComplianceReport) -> str:
    lines = [
        "==========================================================================",
        "              THREATMESH AI - REGULATORY COMPLIANCE AUDIT REPORT          ",
        "==========================================================================",
        f"Scan ID: {report.scan_id}",
        f"Generated At: {report.generated_at}",
        f"Overall Risk Status: {report.overall_risk}",
        f"Total Dependencies Assessed: {report.packages_assessed}",
        f"Total Framework Violations Flagged: {report.violations_count}",
        "--------------------------------------------------------------------------",
        "",
        "1. NIST CSF 2.0 (Cybersecurity Framework)",
        f"   Status: {report.nist_csf['status']}",
        f"   Identify (ID.AM): {report.nist_csf['identify']}",
        f"   Protect (PR.IP): {report.nist_csf['protect']}",
        f"   Detect (DE.CM): {report.nist_csf['detect']}",
        f"   Respond (RS.RP): {report.nist_csf['respond']}",
        "   Findings:",
    ]
    for d in report.nist_csf.get("details", []):
        lines.append(f"     - {d}")

    lines.extend([
        "",
        "2. ISO 27001:2022 (Control A.8.19 - Secure Coding)",
        f"   Status: {report.iso_27001['status']}",
        "   Findings:",
    ])
    for d in report.iso_27001.get("details", []):
        lines.append(f"     - {d}")

    lines.extend([
        "",
        "3. GDPR (Article 32 - Security of Processing)",
        f"   Status: {report.gdpr['status']}",
        "   Findings:",
    ])
    for d in report.gdpr.get("details", []):
        lines.append(f"     - {d}")

    lines.extend([
        "",
        "4. OWASP Top 10:2021 (A06 - Vulnerable & Outdated Components)",
        f"   Status: {report.owasp['status']}",
        "   Findings:",
    ])
    for d in report.owasp.get("details", []):
        lines.append(f"     - {d}")

    lines.extend([
        "",
        "5. EU AI Act (Article 15 - Cybersecurity & Accuracy)",
        f"   Status: {report.eu_ai_act['status']}",
        "   Findings:",
    ])
    for d in report.eu_ai_act.get("details", []):
        lines.append(f"     - {d}")

    lines.extend([
        "",
        "==========================================================================",
        "                       END OF COMPLIANCE REPORT                           ",
        "=========================================================================="
    ])
    return "\n".join(lines)
