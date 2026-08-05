# backend/api/routes/red_team_service.py
import asyncio
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from red_team.orchestrator import run_ai_red_team_service_suite
from red_team.eu_ai_act_mapper import get_all_compliance_mappings
from models.schemas import ErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/defend/red-team-service", tags=["AI Red Team Service"])


class AIProductConfigRequest(BaseModel):
    ai_product_endpoint: Optional[str] = None
    ai_product_type: Optional[str] = "customer_chatbot"
    auth_header_name: Optional[str] = "Authorization"
    auth_scheme: Optional[str] = "Bearer"
    api_key_plain: Optional[str] = None
    response_field_path: Optional[str] = "response.text"
    testing_consent: bool = False


@router.post("/{scan_id}/config")
async def update_ai_product_config(scan_id: str, body: AIProductConfigRequest, request: Request):
    """Updates company profile with AI product configuration and consent status."""
    try:
        postgres = request.app.state.postgres
        if not postgres or not hasattr(postgres, "update_company_profile_ai_config"):
            raise HTTPException(status_code=500, detail="Database client unavailable")

        updated_profile = await postgres.update_company_profile_ai_config(
            scan_id=scan_id,
            ai_product_endpoint=body.ai_product_endpoint,
            ai_product_type=body.ai_product_type,
            auth_header_name=body.auth_header_name or "Authorization",
            auth_scheme=body.auth_scheme or "Bearer",
            api_key_plain=body.api_key_plain,
            response_field_path=body.response_field_path or "response.text",
            testing_consent=body.testing_consent
        )

        return {
            "status": "success",
            "message": "AI Product configuration updated successfully",
            "company_profile": updated_profile
        }
    except Exception as e:
        logger.error(f"Error updating AI product config for scan {scan_id}: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="ConfigError", message=str(e)).model_dump()
        )


@router.post("/{scan_id}/run")
async def start_red_team_run(scan_id: str, request: Request, background_tasks: BackgroundTasks):
    """Starts an AI Red Team test run.
    Hard backend gate: If an external endpoint is configured, testing_consent MUST be true!
    """
    try:
        postgres = request.app.state.postgres

        # Backend Consent Gate Verification
        if postgres and hasattr(postgres, "get_company_profile"):
            prof = await postgres.get_company_profile(scan_id)
            if prof:
                endpoint = (prof.get("ai_product_endpoint") or "").strip()
                consent = bool(prof.get("testing_consent"))
                if endpoint and not consent:
                    raise HTTPException(
                        status_code=400,
                        detail="Consent required: You must explicitly confirm ownership or written authorization before testing an external AI product endpoint."
                    )

        # Trigger orchestration suite as background task
        background_tasks.add_task(run_ai_red_team_service_suite, scan_id, request.app.state)

        return {
            "scan_id": scan_id,
            "status": "started",
            "message": "AI Red Team test suite started successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting red team run for scan {scan_id}: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="RunStartError", message=str(e)).model_dump()
        )


@router.get("/{scan_id}/status")
async def get_red_team_run_status(scan_id: str, request: Request):
    """Returns status and progress of the active or most recent AI Red Team run."""
    try:
        postgres = request.app.state.postgres
        if postgres and hasattr(postgres, "get_latest_ai_red_team_run"):
            run = await postgres.get_latest_ai_red_team_run(scan_id)
            if run:
                return {
                    "scan_id": scan_id,
                    "run_id": run.get("id"),
                    "status": run.get("status", "completed"),
                    "target_mode": run.get("target_mode", "internal_demo"),
                    "completed_tests": run.get("completed_tests", 0),
                    "total_tests": run.get("total_tests", 32),
                    "overall_score": run.get("overall_score", 0.0)
                }

        return {
            "scan_id": scan_id,
            "status": "pending",
            "target_mode": "internal_demo",
            "completed_tests": 0,
            "total_tests": 32,
            "overall_score": 0.0
        }
    except Exception as e:
        logger.error(f"Error getting red team status for scan {scan_id}: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="StatusError", message=str(e)).model_dump()
        )


@router.get("/{scan_id}/report")
async def get_latest_red_team_report(scan_id: str, request: Request):
    """Returns full AI Security Assessment Report for the latest completed run, mapped to EU AI Act & ISO 42001."""
    try:
        postgres = request.app.state.postgres
        run = None
        results = []

        if postgres and hasattr(postgres, "get_latest_ai_red_team_run"):
            run = await postgres.get_latest_ai_red_team_run(scan_id)
            if run and hasattr(postgres, "get_ai_red_team_run_results_for_run"):
                results = await postgres.get_ai_red_team_run_results_for_run(run.get("id"))

        compliance_mappings = get_all_compliance_mappings()

        # Group test results by attack vector
        vector_details = {}
        for r in results:
            vec = r.get("attack_vector")
            if vec not in vector_details:
                vector_details[vec] = []
            vector_details[vec].append(r)

        return {
            "scan_id": scan_id,
            "run": run,
            "overall_safety_score": run.get("overall_score", 100.0) if run else 100.0,
            "target_mode": run.get("target_mode", "internal_demo") if run else "internal_demo",
            "target_endpoint": run.get("target_endpoint", "ThreatMesh Internal AI Council") if run else "ThreatMesh Internal AI Council",
            "total_test_results": len(results),
            "vector_scores": run.get("vector_scores", {}) if run else {},
            "vector_details": vector_details,
            "compliance_mappings": compliance_mappings
        }
    except Exception as e:
        logger.error(f"Error fetching red team report for scan {scan_id}: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="ReportError", message=str(e)).model_dump()
        )


@router.get("/{scan_id}/history")
async def get_red_team_run_history(scan_id: str, request: Request):
    """Returns historical list of completed AI Red Team runs for progress tracking charts."""
    try:
        postgres = request.app.state.postgres
        history = []
        if postgres and hasattr(postgres, "get_ai_red_team_run_history"):
            history = await postgres.get_ai_red_team_run_history(scan_id, limit=15)

        return {
            "scan_id": scan_id,
            "history": history
        }
    except Exception as e:
        logger.error(f"Error fetching red team history for scan {scan_id}: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status_code=500, error_type="HistoryError", message=str(e)).model_dump()
        )
