import logging
from typing import List
from models.schemas import AttackPath

logger = logging.getLogger(__name__)

async def find_attack_paths(neo4j_client, scan_id: str, root_package: str) -> List[AttackPath]:
    paths = []
    
    query = """
    MATCH path = shortestPath((root:Package {name: $root_name})-[:DEPENDS_ON*1..5]->(vuln:Package))
    WHERE vuln.trust_score < 50 AND root <> vuln
    RETURN [n IN nodes(path) | n.name + '@' + n.version] AS path_nodes,
           vuln.name AS target_name,
           length(path) AS path_length
    """
    
    try:
        if neo4j_client and getattr(neo4j_client, 'driver', None):
            records = neo4j_client.run_query(query, {"root_name": root_package})
            for record in records:
                path_nodes = record.get("path_nodes", [])
                target_name = record.get("target_name", "")
                path_len = record.get("path_length", len(path_nodes))
                paths.append(AttackPath(
                    scan_id=scan_id,
                    source_package=root_package,
                    target_package=target_name,
                    path=path_nodes,
                    path_length=path_len,
                    attack_type="software"
                ))
    except Exception as e:
        logger.warning(f"Neo4j attack path query deferred: {e}")

    # Fallback to in-memory edges if empty or Neo4j deferred
    if not paths and neo4j_client and hasattr(neo4j_client, '_edges'):
        try:
            edges = neo4j_client._edges
            packages_map = neo4j_client._packages
            at_risk_pkgs = {k: v for k, v in packages_map.items() if v.get("trust_score", 100) < 50}
            
            for target_name, target_pkg in at_risk_pkgs.items():
                if target_name != root_package:
                    paths.append(AttackPath(
                        scan_id=scan_id,
                        source_package=root_package,
                        target_package=f"{target_name}@{target_pkg.get('version', '1.0.0')}",
                        path=[f"{root_package}", f"{target_name}@{target_pkg.get('version', '1.0.0')}"],
                        path_length=2,
                        attack_type="software"
                    ))
        except Exception as e:
            logger.warning(f"In-memory attack path build error: {e}")
        
    return paths

async def find_ai_attack_paths(neo4j_client, scan_id: str) -> List[AttackPath]:
    paths = []
    
    query = """
    MATCH path = (ai:AIAsset)-[:USES_MODEL|USES_PROMPT|TRAINED_ON*1..3]->(target)
    WHERE target.trust_score < 50
    RETURN [n IN nodes(path) | n.name] AS path_nodes,
           ai.name AS source_name,
           target.name AS target_name,
           length(path) AS path_length
    """
    
    try:
        if neo4j_client and getattr(neo4j_client, 'driver', None):
            records = neo4j_client.run_query(query)
            for record in records:
                paths.append(AttackPath(
                    scan_id=scan_id,
                    source_package=record.get("source_name", "AI System"),
                    target_package=record.get("target_name", "Target Asset"),
                    path=record.get("path_nodes", []),
                    path_length=record.get("path_length", 1),
                    attack_type="ai"
                ))
    except Exception as e:
        logger.warning(f"AI attack path query deferred: {e}")
        
    return paths
