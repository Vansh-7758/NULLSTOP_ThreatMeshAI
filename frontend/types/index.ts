// frontend/types/index.ts

// ── Enums ──

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type NodeType =
  | "package"
  | "ai_model"
  | "prompt"
  | "dataset"
  | "api_endpoint"
  | "vector_db"
  | "agent_tool"
  | "developer"
  | "rag_document";

export type ScanStatusEnum = "pending" | "running" | "completed" | "failed";

export type PolicyResult = "allowed" | "blocked" | "flagged";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RedTeamTestType =
  | "prompt_injection"
  | "jailbreak"
  | "hallucination"
  | "bias"
  | "toxicity"
  | "data_leakage"
  | "agent_hijacking"
  | "rag_poisoning";

export type RedTeamStatus = "passed" | "failed" | "warning";

// ── Core Domain ──

export interface Package {
  id: string;
  name: string;
  version: string;
  ecosystem: string;
  purl: string | null;
  node_type: NodeType;
  trust_score: number;
  first_seen: string;
  dependencies: string[];
}

export interface CVERecord {
  cve_id: string;
  description: string;
  severity: Severity;
  cvss_score: number;
  epss_score: number;
  exploit_available: boolean;
  published_date: string;
  affected_versions: string[];
}

export interface TrustScoreBreakdown {
  cve_impact: number;
  epss_risk: number;
  exploit_risk: number;
  maintainer_health: number;
  release_cadence: number;
}

export interface TrustScore {
  package_name: string;
  version: string;
  score: number;
  node_type: NodeType;
  breakdown: TrustScoreBreakdown;
  computed_at: string;
}

export interface AttackPath {
  id: string;
  scan_id: string;
  source_package: string;
  target_package: string;
  path: string[];
  path_length: number;
  attack_type: string;
}

export interface Playbook {
  id: string;
  scan_id: string;
  package_name: string;
  threat_summary: string;
  business_impact: string;
  trust_explanation: string;
  recommended_action: string;
  compliance_mapping: Record<string, string>;
  confidence_score: number;
  evidence_citations: string[];
  created_at: string;
}

export interface PredictedRisk {
  package_name: string;
  version: string;
  risk_score: number;
  signals: Record<string, number | string | boolean>;
  explanation: string;
}

export interface ScanStatus {
  scan_id: string;
  status: ScanStatusEnum;
  progress: number;
  current_stage: string;
  sbom_filename: string;
  total_packages: number;
  at_risk_count: number;
  cve_count: number;
  created_at: string;
  updated_at: string;
}

// ── AI Governance ──

export interface GovernanceEvent {
  id: string;
  timestamp: string;
  event_type: string;
  prompt: string | null;
  response: string | null;
  model: string | null;
  policy_result: PolicyResult;
  risk_level: RiskLevel;
  details: Record<string, string | number | boolean>;
}

export interface RedTeamResult {
  id: string;
  scan_id: string;
  test_type: RedTeamTestType;
  status: RedTeamStatus;
  score: number;
  details: string;
  evidence: string[];
  created_at: string;
}

export interface AIHealthMetrics {
  hallucination_rate: number;
  unsafe_prompts_blocked: number;
  total_prompts: number;
  policy_violations: number;
  ai_attack_attempts: number;
  compliance_score: number;
  safety_score: number;
  jailbreak_resistance: number;
  bias_score: number;
}

export interface AIAsset {
  id: string;
  name: string;
  asset_type: NodeType;
  version: string;
  provider: string;
  trust_score: number;
  metadata: Record<string, string | number | boolean>;
}

// ── API Responses ──

export interface ScanResponse {
  scan_id: string;
  status: string;
  message: string;
}

export interface ErrorResponse {
  status_code: number;
  error_type: string;
  message: string;
}

export interface HealthStatus {
  status: string;
  services: Record<string, string>;
}

export interface PRResponse {
  pr_url: string;
  pr_title: string;
  branch_name: string;
  package_name: string;
  old_version: string;
  new_version: string;
}

export interface TrustUpdateEvent {
  event_type: string;
  package_name: string;
  version: string;
  old_score: number;
  new_score: number;
  node_type: string;
  timestamp: string;
}

export interface LiveFeedEvent {
  event_type: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
  data: Record<string, string | number | boolean>;
}

// ── Dashboard ──

export interface DashboardData {
  cyber_health_score: number;
  total_packages: number;
  at_risk_count: number;
  active_cves: number;
  open_prs: number;
  trust_distribution: TrustDistribution;
  critical_packages: Package[];
  recent_events: LiveFeedEvent[];
  playbooks: Playbook[];
  ai_health: AIHealthMetrics;
  predictions: PredictedRisk[];
}

export interface TrustDistribution {
  trusted: number;
  watch: number;
  at_risk: number;
}

// ── Tenant (Demo) ──

export interface Tenant {
  id: string;
  name: string;
  type: string;
  packages: Package[];
  cyber_health_score: number;
  trust_distribution: TrustDistribution;
}

// ── Graph Visualization ──

export interface GraphNode {
  id: string;
  data: {
    label: string;
    package: Package;
    cves: CVERecord[];
    trustScore: TrustScore | null;
    playbook: Playbook | null;
    dependentCount: number;
  };
  position: { x: number; y: number };
  type: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  style: Record<string, string>;
}

// ── Timeline ──

export interface TimelineStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  status: "pending" | "active" | "completed";
}
