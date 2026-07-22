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
        records, _, _ = await neo4j_client.execute_query(query, root_name=root_package)
        for record in records:
            paths.append(AttackPath(
                scan_id=scan_id,
                source_package=root_package,
                target_package=record["target_name"],
                path=record["path_nodes"],
                path_length=record["path_length"],
                attack_type="software"
            ))
    except Exception as e:
        logger.error(f"Error finding attack paths: {e}")
        
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
        records, _, _ = await neo4j_client.execute_query(query)
        for record in records:
            paths.append(AttackPath(
                scan_id=scan_id,
                source_package=record["source_name"],
                target_package=record["target_name"],
                path=record["path_nodes"],
                path_length=record["path_length"],
                attack_type="ai"
            ))
    except Exception as e:
        logger.error(f"Error finding AI attack paths: {e}")
        
    return paths
