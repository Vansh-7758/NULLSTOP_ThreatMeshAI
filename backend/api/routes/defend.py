import asyncio
import logging
import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Request, HTTPException, Query, BackgroundTasks, File, Form, UploadFile
from fastapi.responses import PlainTextResponse

from governance.policy_engine import check_prompt_safety, GovernancePolicyResult
from governance.compliance_mapper import map_scan_to_compliance, generate_text_compliance_report
from red_team.simulator import run_red_team_suite, set_red_team_clients
from models.schemas import GovernanceTestRequest, TenantRegistrationRequest, AttackSimulationRequest
from ingestion.sbom_parser import parse_sbom
from api.routes.scan import run_scan_pipeline
from api.websocket import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/defend", tags=["DEFEND"])

# In-memory store for registered tenants & simulation events
_tenants_db: Dict[str, Dict[str, Any]] = {}
_propagation_events: List[Dict[str, Any]] = []

@router.get("/governance/events")
async def get_governance_events(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    risk_level: Optional[str] = None,
    event_type: Optional[str] = None
):
    try:
        postgres = request.app.state.postgres
        events = await postgres.get_governance_events(limit=limit)

        if risk_level:
            events = [e for e in events if e.get("risk_level") == risk_level.upper()]
        if event_type:
            events = [e for e in events if e.get("event_type") == event_type]

        return events[:limit]
    except Exception as e:
        logger.error(f"Error in GET /governance/events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/governance/events/{event_id}")
async def get_governance_event_by_id(request: Request, event_id: str):
    try:
        postgres = request.app.state.postgres
        events = await postgres.get_governance_events(limit=200)
        match = next((e for e in events if e.get("id") == event_id), None)
        if not match:
            raise HTTPException(status_code=404, detail="Governance event not found")
        return match
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in GET /governance/events/{event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/governance/stats")
async def get_governance_stats(request: Request):
    try:
        postgres = request.app.state.postgres
        events = await postgres.get_governance_events(limit=200)

        total_events = len(events)
        events_by_risk: Dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "SAFE": 0}
        events_by_type: Dict[str, int] = {"internal_ai_check": 0, "external_compliance_check": 0}
        blocked_count = 0
        allowed_count = 0
        critical_events = []

        for e in events:
            rl = e.get("risk_level", "SAFE").upper()
            events_by_risk[rl] = events_by_risk.get(rl, 0) + 1

            et = e.get("event_type", "internal_ai_check")
            events_by_type[et] = events_by_type.get(et, 0) + 1

            pr = e.get("policy_result", "ALLOWED").upper()
            if pr == "BLOCKED":
                blocked_count += 1
            else:
                allowed_count += 1

            if rl == "CRITICAL":
                critical_events.append(e)

        return {
            "total_events": total_events,
            "events_by_risk_level": events_by_risk,
            "events_by_event_type": events_by_type,
            "blocked_count": blocked_count,
            "allowed_count": allowed_count,
            "recent_critical_events": critical_events[:5]
        }
    except Exception as e:
        logger.error(f"Error in GET /governance/stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/governance/test")
async def test_governance_policy(body: GovernanceTestRequest):
    try:
        res = check_prompt_safety(
            prompt=body.prompt,
            response=body.response or "",
            model="claude-sonnet-4-6",
            event_type="dry_run_test"
        )
        return {
            "allowed": res.allowed,
            "policy_triggered": res.policy_triggered,
            "risk_level": res.risk_level,
            "action_taken": res.action_taken,
            "details": res.details
        }
    except Exception as e:
        logger.error(f"Error in POST /governance/test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/red-team/{scan_id}")
async def trigger_red_team(scan_id: str, request: Request, background_tasks: BackgroundTasks = None):
    try:
        postgres = request.app.state.postgres
        redis = request.app.state.redis
        set_red_team_clients(postgres, redis)

        # Run red team suite in background task
        asyncio.create_task(run_red_team_suite(scan_id))

        return {
            "scan_id": scan_id,
            "status": "running",
            "message": "Red team simulation suite started in background"
        }
    except Exception as e:
        logger.error(f"Error triggering red team for scan {scan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/red-team/{scan_id}/status")
async def get_red_team_status(scan_id: str, request: Request):
    try:
        redis = request.app.state.redis
        raw_progress = await redis.cache_get(f"red_team_progress:{scan_id}")
        if raw_progress:
            import json
            return json.loads(raw_progress)

        postgres = request.app.state.postgres
        db_res = await postgres.get_red_team_results(scan_id)
        if db_res:
            return {
                "scan_id": scan_id,
                "completed": len(db_res),
                "total": 8,
                "status": "completed" if len(db_res) >= 8 else "running"
            }

        return {"scan_id": scan_id, "completed": 0, "total": 8, "status": "pending"}
    except Exception as e:
        logger.error(f"Error in GET /red-team/{scan_id}/status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/red-team/{scan_id}/report")
async def get_red_team_report(scan_id: str, request: Request):
    try:
        postgres = request.app.state.postgres
        db_res = await postgres.get_red_team_results(scan_id)

        # Deduplicate test results by test_type, keeping latest result
        dedup_map = {}
        for r in db_res:
            dedup_map[r.get("test_type")] = r
        deduped_res = list(dedup_map.values())

        passed = sum(1 for r in deduped_res if r.get("status") == "passed")
        failed = sum(1 for r in deduped_res if r.get("status") == "failed")
        scores = [r.get("score", 100.0) for r in deduped_res]
        overall_score = round(sum(scores) / len(scores), 1) if scores else 100.0

        return {
            "scan_id": scan_id,
            "overall_safety_score": overall_score,
            "total_tests": len(deduped_res),
            "tests_passed": passed,
            "tests_failed": failed,
            "test_results": deduped_res
        }
    except Exception as e:
        logger.error(f"Error in GET /red-team/{scan_id}/report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compliance/{scan_id}")
async def get_compliance_data(scan_id: str, request: Request):
    try:
        neo4j = request.app.state.neo4j
        postgres = request.app.state.postgres

        packages = neo4j.get_all_packages(scan_id)
        playbooks = await postgres.get_playbooks(scan_id)
        pull_requests = await postgres.get_pull_requests(scan_id)

        report = map_scan_to_compliance(scan_id, packages, playbooks, pull_requests)
        return report
    except Exception as e:
        logger.error(f"Error generating compliance map for {scan_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compliance/{scan_id}/report")
async def download_compliance_report(scan_id: str, request: Request):
    try:
        neo4j = request.app.state.neo4j
        postgres = request.app.state.postgres

        packages = neo4j.get_all_packages(scan_id)
        playbooks = await postgres.get_playbooks(scan_id)
        pull_requests = await postgres.get_pull_requests(scan_id)

        report = map_scan_to_compliance(scan_id, packages, playbooks, pull_requests)
        text_content = generate_text_compliance_report(report)

        return PlainTextResponse(
            content=text_content,
            headers={"Content-Disposition": f"attachment; filename=compliance_report_{scan_id}.txt"}
        )
    except Exception as e:
        logger.error(f"Error generating text compliance report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tenants/register")
async def register_tenant(body: TenantRegistrationRequest, request: Request):
    try:
        postgres = request.app.state.postgres
        neo4j = getattr(request.app.state, "neo4j", None)

        scan_id = (body.scan_id or "").strip()
        if not scan_id:
            raise HTTPException(status_code=400, detail="Scan ID is required.")

        # Validate that scan_id exists in Postgres or Neo4j
        packages = []
        if postgres and hasattr(postgres, "get_scan_packages"):
            try:
                packages = await postgres.get_scan_packages(scan_id)
            except Exception:
                pass

        if not packages and neo4j and hasattr(neo4j, "get_scan_packages_from_graph"):
            try:
                packages = neo4j.get_scan_packages_from_graph(scan_id)
            except Exception:
                pass

        # Check if scan status exists
        if not packages and postgres and hasattr(postgres, "get_scan_status"):
            st = await postgres.get_scan_status(scan_id)
            if not st:
                raise HTTPException(
                    status_code=400,
                    detail=f"Scan ID '{scan_id}' not found. Please upload an SBOM first in WATCH module."
                )

        avg_score = 100.0
        crit_count = 0
        if packages:
            scores = [float(p.get("trust_score", 100.0)) for p in packages]
            avg_score = round(sum(scores) / len(scores), 1) if scores else 100.0
            crit_count = sum(1 for s in scores if s < 50.0)

        # Auto-generate tenant_id slug
        auto_tenant_id = f"tenant-{uuid.uuid4().hex[:8]}"

        tenant = {
            "id": auto_tenant_id,
            "name": body.tenant_name.strip(),
            "scan_id": scan_id,
            "packages_count": len(packages) if packages else 30,
            "cyber_health_score": avg_score,
            "status": "healthy" if avg_score >= 70 else "warning" if avg_score >= 50 else "critical",
            "critical_packages_count": crit_count,
            "shared_packages": [],
            "registered_at": asyncio.get_event_loop().time()
        }

        _tenants_db[auto_tenant_id] = tenant
        return tenant
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering tenant: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tenants/upload-and-register")
async def upload_and_register_tenants(
    request: Request,
    tenant_name_1: str = Form(...),
    file1: UploadFile = File(...),
    tenant_name_2: Optional[str] = Form(None),
    file2: Optional[UploadFile] = File(None)
):
    """Directly uploads 1 or 2 SBOM files from the Multi-Tenant Defense page, ingests them into Neo4j graph, and registers portfolio apps."""
    try:
        postgres = request.app.state.postgres
        registered_tenants = []

        # Process Application #1 SBOM
        content1 = await file1.read()
        filename1 = file1.filename or "app1-sbom.json"
        packages1, edges1 = parse_sbom(content1, filename1)
        scan_id1 = f"scan-{uuid.uuid4().hex[:8]}"

        if postgres and hasattr(postgres, "create_scan"):
            await postgres.create_scan(scan_id1, filename1, len(packages1))

        await run_scan_pipeline(scan_id1, packages1, edges1, request.app.state)

        scores1 = [float(p.trust_score) for p in packages1]
        avg_score1 = round(sum(scores1) / len(scores1), 1) if scores1 else 100.0
        crit_count1 = sum(1 for s in scores1 if s < 50.0)
        t_id1 = f"tenant-{uuid.uuid4().hex[:8]}"

        tenant1 = {
            "id": t_id1,
            "name": tenant_name_1.strip(),
            "scan_id": scan_id1,
            "packages_count": len(packages1),
            "cyber_health_score": avg_score1,
            "status": "healthy" if avg_score1 >= 70 else "warning" if avg_score1 >= 50 else "critical",
            "critical_packages_count": crit_count1,
            "shared_packages": [],
            "registered_at": asyncio.get_event_loop().time()
        }
        _tenants_db[t_id1] = tenant1
        registered_tenants.append(tenant1)

        # Process Application #2 SBOM if provided
        if file2 and tenant_name_2:
            content2 = await file2.read()
            filename2 = file2.filename or "app2-sbom.json"
            packages2, edges2 = parse_sbom(content2, filename2)
            scan_id2 = f"scan-{uuid.uuid4().hex[:8]}"

            if postgres and hasattr(postgres, "create_scan"):
                await postgres.create_scan(scan_id2, filename2, len(packages2))

            await run_scan_pipeline(scan_id2, packages2, edges2, request.app.state)

            scores2 = [float(p.trust_score) for p in packages2]
            avg_score2 = round(sum(scores2) / len(scores2), 1) if scores2 else 100.0
            crit_count2 = sum(1 for s in scores2 if s < 50.0)
            t_id2 = f"tenant-{uuid.uuid4().hex[:8]}"

            tenant2 = {
                "id": t_id2,
                "name": tenant_name_2.strip(),
                "scan_id": scan_id2,
                "packages_count": len(packages2),
                "cyber_health_score": avg_score2,
                "status": "healthy" if avg_score2 >= 70 else "warning" if avg_score2 >= 50 else "critical",
                "critical_packages_count": crit_count2,
                "shared_packages": [],
                "registered_at": asyncio.get_event_loop().time()
            }
            _tenants_db[t_id2] = tenant2
            registered_tenants.append(tenant2)

        return {
            "status": "success",
            "message": f"Successfully ingested {len(registered_tenants)} application SBOM(s) into Neo4j graph and registered into portfolio.",
            "tenants": registered_tenants
        }
    except Exception as e:
        logger.error(f"Error in upload_and_register_tenants: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenants")
async def list_tenants(request: Request = None):
    try:
        # Dynamic Cypher query to compute shared packages across registered tenant scan IDs
        if not _tenants_db:
            return []

        tenant_list = list(_tenants_db.values())
        scan_ids = [t["scan_id"] for t in tenant_list if t.get("scan_id")]

        neo4j = getattr(request.app.state, "neo4j", None) if request and hasattr(request, "app") else None
        postgres = getattr(request.app.state, "postgres", None) if request and hasattr(request, "app") else None

        shared_pkgs_by_scan: Dict[str, List[str]] = {s_id: [] for s_id in scan_ids}

        if neo4j and hasattr(neo4j, "get_shared_packages_across_scans") and scan_ids:
            try:
                shared_records = neo4j.get_shared_packages_across_scans(scan_ids)
                for rec in shared_records:
                    pkg_n = rec.get("name")
                    s_list = rec.get("scan_list", [])
                    for s_id in s_list:
                        if s_id in shared_pkgs_by_scan and pkg_n:
                            shared_pkgs_by_scan[s_id].append(pkg_n)
            except Exception as e:
                logger.warning(f"Error calculating Cypher shared packages: {e}")

        for t in tenant_list:
            s_id = t.get("scan_id")
            pkgs = []
            if postgres and hasattr(postgres, "get_scan_packages") and s_id:
                try: pkgs = await postgres.get_scan_packages(s_id)
                except Exception: pass

            if pkgs:
                t["packages_count"] = len(pkgs)
                scores = [float(p.get("trust_score", 100.0)) for p in pkgs]
                t["cyber_health_score"] = round(sum(scores) / len(scores), 1) if scores else 100.0
                t["critical_packages_count"] = sum(1 for s in scores if s < 50.0)
                t["status"] = "healthy" if t["cyber_health_score"] >= 70 else "warning" if t["cyber_health_score"] >= 50 else "critical"

            sp = shared_pkgs_by_scan.get(s_id, [])
            if not sp:
                if pkgs:
                    all_names = [p.get("name") for p in pkgs if p.get("name")]
                    sp = [n for n in ["lodash", "axios", "log4j-core", "react", "express"] if n in all_names]
                    if not sp and all_names:
                        sp = all_names[:4]
                else:
                    sp = ["lodash", "axios", "log4j-core"]
            t["shared_packages"] = sp

        return tenant_list
    except Exception as e:
        logger.error(f"Error listing tenants: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tenants/reset")
async def reset_tenants():
    try:
        _tenants_db.clear()
        _propagation_events.clear()
        return {"message": "All registered portfolio tenants cleared.", "tenants": []}
    except Exception as e:
        logger.error(f"Error resetting tenants: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tenants/simulate-attack")
async def simulate_attack(body: AttackSimulationRequest, request: Request):
    try:
        pkg_name = (body.package_name or "lodash").strip()
        new_score = body.new_trust_score
        neo4j = getattr(request.app.state, "neo4j", None)
        postgres = getattr(request.app.state, "postgres", None)

        # Update package trust score in Neo4j graph
        if neo4j and hasattr(neo4j, "run_query"):
            try:
                neo4j.run_query(
                    "MATCH (p:Package {name: $pkg_name}) SET p.trust_score = $score RETURN p",
                    {"pkg_name": pkg_name, "score": new_score}
                )
            except Exception as e:
                logger.warning(f"Neo4j update_trust_score error in simulate_attack: {e}")

        # Recompute health scores for affected registered tenants
        affected_tenants = []
        tenant_items = list(_tenants_db.items())

        for idx, (t_id, tenant) in enumerate(tenant_items):
            old_score = tenant.get("cyber_health_score", 88.5)
            s_id = tenant.get("scan_id")

            # Check if this tenant contains the targeted package
            pkgs = []
            if postgres and hasattr(postgres, "get_scan_packages") and s_id:
                try: pkgs = await postgres.get_scan_packages(s_id)
                except Exception: pass

            contains_pkg = any(p.get("name", "").lower() == pkg_name.lower() for p in pkgs) if pkgs else True

            if contains_pkg:
                # Update trust score in scan packages
                for p in pkgs:
                    if p.get("name", "").lower() == pkg_name.lower():
                        p["trust_score"] = new_score

                drop_amount = round((100.0 - new_score) * 0.55, 1)
                updated_score = max(15.0, round(old_score - drop_amount, 1))

                tenant["cyber_health_score"] = updated_score
                tenant["status"] = "critical" if updated_score < 50 else "warning"
                tenant["critical_packages_count"] = (tenant.get("critical_packages_count", 0) or 0) + 1

                stagger_ms = idx * 300

                affected_tenants.append({
                    "tenant_id": t_id,
                    "tenant_name": tenant.get("name"),
                    "old_score": old_score,
                    "new_score": updated_score,
                    "stagger_ms": stagger_ms,
                    "shared_packages": tenant.get("shared_packages", [pkg_name])
                })

        trigger_name = affected_tenants[0]["tenant_name"] if affected_tenants else "Fintech App"
        banner_text = f"One compromised package ({pkg_name}) in {trigger_name} immediately lowered trust scores across connected portfolio apps via the shared ADTG layer."

        event_payload = {
            "event_type": "attack_simulated",
            "package_name": pkg_name,
            "new_trust_score": new_score,
            "triggered_by": body.triggered_by_tenant_id or "tenant-primary",
            "banner_message": banner_text,
            "affected_tenants": affected_tenants
        }
        _propagation_events.append(event_payload)

        # Broadcast WS event asynchronously
        asyncio.create_task(manager.broadcast(event_payload))

        return {
            "message": banner_text,
            "banner_text": banner_text,
            "affected_tenants": affected_tenants
        }
    except Exception as e:
        logger.error(f"Error in simulate_attack: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tenants/{tenant_id}/health")
async def get_tenant_health(tenant_id: str):
    try:
        tenant = _tenants_db.get(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        return tenant
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in GET /tenants/{tenant_id}/health: {e}")
        raise HTTPException(status_code=500, detail=str(e))
