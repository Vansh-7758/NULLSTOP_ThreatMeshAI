# backend/api/routes/compliance_full.py
"""FastAPI endpoints for expanded Feature 7 full-spectrum compliance assessment engine."""
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel

from compliance.question_bank import QUESTION_BANK
from compliance.profile_engine import create_company_profile, get_company_profile, determine_applicable_frameworks
from compliance.scoring_engine import compute_compliance_scores, save_answers, get_assessments_by_scan
from compliance.gap_analyzer import generate_remediation_roadmap, generate_executive_summary, generate_audit_report_text
from api.websocket import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compliance", tags=["Compliance"])

# In-memory stores for sessions and reports fallback
_sessions_db: Dict[str, Dict[str, Any]] = {}
_reports_db: Dict[str, Dict[str, Any]] = {}

class ProfileCreateRequest(BaseModel):
    industry: str
    company_size: str
    regions: List[str] = []
    data_types: List[str] = []
    existing_certifications: List[str] = []

class AnswerItem(BaseModel):
    question_id: str
    answer: str
    notes: Optional[str] = ""

class AnswersSubmitRequest(BaseModel):
    answers: List[AnswerItem]

async def run_full_report_generation(scan_id: str, app_state):
    """Background task to run scoring, Claude AI gap analysis, and generate final audit report."""
    try:
        postgres = app_state.postgres
        neo4j = app_state.neo4j

        profile = await get_company_profile(scan_id, postgres) or {
            "industry": "Technology/SaaS",
            "company_size": "51-200 employees",
            "regions": ["United States", "European Union"],
            "data_types": ["Personal/PII data"],
            "existing_certifications": ["ISO 27001 certified"]
        }

        scores = await compute_compliance_scores(scan_id, profile.get("id", ""), postgres, neo4j)

        # Get SBOM findings for technical penalty & evidence
        at_risk_pkgs = []
        if neo4j and hasattr(neo4j, "run_query"):
            try:
                records = neo4j.run_query("MATCH (p:Package) WHERE p.trust_score < 50 RETURN p.name AS name, p.version AS version, p.trust_score AS trust_score LIMIT 5")
                at_risk_pkgs = [dict(r) for r in records]
            except Exception:
                pass
        sbom_findings = {"at_risk_packages": at_risk_pkgs}

        roadmap = await generate_remediation_roadmap(scores.critical_gaps, profile, sbom_findings)
        exec_summary = await generate_executive_summary(scores, profile, roadmap)
        assessments_dict = await get_assessments_by_scan(scan_id, postgres)
        report_text = await generate_audit_report_text(scores, profile, list(assessments_dict.values()), sbom_findings, exec_summary, roadmap)

        report_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        report_dict = {
            "id": report_id,
            "scan_id": scan_id,
            "company_profile_id": profile.get("id", ""),
            "generated_at": now_iso,
            "overall_score": scores.overall_score,
            "domain_scores": scores.domain_scores,
            "framework_scores": scores.framework_scores,
            "gap_count": scores.gap_count,
            "critical_gaps": scores.critical_gaps,
            "remediation_roadmap": roadmap,
            "executive_summary": exec_summary,
            "report_text": report_text
        }

        _reports_db[scan_id] = report_dict

        if postgres and getattr(postgres, "pool", None):
            try:
                query = """
                INSERT INTO compliance_reports (
                    id, scan_id, company_profile_id, generated_at, overall_score,
                    framework_scores, domain_scores, gap_count, critical_gaps,
                    remediation_roadmap, report_text
                ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10)
                """
                await postgres._execute_with_retry(
                    query,
                    report_id, scan_id, profile.get("id", ""), scores.overall_score,
                    json.dumps(scores.framework_scores), json.dumps(scores.domain_scores),
                    scores.gap_count, json.dumps(scores.critical_gaps),
                    json.dumps(roadmap), report_text
                )
            except Exception as e:
                logger.warning(f"Fallback to in-memory compliance report save: {e}")

        # Broadcast WebSocket notification
        await manager.broadcast({
            "event_type": "compliance_report_ready",
            "scan_id": scan_id,
            "report_id": report_id,
            "overall_score": scores.overall_score
        })

    except Exception as e:
        logger.error(f"Error generating full compliance report for scan {scan_id}: {e}", exc_info=True)

@router.post("/{scan_id}/profile")
async def create_profile_endpoint(scan_id: str, body: ProfileCreateRequest, request: Request):
    try:
        postgres = request.app.state.postgres
        neo4j = request.app.state.neo4j

        profile_id = await create_company_profile(
            scan_id=scan_id,
            industry=body.industry,
            company_size=body.company_size,
            regions=body.regions,
            data_types=body.data_types,
            existing_certifications=body.existing_certifications,
            postgres_client=postgres
        )

        profile = await get_company_profile(scan_id, postgres)
        applicable_frameworks = await determine_applicable_frameworks(profile, neo4j)

        # Initialize session
        session_id = str(uuid.uuid4())
        session_dict = {
            "id": session_id,
            "scan_id": scan_id,
            "status": "in_progress",
            "current_domain": "software",
            "completed_domains": [],
            "total_questions": 42,
            "answered_questions": 0
        }
        _sessions_db[scan_id] = session_dict

        if postgres and getattr(postgres, "pool", None):
            try:
                query = """
                INSERT INTO compliance_sessions (id, scan_id, status, current_domain, completed_domains, total_questions, answered_questions)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
                """
                await postgres._execute_with_retry(query, session_id, scan_id, "in_progress", "software", json.dumps([]), 42, 0)
            except Exception as e:
                logger.warning(f"Fallback to in-memory session save: {e}")

        return {
            "profile_id": profile_id,
            "applicable_frameworks": applicable_frameworks
        }
    except Exception as e:
        logger.error(f"Error creating company profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}/profile")
async def get_profile_endpoint(scan_id: str, request: Request):
    try:
        profile = await get_company_profile(scan_id, request.app.state.postgres)
        if not profile:
            raise HTTPException(status_code=404, detail="Company profile not found for scan")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}/questions/{domain}")
async def get_questions_endpoint(scan_id: str, domain: str, request: Request):
    try:
        domain_key = domain.lower()
        if domain_key not in QUESTION_BANK:
            raise HTTPException(status_code=400, detail=f"Invalid domain {domain}")

        questions = QUESTION_BANK[domain_key]
        profile = await get_company_profile(scan_id, request.app.state.postgres)
        
        if profile:
            applicable = await determine_applicable_frameworks(profile, request.app.state.neo4j)
            filtered = []
            for q in questions:
                # Include if any framework in q["frameworks"] is applicable (status != "none")
                if any(applicable.get(fw, "standard") != "none" for fw in q.get("frameworks", [])):
                    filtered.append(q)
            return filtered

        return questions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}/session")
async def get_session_endpoint(scan_id: str, request: Request):
    try:
        assessments = await get_assessments_by_scan(scan_id, request.app.state.postgres)
        answered_count = len(assessments)
        
        session = _sessions_db.get(scan_id, {
            "id": f"sess-{scan_id}",
            "scan_id": scan_id,
            "status": "in_progress" if answered_count > 0 else "not_started",
            "current_domain": "software",
            "completed_domains": [],
            "total_questions": 42,
            "answered_questions": answered_count
        })
        session["answered_questions"] = answered_count
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{scan_id}/answers")
async def submit_answers_endpoint(scan_id: str, body: AnswersSubmitRequest, request: Request, background_tasks: BackgroundTasks):
    try:
        postgres = request.app.state.postgres
        answers_dicts = [a.model_dump() for a in body.answers]
        await save_answers(scan_id, answers_dicts, postgres)

        assessments = await get_assessments_by_scan(scan_id, postgres)
        answered_count = len(assessments)

        # Update session
        session = _sessions_db.get(scan_id, {
            "id": f"sess-{scan_id}",
            "scan_id": scan_id,
            "status": "in_progress",
            "current_domain": "software",
            "completed_domains": [],
            "total_questions": 42,
            "answered_questions": answered_count
        })
        session["answered_questions"] = answered_count
        if answered_count >= 42:
            session["status"] = "completed"
            background_tasks.add_task(run_full_report_generation, scan_id, request.app.state)

        _sessions_db[scan_id] = session
        return {"status": "saved", "answered_questions": answered_count}
    except Exception as e:
        logger.error(f"Error submitting answers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}/scores")
async def get_scores_endpoint(scan_id: str, request: Request):
    try:
        postgres = request.app.state.postgres
        neo4j = request.app.state.neo4j
        profile = await get_company_profile(scan_id, postgres) or {}
        scores = await compute_compliance_scores(scan_id, profile.get("id", ""), postgres, neo4j)
        return {
            "overall_score": scores.overall_score,
            "domain_scores": scores.domain_scores,
            "framework_scores": scores.framework_scores,
            "critical_gaps": scores.critical_gaps,
            "gap_count": scores.gap_count,
            "domain_counts": scores.domain_counts
        }
    except Exception as e:
        logger.error(f"Error computing scores: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{scan_id}/generate-report")
async def generate_report_endpoint(scan_id: str, request: Request, background_tasks: BackgroundTasks):
    try:
        report_id = str(uuid.uuid4())
        background_tasks.add_task(run_full_report_generation, scan_id, request.app.state)
        return {"report_id": report_id, "status": "processing"}
    except Exception as e:
        logger.error(f"Error triggering report generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}/report")
async def get_report_endpoint(scan_id: str, request: Request):
    try:
        report = _reports_db.get(scan_id)
        if not report:
            # Generate fallback report on demand if not cached
            postgres = request.app.state.postgres
            neo4j = request.app.state.neo4j
            profile = await get_company_profile(scan_id, postgres) or {"industry": "Technology"}
            scores = await compute_compliance_scores(scan_id, profile.get("id", ""), postgres, neo4j)
            roadmap = await generate_remediation_roadmap(scores.critical_gaps, profile, {})
            exec_summary = await generate_executive_summary(scores, profile, roadmap)
            report_text = await generate_audit_report_text(scores, profile, [], {}, exec_summary, roadmap)
            report = {
                "id": str(uuid.uuid4()),
                "scan_id": scan_id,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "overall_score": scores.overall_score,
                "framework_scores": scores.framework_scores,
                "domain_scores": scores.domain_scores,
                "gap_count": scores.gap_count,
                "critical_gaps": scores.critical_gaps,
                "remediation_roadmap": roadmap,
                "executive_summary": exec_summary,
                "report_text": report_text
            }
            _reports_db[scan_id] = report

        return report
    except Exception as e:
        logger.error(f"Error getting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scan_id}/report/download")
async def download_report_endpoint(scan_id: str, request: Request):
    try:
        report = _reports_db.get(scan_id)
        if not report or not report.get("report_text"):
            postgres = request.app.state.postgres
            neo4j = request.app.state.neo4j
            profile = await get_company_profile(scan_id, postgres) or {"industry": "Technology"}
            scores = await compute_compliance_scores(scan_id, profile.get("id", ""), postgres, neo4j)
            roadmap = await generate_remediation_roadmap(scores.critical_gaps, profile, {})
            exec_summary = await generate_executive_summary(scores, profile, roadmap)
            report_text = await generate_audit_report_text(scores, profile, [], {}, exec_summary, roadmap)
        else:
            report_text = report.get("report_text")

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return PlainTextResponse(
            content=report_text,
            headers={
                "Content-Disposition": f'attachment; filename="threatmesh-compliance-report-{today_str}.txt"'
            }
        )
    except Exception as e:
        logger.error(f"Error downloading report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
