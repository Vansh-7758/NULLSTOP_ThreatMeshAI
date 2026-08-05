# backend/compliance/profile_engine.py
"""Company Profile creation and applicability engine."""
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Fallback in-memory profile store
_in_memory_profiles: Dict[str, Dict[str, Any]] = {}

async def create_company_profile(
    scan_id: str,
    industry: str,
    company_size: str,
    regions: List[str],
    data_types: List[str],
    existing_certifications: List[str],
    postgres_client: Any = None
) -> str:
    """Inserts a row into company_profiles and returns the profile_id."""
    profile_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    
    profile_dict = {
        "id": profile_id,
        "scan_id": scan_id,
        "industry": industry,
        "company_size": company_size,
        "regions": regions,
        "data_types": data_types,
        "existing_certifications": existing_certifications,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    
    _in_memory_profiles[scan_id] = profile_dict
    
    if postgres_client and getattr(postgres_client, "pool", None):
        try:
            query = """
            INSERT INTO company_profiles (
                id, scan_id, industry, company_size, regions, data_types, existing_certifications, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            """
            await postgres_client._execute_with_retry(
                query,
                profile_id,
                scan_id,
                industry,
                company_size,
                json.dumps(regions),
                json.dumps(data_types),
                json.dumps(existing_certifications)
            )
        except Exception as e:
            logger.warning(f"Fallback to in-memory company profile creation: {e}")
            
    return profile_id

async def get_company_profile(scan_id: str, postgres_client: Any = None) -> Optional[Dict[str, Any]]:
    """Queries company_profiles for the most recent profile for a given scan_id."""
    if postgres_client and hasattr(postgres_client, "get_company_profile"):
        try:
            prof = await postgres_client.get_company_profile(scan_id)
            if prof:
                return prof
        except Exception as e:
            logger.warning(f"Postgres get_company_profile delegation warning: {e}")

    if postgres_client and getattr(postgres_client, "pool", None):
        try:
            query = "SELECT * FROM company_profiles WHERE scan_id = $1 ORDER BY created_at DESC LIMIT 1"
            records = await postgres_client._execute_with_retry(query, scan_id)
            if records:
                row = dict(records[0])
                if isinstance(row.get("regions"), str):
                    try: row["regions"] = json.loads(row["regions"])
                    except Exception: pass
                if isinstance(row.get("data_types"), str):
                    try: row["data_types"] = json.loads(row["data_types"])
                    except Exception: pass
                if isinstance(row.get("existing_certifications"), str):
                    try: row["existing_certifications"] = json.loads(row["existing_certifications"])
                    except Exception: pass
                return row
        except Exception as e:
            logger.warning(f"Fallback to in-memory company profile query: {e}")
            
    return _in_memory_profiles.get(scan_id)

async def determine_applicable_frameworks(profile: Dict[str, Any], neo4j_client: Any = None) -> Dict[str, str]:
    """Returns a dict indicating which frameworks apply at what stringency level based on profile and Neo4j AI packages."""
    regions = [r.lower() for r in profile.get("regions", [])]
    data_types = [d.lower() for d in profile.get("data_types", [])]
    certs = [c.lower() for c in profile.get("existing_certifications", [])]
    
    # 1. NIST CSF 2.0
    nist = "standard"
    
    # 2. ISO 27001
    iso = "strict" if any("iso 27001" in c for c in certs) else "standard"
    
    # 3. GDPR
    has_eu = any(r in ["european union", "eu", "united kingdom", "uk"] for r in regions)
    has_pii = any("personal" in d or "pii" in d for d in data_types)
    has_health = any("health" in d or "medical" in d for d in data_types)
    
    if has_health and has_eu:
        gdpr = "strict"
    elif has_eu or has_pii or has_health:
        gdpr = "standard"
    else:
        gdpr = "none"
        
    # 4. EU AI Act
    has_ai_data = any("ai" in d for d in data_types)
    has_ai_packages = False
    
    if neo4j_client and hasattr(neo4j_client, "run_query"):
        try:
            ai_pkg_names = ["transformers", "torch", "tensorflow", "langchain", "langgraph", "anthropic", "openai"]
            records = neo4j_client.run_query(
                "MATCH (p:Package) WHERE toLower(p.name) IN $names RETURN count(p) AS count",
                {"names": ai_pkg_names}
            )
            if records and records[0].get("count", 0) > 0:
                has_ai_packages = True
        except Exception as e:
            logger.warning(f"Neo4j AI package check failed: {e}")
            
    if has_ai_data or has_ai_packages:
        eu_ai_act = "standard"
    else:
        eu_ai_act = "none"
        
    # 5. OWASP Top 10
    owasp = "standard"
    
    return {
        "nist_csf": nist,
        "iso_27001": iso,
        "gdpr": gdpr,
        "eu_ai_act": eu_ai_act,
        "owasp": owasp
    }
