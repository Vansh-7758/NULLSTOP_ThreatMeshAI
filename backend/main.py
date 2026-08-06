# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from database.neo4j_client import Neo4jClient
from database.postgres_client import PostgresClient
from database.redis_client import RedisClient
from api.websocket import manager
from governance.audit_logger import set_audit_postgres_client

try:
    from api.routes.scan import router as scan_router
except ImportError:
    scan_router = None

try:
    from api.routes.packages import router as packages_router
except ImportError:
    packages_router = None

try:
    from api.routes.playbooks import router as playbooks_router
except ImportError:
    playbooks_router = None

try:
    from api.routes.governance import router as governance_router
except ImportError:
    governance_router = None

try:
    from api.routes.red_team import router as red_team_router
except ImportError:
    red_team_router = None

try:
    from api.routes.health import router as health_router
except ImportError:
    health_router = None

try:
    from api.routes.remediation import router as remediation_router
except ImportError:
    remediation_router = None

try:
    from api.routes.predictions import router as predictions_router
except ImportError:
    predictions_router = None

try:
    from api.routes.hunt import router as hunt_router
except ImportError:
    hunt_router = None

try:
    from api.routes.defend import router as defend_router
except ImportError:
    defend_router = None

try:
    from api.routes.compliance_full import router as compliance_full_router
except ImportError:
    compliance_full_router = None

try:
    from api.routes.verification import router as verification_router
except ImportError:
    verification_router = None

try:
    from api.routes.red_team_service import router as red_team_service_router
except ImportError:
    red_team_service_router = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up and connecting to databases...")
    app.state.neo4j = Neo4jClient().connect()
    app.state.postgres = await PostgresClient().connect()
    app.state.redis = await RedisClient().connect()
    app.state.hunt_sessions = {}
    set_audit_postgres_client(app.state.postgres)

    # Ensure verification tables exist on startup
    if app.state.postgres and app.state.postgres.pool:
        try:
            async with app.state.postgres.pool.acquire() as conn:
                await conn.execute("""
                CREATE TABLE IF NOT EXISTS sbom_cross_validations (
                    id TEXT PRIMARY KEY,
                    scan_id TEXT,
                    question_id TEXT,
                    answer_given TEXT,
                    validation_status TEXT,
                    confidence_adjustment FLOAT DEFAULT 0.0,
                    evidence TEXT,
                    technical_detail TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                """)
                await conn.execute("""
                CREATE TABLE IF NOT EXISTS domain_signal_reports (
                    id TEXT PRIMARY KEY,
                    scan_id TEXT,
                    domain TEXT,
                    overall_signal_score FLOAT DEFAULT 0.0,
                    checks JSONB DEFAULT '[]',
                    checked_at TIMESTAMP DEFAULT NOW()
                );
                """)
                await conn.execute("""
                CREATE TABLE IF NOT EXISTS answer_confidence_scores (
                    id TEXT PRIMARY KEY,
                    scan_id TEXT,
                    question_id TEXT,
                    answer_given TEXT,
                    base_score FLOAT,
                    cross_validation_adjustment FLOAT,
                    domain_signal_contribution FLOAT,
                    final_confidence_score FLOAT,
                    confidence_level TEXT,
                    confidence_label TEXT,
                    corroborating_evidence TEXT,
                    requires_manual_evidence BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                """)
        except Exception as e:
            logger.warning(f"Lifespan verification table creation warning: {e}")
    
    yield
    
    logger.info("Shutting down databases...")
    try:
        if getattr(app.state, 'neo4j', None): app.state.neo4j.close()
    except Exception: pass
    try:
        if getattr(app.state, 'postgres', None): await app.state.postgres.close()
    except Exception: pass
    try:
        if getattr(app.state, 'redis', None): await app.state.redis.close()
    except Exception: pass

app = FastAPI(
    title="ThreatMesh X API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if scan_router:
    app.include_router(scan_router, prefix="/api")
if packages_router:
    app.include_router(packages_router, prefix="/api")
if playbooks_router:
    app.include_router(playbooks_router, prefix="/api")
if governance_router:
    app.include_router(governance_router, prefix="/api")
if red_team_router:
    app.include_router(red_team_router, prefix="/api")
if health_router:
    app.include_router(health_router, prefix="/api")
if remediation_router:
    app.include_router(remediation_router, prefix="/api")
if predictions_router:
    app.include_router(predictions_router, prefix="/api")
if hunt_router:
    app.include_router(hunt_router, prefix="/api")
if defend_router:
    app.include_router(defend_router, prefix="/api")
if compliance_full_router:
    app.include_router(compliance_full_router, prefix="/api")
if verification_router:
    app.include_router(verification_router, prefix="/api")
if red_team_service_router:
    app.include_router(red_team_service_router, prefix="/api")

@app.get("/")
async def root():
    return {"name": "ThreatMesh X API", "version": "1.0.0"}

@app.websocket("/ws")
@app.websocket("/ws/trust-updates")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
