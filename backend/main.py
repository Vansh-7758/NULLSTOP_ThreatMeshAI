from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from database.neo4j_client import Neo4jClient
from database.postgres_client import PostgresClient
from database.redis_client import RedisClient
from api.websocket import manager

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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up and connecting to databases...")
    try:
        app.state.neo4j = Neo4jClient().connect()
    except Exception as e:
        logger.warning(f"Neo4j startup failed: {e}")
        app.state.neo4j = Neo4jClient()

    try:
        app.state.postgres = PostgresClient()
        await app.state.postgres.connect()
    except Exception as e:
        logger.warning(f"Postgres startup failed: {e}")
        app.state.postgres = PostgresClient()

    try:
        app.state.redis = RedisClient()
        await app.state.redis.connect()
    except Exception as e:
        logger.warning(f"Redis startup failed: {e}")
        app.state.redis = RedisClient()

    yield
    logger.info("Shutting down and disconnecting from databases...")
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
    allow_credentials=True,
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

@app.get("/")
async def root():
    return {"name": "ThreatMesh X API", "version": "1.0.0"}

@app.websocket("/ws/trust-updates")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
