# backend/graph/adtg_scorer.py
import json
import logging
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timezone
from models.schemas import TrustScore, TrustScoreBreakdown, CVERecord, Severity, NodeType, Package
from ingestion.threat_feeds import KNOWN_MALICIOUS_VULNS
from config import settings

logger = logging.getLogger(__name__)

_MAINTAINER_CACHE: Dict[str, dict] = {}
_RELEASE_CACHE: Dict[str, dict] = {}
_GITHUB_RATE_LIMITED: bool = False

async def fetch_maintainer_data(package_name: str, ecosystem: str) -> dict:
    global _GITHUB_RATE_LIMITED
    default_data = {"days_since_commit": 90, "open_issues": 0, "is_archived": False}

    cache_key = f"{ecosystem}:{package_name.lower()}"
    if cache_key in _MAINTAINER_CACHE:
        return _MAINTAINER_CACHE[cache_key]

    if ecosystem != "npm" and ecosystem != "pypi":
        _MAINTAINER_CACHE[cache_key] = default_data
        return default_data

    if _GITHUB_RATE_LIMITED and not settings.GITHUB_TOKEN:
        _MAINTAINER_CACHE[cache_key] = default_data
        return default_data

    url = f"https://api.github.com/search/repositories?q={package_name}"
    headers = {}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                if items:
                    repo = items[0]
                    pushed_at_str = repo.get("pushed_at")
                    if pushed_at_str:
                        pushed_at = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
                        days_since_commit = (datetime.now(timezone.utc) - pushed_at).days
                    else:
                        days_since_commit = 90
                    res = {
                        "days_since_commit": days_since_commit,
                        "open_issues": repo.get("open_issues_count", 0),
                        "is_archived": repo.get("archived", False)
                    }
                    _MAINTAINER_CACHE[cache_key] = res
                    return res
            elif response.status_code in (403, 429):
                _GITHUB_RATE_LIMITED = True
    except Exception as e:
        logger.debug(f"Maintainer data lookup deferred for {package_name}: {e}")

    _MAINTAINER_CACHE[cache_key] = default_data
    return default_data

async def fetch_release_data(package_name: str, ecosystem: str) -> dict:
    default_data = {"days_since_release": 90}
    cache_key = f"{ecosystem}:{package_name.lower()}"
    if cache_key in _RELEASE_CACHE:
        return _RELEASE_CACHE[cache_key]

    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            if ecosystem == "npm":
                url = f"https://registry.npmjs.org/{package_name}"
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    time_data = data.get("time", {})
                    modified_str = time_data.get("modified")
                    if modified_str:
                        modified = datetime.fromisoformat(modified_str.replace("Z", "+00:00"))
                        days = (datetime.now(timezone.utc) - modified).days
                        res = {"days_since_release": days}
                        _RELEASE_CACHE[cache_key] = res
                        return res
            elif ecosystem == "pypi":
                url = f"https://pypi.org/pypi/{package_name}/json"
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    releases = data.get("releases", {})
                    if releases:
                        latest_version = data.get("info", {}).get("version")
                        if latest_version and latest_version in releases and releases[latest_version]:
                            upload_time_str = releases[latest_version][0].get("upload_time_iso_8601")
                            if upload_time_str:
                                upload_time = datetime.fromisoformat(upload_time_str.replace("Z", "+00:00"))
                                days = (datetime.now(timezone.utc) - upload_time).days
                                res = {"days_since_release": days}
                                _RELEASE_CACHE[cache_key] = res
                                return res
    except Exception as e:
        logger.debug(f"Release data lookup deferred for {package_name}: {e}")

    _RELEASE_CACHE[cache_key] = default_data
    return default_data

def calculate_trust_score(package_name: str, version: str, cves: List[CVERecord], maintainer_data: dict, release_data: dict) -> TrustScore:
    # Signal 1 — CVE Severity (30% weight): Starts at 100, Critical -40, High -25, Medium -15, Low -5
    cve_impact = 100.0
    for cve in cves:
        if cve.severity == Severity.CRITICAL or cve.cvss_score >= 9.0:
            cve_impact -= 40.0
        elif cve.severity == Severity.HIGH or cve.cvss_score >= 7.0:
            cve_impact -= 25.0
        elif cve.severity == Severity.MEDIUM or cve.cvss_score >= 4.0:
            cve_impact -= 15.0
        elif cve.severity == Severity.LOW:
            cve_impact -= 5.0
    cve_impact = max(0.0, min(100.0, cve_impact))
    
    # Signal 2 — EPSS Score (25% weight): Probability of active exploitation (0.0 to 1.0)
    max_epss = max([cve.epss_score for cve in cves]) if cves else 0.0
    epss_risk = max(0.0, 100.0 - (max_epss * 100.0))
    if not cves:
        epss_risk = 100.0
        
    # Signal 3 — Exploit Availability (20% weight): Binary (0 if public exploit exists, 100 if none)
    exploit_risk = 0.0 if any(cve.exploit_available for cve in cves) else 100.0
    
    # Signal 4 — Maintainer Activity (15% weight): GitHub commit push inactivity
    if maintainer_data.get("is_archived"):
        maintainer_health = 0.0
    else:
        days = maintainer_data.get("days_since_commit", 90)
        if days < 30: maintainer_health = 100.0
        elif days < 90: maintainer_health = 75.0
        elif days < 180: maintainer_health = 50.0
        elif days < 365: maintainer_health = 25.0
        else: maintainer_health = 10.0
        
    # Signal 5 — Release Cadence (10% weight): NPM / PyPI latest release date
    days_rel = release_data.get("days_since_release", 90)
    if days_rel < 30: release_cadence = 100.0
    elif days_rel < 90: release_cadence = 80.0
    elif days_rel < 180: release_cadence = 60.0
    elif days_rel < 365: release_cadence = 40.0
    else: release_cadence = 20.0
    
    # ADTG Final Formula: (S1 * 0.30) + (S2 * 0.25) + (S3 * 0.20) + (S4 * 0.15) + (S5 * 0.10)
    final_score = (
        (cve_impact * 0.30) +
        (epss_risk * 0.25) +
        (exploit_risk * 0.20) +
        (maintainer_health * 0.15) +
        (release_cadence * 0.10)
    )

    # Hard Security Caps: Critical CVEs cap max score at <= 20.0; High CVEs cap at <= 45.0
    if any(c.severity == Severity.CRITICAL for c in cves) or any(c.cvss_score >= 9.0 for c in cves):
        final_score = min(final_score, 20.0)
    elif any(c.severity == Severity.HIGH for c in cves) or any(c.cvss_score >= 7.0 for c in cves):
        final_score = min(final_score, 45.0)

    final_score = max(0.0, min(100.0, final_score))
    
    breakdown = TrustScoreBreakdown(
        cve_impact=cve_impact,
        epss_risk=epss_risk,
        exploit_risk=exploit_risk,
        maintainer_health=maintainer_health,
        release_cadence=release_cadence
    )
    
    return TrustScore(
        package_name=package_name,
        version=version,
        score=round(final_score, 1),
        node_type=NodeType.PACKAGE,
        breakdown=breakdown
    )

async def compute_trust_scores(
    neo4j_client,
    redis_client,
    ws_manager,
    scan_id: str = "default",
    packages_input: Optional[List[Package]] = None,
    fetched_cves: Optional[List[CVERecord]] = None,
    postgres_client = None
) -> List[TrustScore]:
    scores = []
    packages_to_score = []

    # 1. Collect packages list from input, Neo4j, or Postgres
    if packages_input:
        packages_to_score = [
            {"name": p.name, "version": p.version, "ecosystem": p.ecosystem}
            for p in packages_input
        ]
    else:
        try:
            records = neo4j_client.run_query(
                "MATCH (p:Package) RETURN p.name AS name, p.version AS version, p.ecosystem AS ecosystem"
            )
            packages_to_score = [
                {"name": r["name"], "version": r["version"], "ecosystem": r.get("ecosystem", "npm")}
                for r in records
            ]
        except Exception as e:
            logger.warning(f"Neo4j packages query error: {e}")

    # Fallback to Postgres if still empty
    if not packages_to_score and postgres_client:
        try:
            db_pkgs = await postgres_client.get_scan_packages(scan_id)
            packages_to_score = [
                {"name": p["name"], "version": p["version"], "ecosystem": p.get("ecosystem", "npm")}
                for p in db_pkgs
            ]
        except Exception as e:
            logger.warning(f"Postgres packages query error: {e}")

    # Index fetched CVEs by package name using exact package matching
    cves_by_package: Dict[str, List[CVERecord]] = {}
    if fetched_cves:
        for c in fetched_cves:
            desc_lower = c.description.lower()
            cve_id_lower = c.cve_id.lower()
            for p in packages_to_score:
                p_name = p["name"]
                p_lower = p_name.lower()
                
                is_match = (
                    p_lower in desc_lower or 
                    p_lower in cve_id_lower or 
                    (p_lower in KNOWN_MALICIOUS_VULNS and any(kc.cve_id == c.cve_id for kc in KNOWN_MALICIOUS_VULNS[p_lower]))
                )
                if is_match:
                    if p_name not in cves_by_package:
                        cves_by_package[p_name] = []
                    if not any(existing.cve_id == c.cve_id for existing in cves_by_package[p_name]):
                        cves_by_package[p_name].append(c)

    for pkg in packages_to_score:
        name = pkg["name"]
        version = pkg["version"]
        ecosystem = pkg.get("ecosystem", "npm")
        pkg_lower = name.lower()
        
        cves = cves_by_package.get(name, [])
        
        # Check Redis if no CVEs mapped yet
        if not cves and redis_client and hasattr(redis_client, 'cache_get'):
            try:
                cache_key = f"threat:{name}:{version}"
                cached_data = await redis_client.cache_get(cache_key)
                if cached_data:
                    records_data = json.loads(cached_data)
                    cves = [CVERecord(**r) for r in records_data]
            except Exception as e:
                logger.warning(f"Redis cache query error: {e}")

        # Check Fallback Known Malicious Database if still empty or known malicious package
        if pkg_lower in KNOWN_MALICIOUS_VULNS:
            known = KNOWN_MALICIOUS_VULNS[pkg_lower]
            for k in known:
                if not any(c.cve_id == k.cve_id for c in cves):
                    cves.append(k)
                    
        maintainer_data = await fetch_maintainer_data(name, ecosystem)
        release_data = await fetch_release_data(name, ecosystem)
        
        trust_score = calculate_trust_score(name, version, cves, maintainer_data, release_data)
        scores.append(trust_score)
        
        # Update Neo4j in-memory store and live DB
        try:
            if neo4j_client:
                neo4j_client.update_trust_score(name, version, trust_score.score)
        except Exception as e:
            logger.warning(f"Error updating Neo4j trust score: {e}")

        # Update Postgres DB
        try:
            if postgres_client:
                await postgres_client.update_package_trust_score(scan_id, name, version, trust_score.score)
        except Exception as e:
            logger.warning(f"Error updating Postgres trust score: {e}")
            
        try:
            if ws_manager:
                await ws_manager.broadcast({
                    "event": "trust_score_updated",
                    "package_name": name,
                    "version": version,
                    "score": trust_score.score,
                    "breakdown": trust_score.breakdown.model_dump()
                })
        except Exception:
            pass

    return scores
