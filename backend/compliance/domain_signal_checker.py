# backend/compliance/domain_signal_checker.py
import socket
import ssl
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
import logging
import httpx

logger = logging.getLogger(__name__)


@dataclass
class DomainSignalCheck:
    check_name: str
    status: str  # PASS, FAIL, PARTIAL, UNKNOWN
    description: str
    detail: str


@dataclass
class DomainSignalReport:
    domain: str
    checked_at: str
    overall_signal_score: float  # 0-100 percentage of passing checks
    checks: List[DomainSignalCheck] = field(default_factory=list)


async def run_domain_signal_checks(domain: str) -> DomainSignalReport:
    """Fetches public domain security signals using httpx and Python socket DNS inspection."""
    cleaned_domain = domain.strip().lower().replace("https://", "").replace("http://", "").split("/")[0]
    checked_at_iso = datetime.now(timezone.utc).isoformat()
    checks: List[DomainSignalCheck] = []

    if not cleaned_domain:
        return DomainSignalReport(
            domain=domain,
            checked_at=checked_at_iso,
            overall_signal_score=0.0,
            checks=[
                DomainSignalCheck(
                    check_name="Domain Validation",
                    status="UNKNOWN",
                    description="No valid domain provided for public signal enrichment.",
                    detail="Domain parameter empty or invalid."
                )
            ]
        )

    # ── Check 1: HTTPS Enforcement ──
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            resp = await client.get(f"http://{cleaned_domain}")
            location = resp.headers.get("location", "")
            if resp.status_code in (301, 302, 307, 308) and location.startswith("https://"):
                checks.append(
                    DomainSignalCheck(
                        check_name="HTTPS Enforcement",
                        status="PASS",
                        description="Domain enforces HTTPS. HTTP requests are redirected to HTTPS.",
                        detail=f"HTTP 301/302 Redirect to {location}"
                    )
                )
            else:
                checks.append(
                    DomainSignalCheck(
                        check_name="HTTPS Enforcement",
                        status="FAIL",
                        description="Domain does not enforce HTTPS redirect. HTTP connections accepted without upgrade.",
                        detail=f"Status code: {resp.status_code}, Location header: {location}"
                    )
                )
    except Exception as e:
        logger.warning(f"Check 1 HTTPS Enforcement error for {cleaned_domain}: {e}")
        checks.append(
            DomainSignalCheck(
                check_name="HTTPS Enforcement",
                status="UNKNOWN",
                description="Unable to connect via HTTP to verify redirection.",
                detail=str(e)
            )
        )

    # ── Check 2: HSTS Header Presence ──
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            resp = await client.get(f"https://{cleaned_domain}")
            hsts = resp.headers.get("strict-transport-security", "")
            if hsts:
                max_age = 0
                for part in hsts.split(";"):
                    part = part.strip()
                    if part.startswith("max-age="):
                        try:
                            max_age = int(part.split("=")[1])
                        except ValueError:
                            pass

                if max_age >= 31536000:
                    checks.append(
                        DomainSignalCheck(
                            check_name="HSTS Header",
                            status="PASS",
                            description=f"HSTS header present with max-age {max_age}. Browsers will enforce HTTPS for this domain.",
                            detail=hsts
                        )
                    )
                else:
                    checks.append(
                        DomainSignalCheck(
                            check_name="HSTS Header",
                            status="PARTIAL",
                            description=f"HSTS header present with short max-age {max_age} (recommended: 31536000+).",
                            detail=hsts
                        )
                    )
            else:
                checks.append(
                    DomainSignalCheck(
                        check_name="HSTS Header",
                        status="FAIL",
                        description="HSTS header not found. Browsers can connect via HTTP without automatic upgrade enforcement.",
                        detail="Strict-Transport-Security header missing from response."
                    )
                )
    except Exception as e:
        logger.warning(f"Check 2 HSTS Header error for {cleaned_domain}: {e}")
        checks.append(
            DomainSignalCheck(
                check_name="HSTS Header",
                status="UNKNOWN",
                description="Unable to verify HSTS header due to network error.",
                detail=str(e)
            )
        )

    # ── Check 3: security.txt File Presence ──
    try:
        found_sectxt = False
        sectxt_url = ""
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            for path in ["/.well-known/security.txt", "/security.txt"]:
                try:
                    res = await client.get(f"https://{cleaned_domain}{path}")
                    if res.status_code == 200:
                        found_sectxt = True
                        sectxt_url = f"https://{cleaned_domain}{path}"
                        break
                except Exception:
                    pass

        if found_sectxt:
            checks.append(
                DomainSignalCheck(
                    check_name="security.txt Policy",
                    status="PASS",
                    description="security.txt file found. Company has a documented vulnerability disclosure policy.",
                    detail=f"Accessible at {sectxt_url}"
                )
            )
        else:
            checks.append(
                DomainSignalCheck(
                    check_name="security.txt Policy",
                    status="FAIL",
                    description="No security.txt file found. Absence indicates no formal vulnerability disclosure process.",
                    detail="Checked /.well-known/security.txt and /security.txt"
                )
            )
    except Exception as e:
        logger.warning(f"Check 3 security.txt error for {cleaned_domain}: {e}")
        checks.append(
            DomainSignalCheck(
                check_name="security.txt Policy",
                status="UNKNOWN",
                description="Unable to check security.txt path availability.",
                detail=str(e)
            )
        )

    # ── Check 4: SSL Certificate Validity ──
    try:
        context = ssl.create_default_context()
        with socket.create_connection((cleaned_domain, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=cleaned_domain) as ssock:
                cert = ssock.getpeercert()
                not_after_str = cert.get("notAfter", "")
                not_after = datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                days_left = (not_after - datetime.now(timezone.utc)).days

                if days_left <= 0:
                    checks.append(
                        DomainSignalCheck(
                            check_name="SSL Certificate",
                            status="FAIL",
                            description="SSL certificate is expired.",
                            detail=f"Expired on {not_after_str}"
                        )
                    )
                elif days_left < 30:
                    checks.append(
                        DomainSignalCheck(
                            check_name="SSL Certificate",
                            status="PARTIAL",
                            description="SSL certificate expires within 30 days. Certificate renewal needed.",
                            detail=f"Expires in {days_left} days ({not_after_str})"
                        )
                    )
                else:
                    checks.append(
                        DomainSignalCheck(
                            check_name="SSL Certificate",
                            status="PASS",
                            description=f"SSL certificate valid for {days_left} days from a trusted CA.",
                            detail=f"Issuer: {cert.get('issuer', [])}"
                        )
                    )
    except Exception as e:
        logger.warning(f"Check 4 SSL Certificate error for {cleaned_domain}: {e}")
        checks.append(
            DomainSignalCheck(
                check_name="SSL Certificate",
                status="UNKNOWN",
                description="Unable to inspect SSL certificate chain directly.",
                detail=str(e)
            )
        )

    # ── Check 5: Security Response Headers ──
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            resp = await client.get(f"https://{cleaned_domain}")
            headers = {k.lower(): v for k, v in resp.headers.items()}

            has_frame = "x-frame-options" in headers or "content-security-policy" in headers
            has_nosniff = "x-content-type-options" in headers
            has_referrer = "referrer-policy" in headers

            score = sum([has_frame, has_nosniff, has_referrer])
            found_list = []
            if has_frame:
                found_list.append("X-Frame-Options/CSP")
            if has_nosniff:
                found_list.append("X-Content-Type-Options")
            if has_referrer:
                found_list.append("Referrer-Policy")

            if score >= 3:
                checks.append(
                    DomainSignalCheck(
                        check_name="Security Response Headers",
                        status="PASS",
                        description="Security response headers present (CSP/Frame-Options, X-Content-Type-Options, Referrer-Policy).",
                        detail=f"Headers found: {', '.join(found_list)}"
                    )
                )
            elif score in (1, 2):
                checks.append(
                    DomainSignalCheck(
                        check_name="Security Response Headers",
                        status="PARTIAL",
                        description="Some security response headers present but not all recommended headers found.",
                        detail=f"Headers found: {', '.join(found_list)}"
                    )
                )
            else:
                checks.append(
                    DomainSignalCheck(
                        check_name="Security Response Headers",
                        status="FAIL",
                        description="No security response headers detected.",
                        detail="Missing X-Frame-Options, Content-Security-Policy, and X-Content-Type-Options."
                    )
                )
    except Exception as e:
        logger.warning(f"Check 5 Security Headers error for {cleaned_domain}: {e}")
        checks.append(
            DomainSignalCheck(
                check_name="Security Response Headers",
                status="UNKNOWN",
                description="Unable to inspect security response headers.",
                detail=str(e)
            )
        )

    # ── Check 6: Subdomain Exposure Check ──
    try:
        sensitive_subdomains = ["admin", "staging", "dev", "test", "api"]
        publicly_exposed = []

        for sub in sensitive_subdomains:
            target_sub = f"{sub}.{cleaned_domain}"
            try:
                ip = socket.gethostbyname(target_sub)
                if ip:
                    # Check if responds on HTTPS without authentication
                    try:
                        async with httpx.AsyncClient(timeout=4.0, follow_redirects=False, verify=False) as client:
                            r = await client.get(f"https://{target_sub}")
                            if r.status_code == 200 and sub in ["admin", "staging", "dev", "test"]:
                                publicly_exposed.append(f"{target_sub} ({ip})")
                    except Exception:
                        pass
            except Exception:
                pass

        if publicly_exposed:
            checks.append(
                DomainSignalCheck(
                    check_name="Subdomain Exposure",
                    status="PARTIAL",
                    description="Potentially sensitive subdomains are publicly reachable. Verify these are intentionally public.",
                    detail=f"Exposed subdomains: {', '.join(publicly_exposed)}"
                )
            )
        else:
            checks.append(
                DomainSignalCheck(
                    check_name="Subdomain Exposure",
                    status="PASS",
                    description="No unauthenticated sensitive subdomains (admin, staging, dev, test) detected.",
                    detail="DNS resolution check clean across target subdomains."
                )
            )
    except Exception as e:
        logger.warning(f"Check 6 Subdomain Exposure error for {cleaned_domain}: {e}")
        checks.append(
            DomainSignalCheck(
                check_name="Subdomain Exposure",
                status="UNKNOWN",
                description="Unable to perform DNS subdomain resolution check.",
                detail=str(e)
            )
        )

    # Compute overall signal score as percentage of passing checks
    passing_count = sum(1 for c in checks if c.status == "PASS")
    overall_score = round((passing_count / len(checks)) * 100.0, 1) if checks else 0.0

    return DomainSignalReport(
        domain=cleaned_domain,
        checked_at=checked_at_iso,
        overall_signal_score=overall_score,
        checks=checks
    )
