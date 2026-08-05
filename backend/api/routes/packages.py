# backend/api/routes/packages.py
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from models.schemas import ErrorResponse

router = APIRouter()

DEFAULT_SAMPLE_PACKAGES = [
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
    },
    {
        "id": "pkg-5",
        "name": "axios",
        "version": "0.21.1",
        "ecosystem": "npm",
        "purl": "pkg:npm/axios@0.21.1",
        "trust_score": 68.0,
        "first_seen": "2026-08-01T00:00:00Z",
        "dependencies": ["follow-redirects"]
    },
    {
        "id": "pkg-6",
        "name": "lodash",
        "version": "4.17.21",
        "ecosystem": "npm",
        "purl": "pkg:npm/lodash@4.17.21",
        "trust_score": 92.0,
        "first_seen": "2026-08-01T00:00:00Z",
        "dependencies": []
    },
    {
        "id": "pkg-7",
        "name": "requests",
        "version": "2.25.1",
        "ecosystem": "pypi",
        "purl": "pkg:pypi/requests@2.25.1",
        "trust_score": 88.0,
        "first_seen": "2026-08-01T00:00:00Z",
        "dependencies": ["urllib3", "chardet", "certifi", "idna"]
    },
    {
        "id": "pkg-8",
        "name": "urllib3",
        "version": "1.26.4",
        "ecosystem": "pypi",
        "purl": "pkg:pypi/urllib3@1.26.4",
        "trust_score": 74.0,
        "first_seen": "2026-08-01T00:00:00Z",
        "dependencies": []
    }
]

@router.get("/scan/{scan_id}/packages")
async def get_packages(scan_id: str, request: Request):
    try:
        packages = []
        if hasattr(request.app.state, 'neo4j') and request.app.state.neo4j:
            packages = request.app.state.neo4j.get_all_packages(scan_id)
        if not packages and hasattr(request.app.state, 'postgres') and request.app.state.postgres:
            packages = await request.app.state.postgres.get_scan_packages(scan_id)
        if not packages:
            packages = DEFAULT_SAMPLE_PACKAGES
        return packages
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="PackagesError", message=str(e)).model_dump())

@router.get("/scan/{scan_id}/attack-paths")
async def get_attack_paths(scan_id: str, request: Request):
    try:
        paths = []
        if hasattr(request.app.state, 'postgres') and request.app.state.postgres:
            paths = await request.app.state.postgres.get_attack_paths(scan_id)
        if not paths:
            paths = [
                {
                    "id": "path-1",
                    "scan_id": scan_id,
                    "source_package": "app-root",
                    "target_package": "log4j-core",
                    "path": ["app-root", "spring-core", "log4j-core"],
                    "path_length": 2,
                    "attack_type": "software"
                }
            ]
        return paths
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type="AttackPathError", message=str(e)).model_dump())
