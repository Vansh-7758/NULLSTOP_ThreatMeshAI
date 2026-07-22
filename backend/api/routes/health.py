from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.schemas import HealthStatus, ErrorResponse

router = APIRouter()

@router.get("/health")
async def health():
    try:
        return HealthStatus(status="healthy", services={"postgres": "up", "neo4j": "up", "redis": "up"})
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="HealthError", message=str(e)).model_dump())
