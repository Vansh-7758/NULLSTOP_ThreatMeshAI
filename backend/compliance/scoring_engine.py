# backend/compliance/scoring_engine.py
"""Compliance Scoring Engine with questionnaire aggregation and SBOM technical penalty."""
import json
import logging
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from compliance.question_bank import QUESTION_BANK

logger = logging.getLogger(__name__)

@dataclass
class ComplianceScoreResult:
    overall_score: float
    domain_scores: Dict[str, float]
    framework_scores: Dict[str, float]
    critical_gaps: List[Dict[str, Any]]
    gap_count: int
    domain_counts: Dict[str, Dict[str, int]] = field(default_factory=dict)

# In-memory store for answers fallback
_in_memory_answers: Dict[str, Dict[str, Dict[str, Any]]] = {}

async def save_answers(scan_id: str, answers: List[Dict[str, Any]], postgres_client: Any = None):
    """Upserts compliance assessment rows into PostgreSQL / in-memory store."""
    if scan_id not in _in_memory_answers:
        _in_memory_answers[scan_id] = {}
        
    for item in answers:
        q_id = item.get("question_id")
        ans = item.get("answer", "no")
        notes = item.get("notes", "")
        
        # Determine domain from question bank
        domain = "software"
        q_text = ""
        for d_name, q_list in QUESTION_BANK.items():
            for q in q_list:
                if q["id"] == q_id:
                    domain = d_name
                    q_text = q["text"]
                    break
                    
        ans_dict = {
            "scan_id": scan_id,
            "question_id": q_id,
            "question_text": q_text,
            "domain": domain,
            "answer": ans,
            "notes": notes
        }
        _in_memory_answers[scan_id][q_id] = ans_dict

    if postgres_client and getattr(postgres_client, "pool", None):
        try:
            for item in answers:
                q_id = item.get("question_id")
                ans = item.get("answer", "no")
                notes = item.get("notes", "")
                
                domain = "software"
                q_text = ""
                for d_name, q_list in QUESTION_BANK.items():
                    for q in q_list:
                        if q["id"] == q_id:
                            domain = d_name
                            q_text = q["text"]
                            break
                            
                query = """
                INSERT INTO compliance_assessments (id, scan_id, domain, question_id, question_text, answer, notes, answered_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                ON CONFLICT (id) DO UPDATE SET answer = EXCLUDED.answer, notes = EXCLUDED.notes, answered_at = NOW()
                """
                row_id = f"{scan_id}_{q_id}"
                await postgres_client._execute_with_retry(query, row_id, scan_id, domain, q_id, q_text, ans, notes)
        except Exception as e:
            logger.warning(f"Fallback to in-memory answers save: {e}")

async def get_assessments_by_scan(scan_id: str, postgres_client: Any = None) -> Dict[str, Dict[str, Any]]:
    """Fetches all compliance assessment rows for a scan_id."""
    if postgres_client and getattr(postgres_client, "pool", None):
        try:
            query = "SELECT * FROM compliance_assessments WHERE scan_id = $1"
            records = await postgres_client._execute_with_retry(query, scan_id)
            if records:
                res = {}
                for r in records:
                    row = dict(r)
                    res[row["question_id"]] = row
                return res
        except Exception as e:
            logger.warning(f"Fallback to in-memory assessment read: {e}")
            
    return _in_memory_answers.get(scan_id, {})

async def compute_compliance_scores(
    scan_id: str,
    profile_id: str = "",
    postgres_client: Any = None,
    neo4j_client: Any = None
) -> ComplianceScoreResult:
    """Computes weighted domain scores, framework scores, SBOM technical penalties, and critical gaps."""
    assessments = await get_assessments_by_scan(scan_id, postgres_client)
    
    # 1. Compute Domain Scores
    domain_weights = {"software": 0.25, "infrastructure": 0.20, "people": 0.20, "processes": 0.20, "data": 0.15}
    domain_scores: Dict[str, float] = {}
    domain_counts: Dict[str, Dict[str, int]] = {}
    
    all_questions_by_id = {}
    for d_name, q_list in QUESTION_BANK.items():
        total_q = len(q_list)
        answered_q = 0
        earned_weight = 0.0
        possible_weight = 0.0
        
        for q in q_list:
            all_questions_by_id[q["id"]] = q
            ans_row = assessments.get(q["id"])
            if ans_row:
                answered_q += 1
                ans = ans_row.get("answer", "").lower()
                w = q.get("weight", 0.1)
                
                if ans == "yes":
                    earned_weight += w
                    possible_weight += w
                elif ans == "partial":
                    earned_weight += 0.5 * w
                    possible_weight += w
                elif ans == "no":
                    earned_weight += 0.0
                    possible_weight += w
                elif ans == "not_applicable":
                    # Excluded from denominator
                    pass
            else:
                possible_weight += q.get("weight", 0.1)
                
        domain_counts[d_name] = {"total": total_q, "answered": answered_q}
        if possible_weight > 0:
            score = (earned_weight / possible_weight) * 100.0
        else:
            score = 100.0
        domain_scores[d_name] = score

    # 2. Compute Framework Scores
    frameworks = ["nist_csf", "iso_27001", "gdpr", "eu_ai_act", "owasp"]
    framework_earned: Dict[str, float] = {fw: 0.0 for fw in frameworks}
    framework_possible: Dict[str, float] = {fw: 0.0 for fw in frameworks}
    
    for q_id, q in all_questions_by_id.items():
        ans_row = assessments.get(q_id)
        w = q.get("weight", 0.1)
        ans = ans_row.get("answer", "").lower() if ans_row else "unanswered"
        
        for fw in q.get("frameworks", []):
            if fw in framework_possible:
                if ans == "yes":
                    framework_earned[fw] += w
                    framework_possible[fw] += w
                elif ans == "partial":
                    framework_earned[fw] += 0.5 * w
                    framework_possible[fw] += w
                elif ans == "no" or ans == "unanswered":
                    framework_earned[fw] += 0.0
                    framework_possible[fw] += w
                elif ans == "not_applicable":
                    pass

    framework_scores: Dict[str, float] = {}
    for fw in frameworks:
        if framework_possible[fw] > 0:
            framework_scores[fw] = round((framework_earned[fw] / framework_possible[fw]) * 100.0, 1)
        else:
            framework_scores[fw] = 100.0

    # 3. Combine SBOM Technical Findings from Neo4j / Postgres
    at_risk_pkg_count = 0
    critical_cve_count = 0
    
    if neo4j_client and hasattr(neo4j_client, "run_query"):
        try:
            pkg_records = neo4j_client.run_query(
                "MATCH (p:Package) WHERE p.trust_score < 50 RETURN count(p) AS count"
            )
            if pkg_records:
                at_risk_pkg_count = pkg_records[0].get("count", 0)
                
            cve_records = neo4j_client.run_query(
                "MATCH (c:CVE) WHERE toUpper(c.severity) = 'CRITICAL' OR c.cvss_score >= 9.0 RETURN count(c) AS count"
            )
            if cve_records:
                critical_cve_count = cve_records[0].get("count", 0)
        except Exception as e:
            logger.warning(f"Neo4j technical penalty query failed: {e}")
    elif postgres_client:
        try:
            pkgs = await postgres_client.get_scan_packages(scan_id)
            at_risk_pkg_count = sum(1 for p in pkgs if (p.get("trust_score") or 100.0) < 50.0)
            cves = await postgres_client.get_scan_cves(scan_id)
            critical_cve_count = sum(1 for c in cves if "CRITICAL" in str(c.get("severity", "")).upper() or float(c.get("cvss_score", 0.0)) >= 9.0)
        except Exception as e:
            logger.warning(f"Postgres technical penalty query failed: {e}")

    pkg_penalty = min(20.0, at_risk_pkg_count * 2.0)
    cve_penalty = min(15.0, critical_cve_count * 3.0)
    total_tech_penalty = pkg_penalty + cve_penalty
    
    raw_sw_score = domain_scores.get("software", 100.0)
    clamped_sw_score = max(0.0, min(100.0, raw_sw_score - total_tech_penalty))
    domain_scores["software"] = round(clamped_sw_score, 1)

    # 4. Recompute Overall Score
    overall_score = sum(domain_scores[d] * domain_weights[d] for d in domain_weights)
    overall_score = round(max(0.0, min(100.0, overall_score)), 1)

    # 5. Identify Critical Gaps
    critical_gaps: List[Dict[str, Any]] = []
    
    for q_id, q in all_questions_by_id.items():
        ans_row = assessments.get(q_id)
        ans = ans_row.get("answer", "").lower() if ans_row else "no"
        risk_if_no = q.get("risk_if_no", "Medium")
        
        if ans in ["no", "partial"] and risk_if_no in ["Critical", "High"]:
            rec_action = f"Implement controls for {q['id']}: {q['text']}"
            if q["domain"] == "software":
                rec_action = f"Integrate security scanning & patch controls for {q['id']}."
            elif q["domain"] == "infrastructure":
                rec_action = f"Enforce cloud security baseline and encryption controls for {q['id']}."
            elif q["domain"] == "people":
                rec_action = f"Enforce access controls and security training for {q['id']}."
            elif q["domain"] == "processes":
                rec_action = f"Formalize and test policy procedures for {q['id']}."
            elif q["domain"] == "data":
                rec_action = f"Enforce data privacy, encryption, and audit logging for {q['id']}."
                
            gap_item = {
                "question_id": q["id"],
                "question_text": q["text"],
                "domain": q["domain"],
                "frameworks": q.get("frameworks", []),
                "risk_if_no": risk_if_no,
                "answer": ans,
                "recommended_action": rec_action,
                "framework_count": len(q.get("frameworks", []))
            }
            critical_gaps.append(gap_item)

    # Sort gaps by risk rating then framework count
    risk_rank = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    critical_gaps.sort(key=lambda x: (risk_rank.get(x["risk_if_no"], 99), -x["framework_count"]))

    return ComplianceScoreResult(
        overall_score=overall_score,
        domain_scores={d: round(s, 1) for d, s in domain_scores.items()},
        framework_scores=framework_scores,
        critical_gaps=critical_gaps,
        gap_count=len(critical_gaps),
        domain_counts=domain_counts
    )
