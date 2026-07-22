from fastapi import APIRouter, UploadFile, BackgroundTasks, Request
from fastapi.responses import JSONResponse
import uuid
import logging

from models.schemas import ScanResponse, ErrorResponse, ScanStatus, ScanStatusEnum
from ingestion.sbom_parser import parse_sbom
from ingestion.threat_feeds import fetch_vulnerabilities
from graph.adtg_scorer import compute_trust_scores
from graph.reachability import find_attack_paths
from agents.council import run_council
from prediction.risk_predictor import predict_risks
from api.websocket import manager

logger = logging.getLogger(__name__)
router = APIRouter()

async def run_scan_pipeline(scan_id: str, packages, edges, app_state):
    try:
        postgres = app_state.postgres
        neo4j = app_state.neo4j
        redis = app_state.redis
        
        # Stage 1: Store packages in Neo4j
        await postgres.update_scan_status(scan_id, 'running', 10.0, 'Storing packages in graph')
        for pkg in packages:
            neo4j.create_package_node(pkg)
        for parent_ref, child_ref in edges:
            neo4j.create_dependency_edge(parent_ref, child_ref)
        await manager.send_live_event('scan_progress', 'Packages stored', f'{len(packages)} packages ingested into knowledge graph', 'info', {})
        
        # Stage 2: Fetch threat intelligence
        await postgres.update_scan_status(scan_id, 'running', 30.0, 'Fetching threat intelligence')
        cves = await fetch_vulnerabilities(packages, redis)
        for cve in cves:
            neo4j.create_cve_node(cve)
        cve_count = len(cves)
        await manager.send_live_event('cve_detected', 'CVEs fetched', f'{cve_count} vulnerabilities detected', 'warning' if cve_count > 0 else 'info', {})
        
        # Stage 3: Compute ADTG trust scores
        await postgres.update_scan_status(scan_id, 'running', 50.0, 'Computing trust scores')
        scores = await compute_trust_scores(neo4j, redis, manager)
        
        # Stage 4: Find attack paths
        await postgres.update_scan_status(scan_id, 'running', 65.0, 'Analyzing attack paths')
        root_name = packages[0].name if packages else 'demo-app'
        attack_paths = await find_attack_paths(neo4j, scan_id, root_name)
        for ap in attack_paths:
            await postgres.save_attack_path(ap)
        
        # Stage 5: Run AI Council for at-risk packages
        await postgres.update_scan_status(scan_id, 'running', 75.0, 'Running AI Council')
        at_risk = [s for s in scores if s.score < 50]
        for ts in at_risk:
            pkg_cves = neo4j.get_package_cves(ts.package_name, ts.version)
            context = {
                'scan_id': scan_id,
                'package_name': ts.package_name,
                'current_version': ts.version,
                'trust_score': ts.score,
                'breakdown': ts.breakdown.model_dump(),
                'cve_data': [c for c in pkg_cves],
                'attack_paths': [ap.model_dump() for ap in attack_paths if ap.target_package == f"{ts.package_name}@{ts.version}"]
            }
            playbook = await run_council(context)
            await postgres.save_playbook(playbook)
            await manager.send_live_event('playbook_created', f'Playbook: {ts.package_name}', f'AI Council generated remediation playbook', 'info', {'package': ts.package_name})
        
        # Stage 6: Run predictions
        await postgres.update_scan_status(scan_id, 'running', 90.0, 'Running prediction engine')
        predictions = await predict_risks(neo4j, scan_id)
        for pred in predictions:
            await postgres.save_prediction(scan_id, pred)
        
        # Stage 7: Complete
        at_risk_count = len(at_risk)
        await postgres.update_scan_status(
            scan_id, 'completed', 100.0, 'Complete',
            total_packages=len(packages), at_risk_count=at_risk_count, cve_count=cve_count
        )
        await manager.send_live_event('scan_completed', 'Scan Complete', f'Analyzed {len(packages)} packages, found {at_risk_count} at risk', 'info', {'scan_id': scan_id})
        
    except Exception as e:
        logger.error(f'Pipeline error for scan {scan_id}: {e}')
        try:
            await postgres.update_scan_status(scan_id, 'failed', 0.0, f'Error: {str(e)}')
        except Exception:
            pass
        await manager.send_live_event('scan_failed', 'Scan Failed', str(e), 'critical', {'scan_id': scan_id})

@router.post('/upload-sbom', response_model=ScanResponse)
async def upload_sbom(file: UploadFile, request: Request, background_tasks: BackgroundTasks):
    try:
        content = await file.read()
        scan_id = str(uuid.uuid4())
        packages, edges = parse_sbom(content, file.filename or 'unknown.json')
        await request.app.state.postgres.create_scan(scan_id, file.filename or 'unknown.json')
        # Run pipeline in background
        background_tasks.add_task(run_scan_pipeline, scan_id, packages, edges, request.app.state)
        return ScanResponse(scan_id=scan_id, status='processing', message=f'SBOM uploaded with {len(packages)} packages. Pipeline started.')
    except Exception as e:
        logger.error(f'Upload error: {e}')
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type='UploadError', message=str(e)).model_dump())

@router.post('/scan/{scan_id}')
async def trigger_scan(scan_id: str, background_tasks: BackgroundTasks, request: Request):
    try:
        scan = await request.app.state.postgres.get_scan(scan_id)
        if not scan:
            return JSONResponse(status_code=404, content=ErrorResponse(status_code=404, error_type='NotFound', message=f'Scan {scan_id} not found').model_dump())
        return {'job_id': scan_id, 'status': 'started'}
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type='ScanError', message=str(e)).model_dump())

@router.get('/scan/{scan_id}/status')
async def get_scan_status(scan_id: str, request: Request):
    try:
        scan = await request.app.state.postgres.get_scan(scan_id)
        if not scan:
            return JSONResponse(status_code=404, content=ErrorResponse(status_code=404, error_type='NotFound', message=f'Scan {scan_id} not found').model_dump())
        return ScanStatus(
            scan_id=scan_id,
            status=scan.get('status', 'pending'),
            progress=scan.get('progress', 0.0),
            current_stage=scan.get('current_stage', ''),
            sbom_filename=scan.get('sbom_filename', ''),
            total_packages=scan.get('total_packages', 0),
            at_risk_count=scan.get('at_risk_count', 0),
            cve_count=scan.get('cve_count', 0)
        )
    except Exception as e:
        return JSONResponse(status_code=500, content=ErrorResponse(status_code=500, error_type='StatusError', message=str(e)).model_dump())
