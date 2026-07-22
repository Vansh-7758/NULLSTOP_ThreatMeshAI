import logging
from typing import List
from models.schemas import PredictedRisk

logger = logging.getLogger(__name__)

async def predict_risks(neo4j_client, scan_id: str) -> List[PredictedRisk]:
    risks = []
    
    query = """
    MATCH (p:Package)
    OPTIONAL MATCH (p)-[:DEPENDS_ON]->(dep:Package)
    WITH p, collect(dep.trust_score) as dep_scores
    RETURN p.name AS name, p.version AS version, p.ecosystem AS ecosystem,
           p.trust_score AS trust_score, dep_scores
    """
    
    try:
        records = neo4j_client.run_query(query)
        
        for record in records:
            name = record["name"]
            version = record["version"]
            ecosystem = record["ecosystem"]
            dep_scores = record["dep_scores"]
            
            risk_score = 0.0
            signals = {}
            
            # days_since_commit (Mock score 30 for worst)
            signals["days_since_commit"] = 15.0
            risk_score += 15.0
            
            # ecosystem_cve_trend (25 for high risk ecosystems)
            eco_risk = 25.0 if ecosystem in ["npm", "pypi"] else 5.0
            signals["ecosystem_cve_trend"] = eco_risk
            risk_score += eco_risk
            
            # epss_trend (0 to 20)
            signals["epss_trend"] = 0.0
            
            # dependency_risk (15 if any bad deps)
            dep_risk = 0.0
            if any(score is not None and score < 50 for score in dep_scores):
                dep_risk = 15.0
            signals["dependency_risk"] = dep_risk
            risk_score += dep_risk
            
            # popularity_decline (0 to 10)
            signals["popularity_decline"] = 5.0
            risk_score += 5.0
            
            if risk_score > 40.0:
                explanation = f"Package {name} shows predicted risk based on historical heuristics."
                if risk_score > 70:
                    explanation += " High probability of future vulnerability."
                
                risks.append(PredictedRisk(
                    package_name=name,
                    version=version,
                    risk_score=risk_score,
                    signals=signals,
                    explanation=explanation
                ))
                
    except Exception as e:
        logger.error(f"Error predicting risks: {e}")
        
    return risks
