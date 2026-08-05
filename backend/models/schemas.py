# backend/models/schemas.py
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field


# ── Helpers ──

def _id() -> str:
    return str(uuid.uuid4())


# ── Enums ──

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NONE = "NONE"


class NodeType(str, Enum):
    PACKAGE = "package"
    AI_MODEL = "ai_model"
    PROMPT = "prompt"
    DATASET = "dataset"
    API_ENDPOINT = "api_endpoint"
    VECTOR_DB = "vector_db"
    AGENT_TOOL = "agent_tool"
    DEVELOPER = "developer"
    RAG_DOCUMENT = "rag_document"


class ScanStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class PolicyResult(str, Enum):
    ALLOWED = "allowed"
    BLOCKED = "blocked"
    FLAGGED = "flagged"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RedTeamTestType(str, Enum):
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAK = "jailbreak"
    HALLUCINATION = "hallucination"
    BIAS = "bias"
    TOXICITY = "toxicity"
    DATA_LEAKAGE = "data_leakage"
    AGENT_HIJACKING = "agent_hijacking"
    RAG_POISONING = "rag_poisoning"


class RedTeamStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"


# ── Core Domain Models ──

class PackageBase(BaseModel):
    name: str
    version: str
    ecosystem: str = "unknown"
    purl: Optional[str] = None
    node_type: NodeType = NodeType.PACKAGE


class Package(PackageBase):
    id: str = Field(default_factory=_id)
    trust_score: float = 100.0
    first_seen: datetime = Field(default_factory=datetime.utcnow)
    dependencies: list[str] = Field(default_factory=list)


class CVERecord(BaseModel):
    cve_id: str
    description: str = ""
    severity: Severity = Severity.NONE
    cvss_score: float = 0.0
    epss_score: float = 0.0
    exploit_available: bool = False
    published_date: Optional[datetime] = None
    affected_versions: list[str] = Field(default_factory=list)
    fixed_in_versions: list[str] = Field(default_factory=list)


class TrustScoreBreakdown(BaseModel):
    cve_impact: float = 0.0
    epss_risk: float = 0.0
    exploit_risk: float = 0.0
    maintainer_health: float = 0.0
    release_cadence: float = 0.0


class TrustScore(BaseModel):
    package_name: str
    version: str
    score: float = 100.0
    node_type: NodeType = NodeType.PACKAGE
    breakdown: TrustScoreBreakdown = Field(default_factory=TrustScoreBreakdown)
    computed_at: datetime = Field(default_factory=datetime.utcnow)


class AttackPath(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    source_package: str
    target_package: str
    path: list[str] = Field(default_factory=list)
    path_length: int = 0
    attack_type: str = "software"


class Playbook(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    package_name: str
    threat_summary: str = ""
    business_impact: str = ""
    trust_explanation: str = ""
    recommended_action: str = ""
    compliance_mapping: dict = Field(default_factory=dict)
    confidence_score: float = 0.0
    evidence_citations: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PredictedRisk(BaseModel):
    package_name: str
    version: str
    risk_score: float = 0.0
    signals: dict = Field(default_factory=dict)
    explanation: str = ""


class ScanStatus(BaseModel):
    scan_id: str
    status: ScanStatusEnum = ScanStatusEnum.PENDING
    progress: float = 0.0
    current_stage: str = ""
    sbom_filename: str = ""
    total_packages: int = 0
    at_risk_count: int = 0
    cve_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class HuntSession(BaseModel):
    hunt_id: str = Field(default_factory=_id)
    scan_id: str
    total_packages: int = 0
    packages_analyzed: int = 0
    playbooks_generated: int = 0
    current_package: str = ""
    current_agent: str = ""
    status: str = "running"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class PlaybookFull(Playbook):
    threat_agent_output: Optional[dict] = None
    risk_agent_output: Optional[dict] = None
    trust_agent_output: Optional[dict] = None
    patch_agent_output: Optional[dict] = None
    compliance_agent_output: Optional[dict] = None
    safety_agent_output: Optional[dict] = None
    governance_agent_output: Optional[dict] = None


class CopilotRequest(BaseModel):
    question: str
    scan_id: str


class CopilotResponse(BaseModel):
    answer: str
    scan_id: str
    sources: list[str] = Field(default_factory=list)


# ── AI Governance & DEFEND Models ──

class GovernanceEvent(BaseModel):
    id: str = Field(default_factory=_id)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str = "internal_ai_check"
    prompt: Optional[str] = None
    response: Optional[str] = None
    model: Optional[str] = "claude-sonnet-4-6"
    policy_result: str = "ALLOWED"
    risk_level: str = "SAFE"
    details: dict = Field(default_factory=dict)


class RedTeamResult(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    test_type: str = "prompt_injection"
    status: str = "passed"
    score: float = 100.0
    details: str = ""
    evidence: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GovernanceTestRequest(BaseModel):
    prompt: str
    response: Optional[str] = ""


class TenantRegistrationRequest(BaseModel):
    tenant_name: str
    scan_id: str
    tenant_id: Optional[str] = None


class AttackSimulationRequest(BaseModel):
    package_name: str = "log4j-core"
    new_trust_score: float = 10.0
    triggered_by_tenant_id: Optional[str] = None


# ── Full-Spectrum Compliance Models ──

class CompanyProfile(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    industry: str
    company_size: str
    regions: list[str] = Field(default_factory=list)
    data_types: list[str] = Field(default_factory=list)
    existing_certifications: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ComplianceAssessment(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    company_profile_id: str = ""
    domain: str
    question_id: str
    question_text: str = ""
    answer: str = "no"
    notes: Optional[str] = ""
    answered_at: datetime = Field(default_factory=datetime.utcnow)


class ComplianceSession(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    status: str = "not_started"
    current_domain: str = "software"
    completed_domains: list[str] = Field(default_factory=list)
    total_questions: int = 42
    answered_questions: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ComplianceReportSchema(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    company_profile_id: str = ""
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    overall_score: float = 0.0
    framework_scores: dict = Field(default_factory=dict)
    domain_scores: dict = Field(default_factory=dict)
    gap_count: int = 0
    critical_gaps: list[dict] = Field(default_factory=list)
    remediation_roadmap: list[dict] = Field(default_factory=list)
    executive_summary: str = ""
    report_text: str = ""


# ── API Request/Response Wrappers ──

class ScanResponse(BaseModel):
    scan_id: str
    status: str = "created"
    message: str = ""


class ErrorResponse(BaseModel):
    status_code: int
    error_type: str
    message: str


class HealthStatus(BaseModel):
    status: str = "healthy"
    services: dict = Field(default_factory=dict)


class PRResponse(BaseModel):
    pr_url: str
    pr_title: str
    branch_name: str
    package_name: str
    old_version: str
    new_version: str


class TrustUpdateEvent(BaseModel):
    event_type: str = "trust_update"
    package_name: str = ""
    version: str = ""
    old_score: float = 0.0
    new_score: float = 0.0
    node_type: str = "package"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LiveFeedEvent(BaseModel):
    event_type: str = "info"
    title: str = ""
    description: str = ""
    severity: str = "info"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: dict = Field(default_factory=dict)


class PromptCheckRequest(BaseModel):
    prompt: str
    model: str = "claude-sonnet-4-6"
    context: dict = Field(default_factory=dict)


class PromptCheckResponse(BaseModel):
    allowed: bool = True
    risk_level: str = "low"
    explanation: str = ""
    event_id: str = ""


# ── Verification Layer Models ──

class CrossValidationResultModel(BaseModel):
    question_id: str
    answer_given: str
    validation_status: str = "UNVERIFIABLE"
    confidence_adjustment: float = 0.0
    evidence: str = ""
    technical_detail: str = ""


class DomainSignalCheckModel(BaseModel):
    check_name: str
    status: str = "UNKNOWN"
    description: str = ""
    detail: str = ""


class DomainSignalReportModel(BaseModel):
    domain: str
    checked_at: str = ""
    overall_signal_score: float = 0.0
    checks: list[DomainSignalCheckModel] = Field(default_factory=list)


class AnswerConfidenceScoreModel(BaseModel):
    question_id: str
    answer_given: str
    base_score: float = 0.0
    cross_validation_adjustment: float = 0.0
    domain_signal_contribution: float = 0.0
    final_confidence_score: float = 0.0
    confidence_level: str = "LOW_CONFIDENCE"
    confidence_label: str = ""
    corroborating_evidence: str = ""
    requires_manual_evidence: bool = False


class VerificationSummaryModel(BaseModel):
    total_answers: int = 0
    high_confidence_count: int = 0
    medium_confidence_count: int = 0
    low_confidence_count: int = 0
    very_low_confidence_count: int = 0
    overall_verification_score: float = 0.0
    answers_requiring_evidence: list[str] = Field(default_factory=list)
    contradicted_answers: list[str] = Field(default_factory=list)

