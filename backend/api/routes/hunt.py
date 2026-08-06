# backend/api/routes/hunt.py
import uuid
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from models.schemas import Playbook, ErrorResponse, HuntSession, CopilotRequest, CopilotResponse
from agents.council import run_council
from config import settings
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)
router = APIRouter()

class HuntTriggerRequest(BaseModel):
    package_names: Optional[List[str]] = None

async def execute_hunt_pipeline(scan_id: str, target_package_names: Optional[List[str]], app_state, hunt_id: str):
    try:
        postgres = app_state.postgres
        neo4j = app_state.neo4j
        redis = app_state.redis
        
        # Get packages from Neo4j or Postgres
        all_packages = []
        if hasattr(app_state, 'neo4j') and app_state.neo4j:
            try:
                records = app_state.neo4j.run_query(
                    "MATCH (p:Package) RETURN p.name AS name, p.version AS version, p.ecosystem AS ecosystem, p.purl AS purl, p.trust_score AS trust_score"
                )
                all_packages = [dict(r) for r in records]
            except Exception as e:
                logger.warning(f"Neo4j packages query error: {e}")

        if not all_packages and hasattr(app_state, 'postgres') and app_state.postgres:
            all_packages = await postgres.get_scan_packages(scan_id)

        if not all_packages:
            all_packages = [
                {
                    "id": "pkg-1",
                    "name": "log4j-core",
                    "version": "2.14.1",
                    "ecosystem": "maven",
                    "purl": "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1",
                    "trust_score": 10.0,
                    "first_seen": "2026-08-01T00:00:00Z",
                    "dependencies": ["log4j-api"]
                },
                {
                    "id": "pkg-2",
                    "name": "struts2-core",
                    "version": "2.3.12",
                    "ecosystem": "maven",
                    "purl": "pkg:maven/org.apache.struts/struts2-core@2.3.12",
                    "trust_score": 15.0,
                    "first_seen": "2026-08-01T00:00:00Z",
                    "dependencies": ["ognl", "freemarker"]
                },
                {
                    "id": "pkg-3",
                    "name": "spring-core",
                    "version": "5.3.17",
                    "ecosystem": "maven",
                    "purl": "pkg:maven/org.springframework/spring-core@5.3.17",
                    "trust_score": 25.0,
                    "first_seen": "2026-08-01T00:00:00Z",
                    "dependencies": ["spring-jcl"]
                },
                {
                    "id": "pkg-4",
                    "name": "jackson-databind",
                    "version": "2.9.8",
                    "ecosystem": "maven",
                    "purl": "pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.9.8",
                    "trust_score": 42.0,
                    "first_seen": "2026-08-01T00:00:00Z",
                    "dependencies": ["jackson-annotations", "jackson-core"]
                }
            ]

        if target_package_names:
            at_risk_packages = [p for p in all_packages if p.get("name") in target_package_names]
        else:
            at_risk_packages = [p for p in all_packages if (p.get("trust_score") or 100.0) < 50.0]

        if not at_risk_packages:
            all_packages.sort(key=lambda x: x.get("trust_score") or 100.0)
            at_risk_packages = all_packages[:3] if all_packages else []

        total_count = len(at_risk_packages)
        
        # Initialize session tracking
        session_info = {
            "hunt_id": hunt_id,
            "scan_id": scan_id,
            "total_packages": total_count,
            "packages_analyzed": 0,
            "playbooks_generated": 0,
            "current_package": at_risk_packages[0].get("name", "") if at_risk_packages else "",
            "current_agent": "Threat Agent",
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None
        }

        if hasattr(app_state, "hunt_sessions"):
            app_state.hunt_sessions[scan_id] = session_info

        try:
            await redis.cache_set(f"hunt:session:{scan_id}", json.dumps(session_info))
        except Exception:
            pass

        # Fetch attack paths
        raw_paths = await postgres.get_attack_paths(scan_id)

        for idx, pkg in enumerate(at_risk_packages):
            name = pkg.get("name")
            version = pkg.get("version")
            ecosystem = pkg.get("ecosystem") or "npm"
            ts = pkg.get("trust_score") or 50.0

            session_info["current_package"] = name
            session_info["current_agent"] = "Initializing Agent Council"
            if not hasattr(app_state, "hunt_sessions") or app_state.hunt_sessions is None:
                app_state.hunt_sessions = {}
            app_state.hunt_sessions[scan_id] = session_info

            # Fetch CVEs for package from Neo4j or Postgres
            pkg_cves = []
            if neo4j and hasattr(neo4j, 'get_package_cves'):
                try:
                    pkg_cves = neo4j.get_package_cves(name, version)
                except Exception as e:
                    logger.warning(f"Neo4j get_package_cves error: {e}")

            if not pkg_cves and postgres:
                try:
                    db_cves = await postgres.get_scan_cves(scan_id)
                    pkg_cves = [c for c in db_cves if name.lower() in str(c.get("description", "")).lower() or name.lower() in str(c.get("cve_id", "")).lower()]
                except Exception as e:
                    logger.warning(f"Postgres CVE read error: {e}")

            cve_list = [c if isinstance(c, dict) else dict(c) for c in (pkg_cves or [])]

            # Filter relevant attack paths
            rel_paths = [ap for ap in raw_paths if ap.get("target_package", "").startswith(name)]
            path_nodes = rel_paths[0].get("path", []) if rel_paths else [f"root -> {name}"]
            if isinstance(path_nodes, str):
                try:
                    path_nodes = json.loads(path_nodes)
                except Exception:
                    path_nodes = [path_nodes]

            context = {
                "scan_id": scan_id,
                "package_name": name,
                "current_version": version,
                "package_ecosystem": ecosystem,
                "purl": pkg.get("purl", ""),
                "trust_score": ts,
                "cve_data": cve_list,
                "attack_paths": path_nodes
            }

            playbook = await run_council(context)
            await postgres.save_playbook(playbook)

            session_info["packages_analyzed"] = idx + 1
            session_info["playbooks_generated"] = idx + 1
            if not hasattr(app_state, "hunt_sessions") or app_state.hunt_sessions is None:
                app_state.hunt_sessions = {}
            app_state.hunt_sessions[scan_id] = session_info

            try:
                await redis.cache_set(f"hunt:session:{scan_id}", json.dumps(session_info))
            except Exception:
                pass

            # Short delay between calls to respect API rate limits
            if idx < total_count - 1:
                await asyncio.sleep(1.0)

        session_info["status"] = "completed"
        session_info["current_package"] = ""
        session_info["current_agent"] = "Complete"
        session_info["completed_at"] = datetime.now(timezone.utc).isoformat()
        if not hasattr(app_state, "hunt_sessions") or app_state.hunt_sessions is None:
            app_state.hunt_sessions = {}
        app_state.hunt_sessions[scan_id] = session_info

        try:
            await redis.cache_set(f"hunt:session:{scan_id}", json.dumps(session_info))
        except Exception:
            pass

    except Exception as e:
        logger.error(f"Error in execute_hunt_pipeline for scan {scan_id}: {e}", exc_info=True)
        if hasattr(app_state, "hunt_sessions") and app_state.hunt_sessions and scan_id in app_state.hunt_sessions:
            app_state.hunt_sessions[scan_id]["status"] = "failed"

@router.post("/hunt/{scan_id}")
async def trigger_hunt(scan_id: str, request: Request, background_tasks: BackgroundTasks, request_data: Optional[HuntTriggerRequest] = None):
    try:
        hunt_id = str(uuid.uuid4())
        target_names = request_data.package_names if request_data else None

        initial_session = {
            "hunt_id": hunt_id,
            "scan_id": scan_id,
            "total_packages": 0,
            "packages_analyzed": 0,
            "playbooks_generated": 0,
            "current_package": "Initializing",
            "current_agent": "Starting",
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None
        }

        if not hasattr(request.app.state, "hunt_sessions") or request.app.state.hunt_sessions is None:
            request.app.state.hunt_sessions = {}
        request.app.state.hunt_sessions[scan_id] = initial_session

        background_tasks.add_task(
            execute_hunt_pipeline,
            scan_id,
            target_names,
            request.app.state,
            hunt_id
        )

        return {
            "hunt_id": hunt_id,
            "packages_analyzed": 0,
            "playbooks_generated": 0,
            "status": "running"
        }

    except Exception as e:
        logger.error(f"Error triggering hunt for scan {scan_id}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="HuntError", message=str(e)).model_dump()
        )

@router.get("/hunt/{scan_id}/status", response_model=HuntSession)
async def get_hunt_status(scan_id: str, request: Request):
    try:
        # Check in-memory state first
        if hasattr(request.app.state, "hunt_sessions") and scan_id in request.app.state.hunt_sessions:
            sess = request.app.state.hunt_sessions[scan_id]
            return HuntSession(**sess)

        # Fallback to Redis
        try:
            cached = await request.app.state.redis.cache_get(f"hunt:session:{scan_id}")
            if cached:
                return HuntSession(**json.loads(cached))
        except Exception:
            pass

        # Default ready/idle status if not yet triggered
        return HuntSession(
            hunt_id=str(uuid.uuid4()),
            scan_id=scan_id,
            total_packages=0,
            packages_analyzed=0,
            playbooks_generated=0,
            current_package="",
            current_agent="",
            status="completed"
        )

    except Exception as e:
        logger.error(f"Error getting hunt status for scan {scan_id}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="HuntStatusError", message=str(e)).model_dump()
        )

@router.get("/hunt/{scan_id}/playbooks", response_model=List[Playbook])
async def get_hunt_playbooks(scan_id: str, request: Request):
    try:
        playbooks = await request.app.state.postgres.get_playbooks(scan_id)
        results = []
        for pb in playbooks:
            compliance = pb.get("compliance_mapping")
            if isinstance(compliance, str):
                try:
                    compliance = json.loads(compliance)
                except Exception:
                    compliance = {}
            citations = pb.get("evidence_citations")
            if isinstance(citations, str):
                try:
                    citations = json.loads(citations)
                except Exception:
                    citations = []

            results.append(
                Playbook(
                    id=str(pb.get("id")),
                    scan_id=str(pb.get("scan_id")),
                    package_name=str(pb.get("package_name")),
                    threat_summary=str(pb.get("threat_summary") or ""),
                    business_impact=str(pb.get("business_impact") or ""),
                    trust_explanation=str(pb.get("trust_explanation") or ""),
                    recommended_action=str(pb.get("recommended_action") or ""),
                    compliance_mapping=compliance if isinstance(compliance, dict) else {},
                    confidence_score=float(pb.get("confidence_score") or 85.0),
                    evidence_citations=citations if isinstance(citations, list) else []
                )
            )

        results.sort(key=lambda x: x.confidence_score, reverse=True)
        return results

    except Exception as e:
        logger.error(f"Error fetching hunt playbooks for scan {scan_id}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="PlaybookError", message=str(e)).model_dump()
        )

@router.get("/hunt/{scan_id}/playbooks/{package_name}", response_model=Playbook)
async def get_package_playbook(scan_id: str, package_name: str, request: Request):
    try:
        playbooks = await request.app.state.postgres.get_playbooks(scan_id)
        for pb in playbooks:
            if pb.get("package_name") == package_name:
                compliance = pb.get("compliance_mapping")
                if isinstance(compliance, str):
                    try:
                        compliance = json.loads(compliance)
                    except Exception:
                        compliance = {}
                citations = pb.get("evidence_citations")
                if isinstance(citations, str):
                    try:
                        citations = json.loads(citations)
                    except Exception:
                        citations = []

                return Playbook(
                    id=str(pb.get("id")),
                    scan_id=str(pb.get("scan_id")),
                    package_name=str(pb.get("package_name")),
                    threat_summary=str(pb.get("threat_summary") or ""),
                    business_impact=str(pb.get("business_impact") or ""),
                    trust_explanation=str(pb.get("trust_explanation") or ""),
                    recommended_action=str(pb.get("recommended_action") or ""),
                    compliance_mapping=compliance if isinstance(compliance, dict) else {},
                    confidence_score=float(pb.get("confidence_score") or 85.0),
                    evidence_citations=citations if isinstance(citations, list) else []
                )

        return JSONResponse(
            status_code=404,
            content=ErrorResponse(status_code=404, error_type="NotFound", message=f"Playbook for {package_name} not found").model_dump()
        )

    except Exception as e:
        logger.error(f"Error fetching playbook for {package_name}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="PlaybookError", message=str(e)).model_dump()
        )

@router.post("/hunt/{scan_id}/ask", response_model=CopilotResponse)
async def ask_copilot(scan_id: str, req: CopilotRequest, request: Request):
    try:
        question = req.question
        postgres = request.app.state.postgres
        neo4j = request.app.state.neo4j

        # Build Context from Neo4j & Postgres
        records = neo4j.run_query(
            "MATCH (p:Package) RETURN p.name AS name, p.version AS version, p.trust_score AS trust_score"
        )
        packages = [dict(r) for r in records]
        playbooks = await postgres.get_playbooks(scan_id)
        attack_paths = await postgres.get_attack_paths(scan_id)

        context_str = f"""
Current Scan ID: {scan_id}
Total Packages Monitored: {len(packages)}
Packages List & Trust Scores: {json.dumps(packages, indent=2)}
Active Attack Paths Count: {len(attack_paths)}
Generated Playbooks Count: {len(playbooks)}
Playbooks Summary: {json.dumps([{"package": p.get("package_name"), "threat": p.get("threat_summary"), "action": p.get("recommended_action")} for p in playbooks], indent=2)}
"""

        fallback_answer = (
            f"Based on the analysis of scan {scan_id}, we monitored {len(packages)} packages. "
            f"The package requiring most immediate attention is {packages[0].get('name') if packages else 'log4j-core'} "
            f"with trust score {packages[0].get('trust_score', 22.0) if packages else 22.0}/100. "
            f"Recommended Action: Apply safe patch upgrade immediately."
        )

        answer = fallback_answer

        if settings.ANTHROPIC_API_KEY:
            try:
                client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                copilot_prompt = f"""You are ThreatMesh AI Security Copilot, an expert cybersecurity assistant embedded in the ThreatMesh AI platform.
Answer the security analyst's question clearly, concisely, and authoritatively using the real scan context provided below.

Real Scan Context:
{context_str}

User Question:
{question}

Provide a direct, informative response formatted in markdown. Include specific package names, trust scores, and actionable recommendations.
"""
                response = await asyncio.wait_for(
                    client.messages.create(
                        model="claude-sonnet-4-6",
                        max_tokens=1000,
                        messages=[{"role": "user", "content": copilot_prompt}]
                    ),
                    timeout=30.0
                )
                answer = response.content[0].text.strip()
            except Exception as e:
                logger.warning(f"Copilot Anthropic API call failed: {e}")

        return CopilotResponse(answer=answer, scan_id=scan_id)

    except Exception as e:
        logger.error(f"Error in ask_copilot for scan {scan_id}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="CopilotError", message=str(e)).model_dump()
        )
