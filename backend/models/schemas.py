# backend/models/schemas.py
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

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
    published_date: datetime = Field(default_factory=datetime.utcnow)
    affected_versions: list[str] = Field(default_factory=list)


class TrustScoreBreakdown(BaseModel):
    cve_impact: float = 100.0
    epss_risk: float = 100.0
    exploit_risk: float = 100.0
    maintainer_health: float = 100.0
    release_cadence: float = 100.0


class TrustScore(BaseModel):
    package_name: str
    version: str
    score: float
    node_type: NodeType = NodeType.PACKAGE
    breakdown: TrustScoreBreakdown = Field(default_factory=TrustScoreBreakdown)
    computed_at: datetime = Field(default_factory=datetime.utcnow)


class AttackPath(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str
    source_package: str
    target_package: str
    path: list[str]
    path_length: int
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


# ── AI Governance Models ──

class GovernanceEvent(BaseModel):
    id: str = Field(default_factory=_id)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str = "prompt_check"
    prompt: Optional[str] = None
    response: Optional[str] = None
    model: Optional[str] = None
    policy_result: PolicyResult = PolicyResult.ALLOWED
    risk_level: RiskLevel = RiskLevel.LOW
    details: dict = Field(default_factory=dict)


class RedTeamResult(BaseModel):
    id: str = Field(default_factory=_id)
    scan_id: str = ""
    test_type: RedTeamTestType = RedTeamTestType.PROMPT_INJECTION
    status: RedTeamStatus = RedTeamStatus.PASSED
    score: float = 100.0
    details: str = ""
    evidence: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AIHealthMetrics(BaseModel):
    hallucination_rate: float = 0.0
    unsafe_prompts_blocked: int = 0
    total_prompts: int = 0
    policy_violations: int = 0
    ai_attack_attempts: int = 0
    compliance_score: float = 100.0
    safety_score: float = 100.0
    jailbreak_resistance: float = 100.0
    bias_score: float = 100.0


class AIAsset(BaseModel):
    id: str = Field(default_factory=_id)
    name: str
    asset_type: NodeType = NodeType.AI_MODEL
    version: str = ""
    provider: str = ""
    trust_score: float = 100.0
    metadata: dict = Field(default_factory=dict)


# ── API Response / Request Models ──

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
    risk_level: RiskLevel = RiskLevel.LOW
    explanation: str = ""
    event_id: str = ""
