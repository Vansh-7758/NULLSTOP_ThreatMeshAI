import asyncio
import json
import logging
import httpx
from typing import List
from datetime import datetime, timezone
from models.schemas import Package, CVERecord, Severity
from config import settings

logger = logging.getLogger(__name__)

def _normalize_severity(score: float) -> Severity:
    if score >= 9.0:
        return Severity.CRITICAL
    elif score >= 7.0:
        return Severity.HIGH
    elif score >= 4.0:
        return Severity.MEDIUM
    elif score > 0.0:
        return Severity.LOW
    return Severity.NONE

async def _query_nvd(package_name: str, version: str, api_key: str) -> List[CVERecord]:
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={package_name}"
    headers = {}
    if api_key:
        headers["apiKey"] = api_key
    else:
        await asyncio.sleep(1)
        
    cve_records = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get("vulnerabilities", []):
                cve_item = item.get("cve", {})
                cve_id = cve_item.get("id", "")
                
                descriptions = cve_item.get("descriptions", [])
                description = next((d.get("value", "") for d in descriptions if d.get("lang") == "en"), "")
                
                metrics = cve_item.get("metrics", {})
                cvss_v31 = metrics.get("cvssMetricV31", [])
                cvss_score = 0.0
                if cvss_v31:
                    cvss_score = cvss_v31[0].get("cvssData", {}).get("baseScore", 0.0)
                
                severity = _normalize_severity(cvss_score)
                
                cve_records.append(CVERecord(
                    cve_id=cve_id,
                    description=description,
                    severity=severity,
                    cvss_score=cvss_score,
                    epss_score=0.0
                ))
    except Exception as e:
        logger.warning(f"Error querying NVD for {package_name}: {e}")
        
    return cve_records

async def _query_osv(package_name: str, version: str, ecosystem: str) -> List[CVERecord]:
    url = "https://api.osv.dev/v1/query"
    
    osv_ecosystem = ecosystem
    if ecosystem == "npm":
        osv_ecosystem = "npm"
    elif ecosystem == "pypi":
        osv_ecosystem = "PyPI"
    elif ecosystem == "maven":
        osv_ecosystem = "Maven"
        
    payload = {
        "version": version,
        "package": {
            "name": package_name,
            "ecosystem": osv_ecosystem
        }
    }
    
    cve_records = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            for vuln in data.get("vulns", []):
                cve_id = vuln.get("id", "")
                summary = vuln.get("summary", "")
                
                severity_str = None
                database_specific = vuln.get("database_specific", {})
                if "severity" in database_specific:
                    severity_str = database_specific["severity"]
                    
                severity = Severity.NONE
                cvss_score = 0.0
                if severity_str == "CRITICAL":
                    severity = Severity.CRITICAL
                    cvss_score = 9.5
                elif severity_str == "HIGH":
                    severity = Severity.HIGH
                    cvss_score = 8.0
                elif severity_str == "MODERATE":
                    severity = Severity.MEDIUM
                    cvss_score = 5.5
                elif severity_str == "LOW":
                    severity = Severity.LOW
                    cvss_score = 2.0
                    
                cve_records.append(CVERecord(
                    cve_id=cve_id,
                    description=summary,
                    severity=severity,
                    cvss_score=cvss_score,
                    epss_score=0.0
                ))
    except Exception as e:
        logger.warning(f"Error querying OSV for {package_name}: {e}")
        
    return cve_records

async def _query_ghsa(package_name: str, ecosystem: str) -> List[CVERecord]:
    if not settings.GITHUB_TOKEN:
        return []
        
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }
    
    gh_ecosystem = ecosystem.upper()
    if ecosystem == "pypi":
        gh_ecosystem = "PIP"
        
    query = """
    query($package: String!, $ecosystem: SecurityAdvisoryEcosystem!) {
      securityAdvisories(first: 10, ecosystem: $ecosystem, searchQuery: $package) {
        nodes {
          ghsaId
          summary
          severity
          cvss {
            score
          }
        }
      }
    }
    """
    
    payload = {
        "query": query,
        "variables": {
            "package": package_name,
            "ecosystem": gh_ecosystem
        }
    }
    
    cve_records = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            advisories = data.get("data", {}).get("securityAdvisories", {}).get("nodes", [])
            for adv in advisories:
                ghsa_id = adv.get("ghsaId", "")
                summary = adv.get("summary", "")
                severity_str = adv.get("severity", "NONE")
                cvss_data = adv.get("cvss", {})
                cvss_score = cvss_data.get("score", 0.0) if cvss_data else 0.0
                
                if cvss_score == 0.0:
                    if severity_str == "CRITICAL": cvss_score = 9.5
                    elif severity_str == "HIGH": cvss_score = 8.0
                    elif severity_str == "MODERATE": cvss_score = 5.5
                    elif severity_str == "LOW": cvss_score = 2.0
                    
                severity = _normalize_severity(cvss_score)
                
                cve_records.append(CVERecord(
                    cve_id=ghsa_id,
                    description=summary,
                    severity=severity,
                    cvss_score=cvss_score,
                    epss_score=0.0
                ))
    except Exception as e:
        logger.warning(f"Error querying GHSA for {package_name}: {e}")
        
    return cve_records

async def fetch_vulnerabilities(packages: List[Package], redis_client) -> List[CVERecord]:
    all_cves = []
    
    for pkg in packages:
        cache_key = f"threat:{pkg.name}:{pkg.version}"
        
        try:
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                records_data = json.loads(cached_data)
                records = [CVERecord(**r) for r in records_data]
                all_cves.extend(records)
                continue
        except Exception as e:
            logger.warning(f"Redis error: {e}")
            
        nvd_results = await _query_nvd(pkg.name, pkg.version, settings.NVD_API_KEY)
        osv_results = await _query_osv(pkg.name, pkg.version, pkg.ecosystem)
        ghsa_results = await _query_ghsa(pkg.name, pkg.ecosystem)
        
        merged_results = nvd_results + osv_results + ghsa_results
        
        unique_cves = {}
        for cve in merged_results:
            if cve.cve_id not in unique_cves:
                unique_cves[cve.cve_id] = cve
            else:
                existing = unique_cves[cve.cve_id]
                if cve.cvss_score > existing.cvss_score:
                    unique_cves[cve.cve_id] = cve
                    
        final_cves = list(unique_cves.values())
        
        try:
            if final_cves:
                serialized = [cve.model_dump(mode='json') for cve in final_cves]
                await redis_client.setex(cache_key, 3600, json.dumps(serialized))
        except Exception as e:
            logger.warning(f"Redis error saving cache: {e}")
            
        all_cves.extend(final_cves)
        
    return all_cves
