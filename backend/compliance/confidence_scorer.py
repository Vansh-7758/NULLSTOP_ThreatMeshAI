# backend/compliance/confidence_scorer.py
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from compliance.sbom_cross_validator import CrossValidationResult
from compliance.domain_signal_checker import DomainSignalReport


@dataclass
class AnswerConfidenceScore:
    question_id: str
    answer_given: str
    base_score: float
    cross_validation_adjustment: float
    domain_signal_contribution: float
    final_confidence_score: float
    confidence_level: str  # HIGH_CONFIDENCE, MEDIUM_CONFIDENCE, LOW_CONFIDENCE, VERY_LOW_CONFIDENCE
    confidence_label: str
    corroborating_evidence: str
    requires_manual_evidence: bool


@dataclass
class VerificationSummary:
    total_answers: int
    high_confidence_count: int
    medium_confidence_count: int
    low_confidence_count: int
    very_low_confidence_count: int
    overall_verification_score: float
    answers_requiring_evidence: List[str] = field(default_factory=list)
    contradicted_answers: List[str] = field(default_factory=list)


def compute_confidence_scores(
    assessments: List[Dict[str, Any]],
    cross_validation_results: List[CrossValidationResult],
    domain_signal_report: Optional[DomainSignalReport]
) -> List[AnswerConfidenceScore]:
    """Computes a final 0-100 confidence score for every answered question combining 3 inputs."""
    scores: List[AnswerConfidenceScore] = []

    # Map cross validation results by question_id
    xv_map: Dict[str, CrossValidationResult] = {xv.question_id: xv for xv in cross_validation_results}

    domain_score = domain_signal_report.overall_signal_score if domain_signal_report else 0.0

    for a in assessments:
        qid = a.get("question_id") or a.get("id", "")
        ans = (a.get("answer") or "no").lower()

        if ans == "not_applicable":
            continue

        # 1. Base Score calculation
        if ans == "yes":
            base_score = 100.0
        elif ans == "partial":
            base_score = 50.0
        else:
            base_score = 0.0

        # 2. Cross-Validation Adjustment
        xv_res = xv_map.get(qid)
        xv_adj = xv_res.confidence_adjustment if xv_res else 0.0
        ev_text = xv_res.evidence if xv_res else "Self-reported control answer. No technical corroboration available."

        # 3. Domain Signal Contribution
        signal_contrib = 0.0
        if domain_score > 70.0:
            if qid.startswith("IN-") or qid.startswith("PP-"):
                signal_contrib = 5.0
        elif domain_score < 40.0:
            if qid.startswith("IN-"):
                signal_contrib = -5.0

        # Compute final clamped score
        final_score = max(0.0, min(100.0, base_score + xv_adj + signal_contrib))

        # Classify confidence level and label
        if final_score >= 80.0:
            level = "HIGH_CONFIDENCE"
            label = "Machine-verified or strongly corroborated"
        elif final_score >= 60.0:
            level = "MEDIUM_CONFIDENCE"
            label = "Partially corroborated — some evidence available"
        elif final_score >= 40.0:
            level = "LOW_CONFIDENCE"
            label = "Self-reported only — evidence documentation recommended"
        else:
            level = "VERY_LOW_CONFIDENCE"
            label = "Contradicted by technical evidence — requires immediate review"

        req_evidence = level in ("LOW_CONFIDENCE", "VERY_LOW_CONFIDENCE")

        scores.append(
            AnswerConfidenceScore(
                question_id=qid,
                answer_given=ans,
                base_score=base_score,
                cross_validation_adjustment=xv_adj,
                domain_signal_contribution=signal_contrib,
                final_confidence_score=final_score,
                confidence_level=level,
                confidence_label=label,
                corroborating_evidence=ev_text,
                requires_manual_evidence=req_evidence
            )
        )

    # Sort scores by final_confidence_score ascending so most uncertain answers appear first
    scores.sort(key=lambda s: s.final_confidence_score)
    return scores


def compute_overall_verification_score(
    confidence_scores: List[AnswerConfidenceScore],
    cross_validation_results: Optional[List[CrossValidationResult]] = None
) -> VerificationSummary:
    """Computes an overall verification score and summary statistics."""
    total = len(confidence_scores)
    if total == 0:
        return VerificationSummary(
            total_answers=0,
            high_confidence_count=0,
            medium_confidence_count=0,
            low_confidence_count=0,
            very_low_confidence_count=0,
            overall_verification_score=0.0,
            answers_requiring_evidence=[],
            contradicted_answers=[]
        )

    high_c = sum(1 for s in confidence_scores if s.confidence_level == "HIGH_CONFIDENCE")
    med_c = sum(1 for s in confidence_scores if s.confidence_level == "MEDIUM_CONFIDENCE")
    low_c = sum(1 for s in confidence_scores if s.confidence_level == "LOW_CONFIDENCE")
    vlow_c = sum(1 for s in confidence_scores if s.confidence_level == "VERY_LOW_CONFIDENCE")

    weighted_sum = (high_c * 1.0) + (med_c * 0.6) + (low_c * 0.3) + (vlow_c * 0.0)
    overall_score = round((weighted_sum / total) * 100.0, 1)

    req_evidence_ids = [s.question_id for s in confidence_scores if s.requires_manual_evidence]

    contradicted_ids: List[str] = []
    if cross_validation_results:
        contradicted_ids = [xv.question_id for xv in cross_validation_results if xv.validation_status == "CONTRADICTED"]
    else:
        contradicted_ids = [s.question_id for s in confidence_scores if s.confidence_level == "VERY_LOW_CONFIDENCE"]

    return VerificationSummary(
        total_answers=total,
        high_confidence_count=high_c,
        medium_confidence_count=med_c,
        low_confidence_count=low_c,
        very_low_confidence_count=vlow_c,
        overall_verification_score=overall_score,
        answers_requiring_evidence=req_evidence_ids,
        contradicted_answers=contradicted_ids
    )
