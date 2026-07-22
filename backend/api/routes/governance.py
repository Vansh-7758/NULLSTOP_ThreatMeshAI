from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.schemas import PromptCheckRequest, PromptCheckResponse, ErrorResponse, AIHealthMetrics

router = APIRouter()

@router.post("/governance/check-prompt")
async def check_prompt(req: PromptCheckRequest):
    try:
        return PromptCheckResponse(allowed=True, explanation="Mock")
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="GovError", message=str(e)).model_dump())

@router.get("/governance/audit-log")
async def audit_log():
    try:
        return []
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="GovError", message=str(e)).model_dump())

@router.get("/governance/policies")
async def get_policies():
    try:
        return []
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="GovError", message=str(e)).model_dump())

@router.get("/governance/metrics")
async def get_metrics():
    try:
        return AIHealthMetrics()
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="GovError", message=str(e)).model_dump())
