import json
import logging
import httpx
from typing import List, Dict
from datetime import datetime, timezone
from models.schemas import TrustScore, TrustScoreBreakdown, CVERecord, Severity, NodeType
from config import settings

logger = logging.getLogger(__name__)

async def fetch_maintainer_data(package_name: str, ecosystem: str) -> dict:
    default_data = {"days_since_commit": 90, "open_issues": 0, "is_archived": False}
    
    if ecosystem != "npm" and ecosystem != "pypi":
        return default_data
        
    url = f"https://api.github.com/search/repositories?q={package_name}"
    headers = {}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
        
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            items = data.get("items", [])
            if not items:
                return default_data
                
            repo = items[0]
            pushed_at_str = repo.get("pushed_at")
            if pushed_at_str:
                pushed_at = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
                days_since_commit = (datetime.now(timezone.utc) - pushed_at).days
            else:
                days_since_commit = 90
                
            return {
                "days_since_commit": days_since_commit,
                "open_issues": repo.get("open_issues_count", 0),
                "is_archived": repo.get("archived", False)
            }
    except Exception as e:
        logger.warning(f"Error fetching maintainer data for {package_name}: {e}")
        return default_data

async def fetch_release_data(package_name: str, ecosystem: str) -> dict:
    default_data = {"days_since_release": 90}
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if ecosystem == "npm":
                url = f"https://registry.npmjs.org/{package_name}"
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                time_data = data.get("time", {})
                modified_str = time_data.get("modified")
                if modified_str:
                    modified = datetime.fromisoformat(modified_str.replace("Z", "+00:00"))
                    days = (datetime.now(timezone.utc) - modified).days
                    return {"days_since_release": days}
            elif ecosystem == "pypi":
                url = f"https://pypi.org/pypi/{package_name}/json"
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                releases = data.get("releases", {})
                if releases:
                    latest_version = data.get("info", {}).get("version")
                    if latest_version and latest_version in releases and releases[latest_version]:
                        upload_time_str = releases[latest_version][0].get("upload_time_iso_8601")
                        if upload_time_str:
                            upload_time = datetime.fromisoformat(upload_time_str.replace("Z", "+00:00"))
                            days = (datetime.now(timezone.utc) - upload_time).days
                            return {"days_since_release": days}
    except Exception as e:
        logger.warning(f"Error fetching release data for {package_name}: {e}")
        
    return default_data

def calculate_trust_score(package_name: str, version: str, cves: List[CVERecord], maintainer_data: dict, release_data: dict) -> TrustScore:
    cve_impact = 100.0
    for cve in cves:
        if cve.severity == Severity.CRITICAL:
            cve_impact -= 40.0
        elif cve.severity == Severity.HIGH:
            cve_impact -= 25.0
        elif cve.severity == Severity.MEDIUM:
            cve_impact -= 15.0
        elif cve.severity == Severity.LOW:
            cve_impact -= 5.0
    cve_impact = max(0.0, min(100.0, cve_impact))
    
    max_epss = max([cve.epss_score for cve in cves]) if cves else 0.0
    epss_risk = 100.0 - (max_epss * 100.0)
    if not cves:
        epss_risk = 100.0
        
    exploit_risk = 0.0 if any(cve.exploit_available for cve in cves) else 100.0
    
    if maintainer_data.get("is_archived"):
        maintainer_health = 0.0
    else:
        days = maintainer_data.get("days_since_commit", 90)
        if days < 30: maintainer_health = 100.0
        elif days < 90: maintainer_health = 75.0
        elif days < 180: maintainer_health = 50.0
        elif days < 365: maintainer_health = 25.0
        else: maintainer_health = 10.0
        
    days_rel = release_data.get("days_since_release", 90)
    if days_rel < 30: release_cadence = 100.0
    elif days_rel < 90: release_cadence = 80.0
    elif days_rel < 180: release_cadence = 60.0
    elif days_rel < 365: release_cadence = 40.0
    else: release_cadence = 20.0
    
    final_score = (
        (cve_impact * 0.30) +
        (epss_risk * 0.25) +
        (exploit_risk * 0.20) +
        (maintainer_health * 0.15) +
        (release_cadence * 0.10)
    )
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
        score=final_score,
        node_type=NodeType.PACKAGE,
        breakdown=breakdown
    )

async def compute_trust_scores(neo4j_client, redis_client, ws_manager) -> List[TrustScore]:
    scores = []
    
    try:
        records = neo4j_client.run_query(
            "MATCH (p:Package) RETURN p.name AS name, p.version AS version, p.ecosystem AS ecosystem"
        )
        packages = [{"name": r["name"], "version": r["version"], "ecosystem": r["ecosystem"]} for r in records]
    except Exception as e:
        logger.warning(f"Error querying neo4j: {e}")
        packages = []
        
    for pkg in packages:
        name = pkg["name"]
        version = pkg["version"]
        ecosystem = pkg["ecosystem"]
        
        cves = []
        try:
            cache_key = f"threat:{name}:{version}"
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                records_data = json.loads(cached_data)
                cves = [CVERecord(**r) for r in records_data]
        except Exception as e:
            logger.warning(f"Redis error: {e}")
            
        maintainer_data = await fetch_maintainer_data(name, ecosystem)
        release_data = await fetch_release_data(name, ecosystem)
        
        trust_score = calculate_trust_score(name, version, cves, maintainer_data, release_data)
        scores.append(trust_score)
        
        try:
            neo4j_client.run_query(
                "MATCH (p:Package {name: $name, version: $version}) SET p.trust_score = $score",
                {"name": name, "version": version, "score": trust_score.score}
            )
        except Exception as e:
            logger.warning(f"Error updating neo4j trust score: {e}")
            
        try:
            if ws_manager:
                await ws_manager.broadcast({
                    "event_type": "trust_update",
                    "package_name": name,
                    "version": version,
                    "new_score": trust_score.score,
                    "node_type": "package"
                })
        except Exception as e:
            logger.warning(f"Error broadcasting via WS: {e}")
            
    return scores
