from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from models.schemas import ErrorResponse

router = APIRouter()

@router.get("/scan/{scan_id}/packages")
async def get_packages(scan_id: str, request: Request):
    try:
        packages = request.app.state.neo4j.get_all_packages(scan_id)
        return packages
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="PackagesError", message=str(e)).model_dump())

@router.get("/scan/{scan_id}/attack-paths")
async def get_attack_paths(scan_id: str, request: Request):
    try:
        paths = await request.app.state.postgres.get_attack_paths(scan_id)
        return paths
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="AttackPathError", message=str(e)).model_dump())
