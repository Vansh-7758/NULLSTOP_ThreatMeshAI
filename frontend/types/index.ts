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
  fixed_in_versions?: string[];
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
  compliance_mapping: Record<string, string | number | boolean | Record<string, unknown>>;
  confidence_score: number;
  evidence_citations: string[];
  created_at: string;
}

export interface PlaybookFull extends Playbook {
  threat_agent_output?: Record<string, unknown>;
  risk_agent_output?: Record<string, unknown>;
  trust_agent_output?: Record<string, unknown>;
  patch_agent_output?: Record<string, unknown>;
  compliance_agent_output?: Record<string, unknown>;
  safety_agent_output?: Record<string, unknown>;
  governance_agent_output?: Record<string, unknown>;
  contradictions_resolved?: string[];
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

// ── HUNT Module Interfaces ──

export interface CouncilState {
  scan_id: string;
  package_name: string;
  package_version: string;
  package_ecosystem: string;
  purl: string;
  trust_score: number;
  cves: CVERecord[];
  attack_path: string[];
  maintainer_days_inactive: number;
  has_public_exploit: boolean;
  threat_agent_output: string;
  risk_agent_output: string;
  trust_agent_output: string;
  patch_agent_output: string;
  compliance_agent_output: string;
  safety_agent_output: string;
  governance_agent_output: string;
  consensus_playbook: Record<string, unknown>;
  confidence_score: number;
}

export interface AgentOutput {
  agent_name: string;
  status: "pending" | "running" | "completed" | "failed";
  output: Record<string, unknown> | null;
  completed_at: string | null;
}

export interface HuntStatus {
  hunt_id: string;
  scan_id: string;
  total_packages: number;
  packages_analyzed: number;
  playbooks_generated: number;
  current_package: string;
  current_agent: string;
  status: "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
}

export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ── AI Governance & DEFEND Interfaces ──

export interface GovernancePolicyResult {
  allowed: boolean;
  policy_triggered: string | null;
  risk_level: string;
  details: Record<string, unknown>;
  action_taken: string;
}

export interface GovernanceEvent {
  id: string;
  timestamp: string;
  event_type: string;
  prompt: string | null;
  response: string | null;
  model: string | null;
  policy_result: string;
  risk_level: string;
  details: Record<string, unknown>;
}

export interface ComplianceReport {
  id?: string;
  scan_id: string;
  generated_at: string;
  overall_score: number;
  framework_scores: Record<string, number>;
  domain_scores: Record<string, number>;
  gap_count: number;
  critical_gaps: ComplianceGap[];
  remediation_roadmap?: RemediationItem[];
  report_text?: string;
  executive_summary?: string;
  nist_csf?: {
    status: string;
    identify: string;
    protect: string;
    detect: string;
    respond: string;
    recover: string;
    details: string[];
  };
  iso_27001?: {
    status: string;
    control_a8_19: string;
    details: string[];
  };
  gdpr?: {
    status: string;
    article_32: string;
    details: string[];
  };
  owasp?: {
    status: string;
    control_a06: string;
    details: string[];
  };
  eu_ai_act?: {
    status: string;
    article_15: string;
    details: string[];
  };
  overall_risk?: string;
  packages_assessed?: number;
  violations_count?: number;
}

export interface RedTeamTestResult {
  id: string;
  scan_id: string;
  test_type: RedTeamTestType;
  status: RedTeamStatus;
  score: number;
  details: string;
  evidence: string[];
  created_at: string;
}

export interface RedTeamReport {
  scan_id: string;
  overall_safety_score: number;
  total_tests: number;
  tests_passed: number;
  tests_failed: number;
  test_results: RedTeamTestResult[];
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

// ── Full-Spectrum Compliance Engine Interfaces ──

export interface CompanyProfile {
  id: string;
  scan_id: string;
  industry: string;
  company_size: string;
  regions: string[];
  data_types: string[];
  existing_certifications: string[];
  created_at: string;
}

export interface ComplianceQuestion {
  id: string;
  text: string;
  domain: string;
  frameworks: string[];
  nist_function?: string;
  iso_control?: string;
  gdpr_article?: string;
  weight: number;
  risk_if_no: "Critical" | "High" | "Medium" | "Low";
}

export interface ComplianceAnswer {
  question_id: string;
  answer: "yes" | "no" | "partial" | "not_applicable";
  notes?: string;
}

export interface ComplianceSession {
  id: string;
  scan_id: string;
  status: "not_started" | "in_progress" | "completed";
  current_domain: string;
  completed_domains: string[];
  total_questions: number;
  answered_questions: number;
}

export interface ComplianceDomainScore {
  domain: string;
  score: number;
  question_count: number;
  answered_count: number;
  gap_count: number;
}

export interface ComplianceGap {
  question_id: string;
  question_text: string;
  domain: string;
  frameworks: string[];
  risk_if_no: "Critical" | "High" | "Medium" | "Low";
  recommended_action: string;
  priority?: number;
  answer?: string;
}

export interface RemediationItem {
  priority: number;
  action: string;
  effort: "Low" | "Medium" | "High";
  impact: string;
  timeline: string;
  owner: "Security" | "DevOps" | "Legal" | "HR" | "IT";
  frameworks?: string[];
}

// ── Tenant (Multi-Tenant DEFEND) ──

export interface Tenant {
  id: string;
  name: string;
  scan_id?: string;
  packages_count?: number;
  cyber_health_score: number;
  status?: string;
  shared_packages?: string[];
  critical_packages_count?: number;
}

export interface PropagationEvent {
  event_type: string;
  package_name: string;
  new_trust_score: number;
  triggered_by?: string;
  banner_message?: string;
  affected_tenants: Array<{
    tenant_id: string;
    tenant_name: string;
    old_score: number;
    new_score: number;
    stagger_ms?: number;
    shared_packages?: string[];
  }>;
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

// ── Three-Layer Compliance Verification Engine Interfaces ──

export interface CrossValidationResult {
  question_id: string;
  answer_given: string;
  validation_status: "CORROBORATED" | "CONTRADICTED" | "UNVERIFIABLE";
  confidence_adjustment: number;
  evidence: string;
  technical_detail: string;
}

export interface DomainSignalCheck {
  check_name: string;
  status: "PASS" | "FAIL" | "PARTIAL" | "UNKNOWN";
  description: string;
  detail: string;
}

export interface DomainSignalReport {
  domain: string;
  checked_at: string;
  overall_signal_score: number;
  checks: DomainSignalCheck[];
}

export interface AnswerConfidenceScore {
  question_id: string;
  answer_given: string;
  base_score: number;
  cross_validation_adjustment: number;
  domain_signal_contribution: number;
  final_confidence_score: number;
  confidence_level: "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE" | "VERY_LOW_CONFIDENCE";
  confidence_label: string;
  corroborating_evidence: string;
  requires_manual_evidence: boolean;
}

export interface VerificationSummary {
  total_answers: number;
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
  very_low_confidence_count: number;
  overall_verification_score: number;
  answers_requiring_evidence: string[];
  contradicted_answers: string[];
}

export interface VerificationResults {
  scan_id?: string;
  status?: string;
  cross_validations: CrossValidationResult[];
  domain_signal_report: DomainSignalReport | null;
  confidence_scores: AnswerConfidenceScore[];
  confidence_scores_grouped?: Record<string, AnswerConfidenceScore[]>;
  verification_summary: VerificationSummary;
}

// ── AI Red Team as a Service Interfaces ──

export interface AIProductConfig {
  ai_product_endpoint?: string;
  ai_product_type?: string;
  auth_header_name?: string;
  auth_scheme?: string;
  api_key_plain?: string;
  api_key_configured?: boolean;
  response_field_path?: string;
  testing_consent?: boolean;
  consent_timestamp?: string;
}

export interface RedTeamRunStatus {
  scan_id: string;
  run_id?: string;
  status: "pending" | "running" | "completed" | "failed";
  target_mode: "external" | "internal_demo";
  completed_tests: number;
  total_tests: number;
  overall_score: number;
}

export interface RedTeamTestResultDetail {
  id: string;
  run_id: string;
  scan_id: string;
  attack_vector: string;
  prompt: string;
  response: string;
  verdict: "pass" | "fail";
  score: number;
  reasoning: string;
  remediation?: string;
}

export interface ComplianceMappingSpecDetail {
  eu_ai_act_article: string;
  eu_ai_act_description: string;
  iso_42001_clause: string;
  iso_42001_description: string;
  nist_ai_rmf: string;
}

export interface RedTeamServiceReport {
  scan_id: string;
  overall_safety_score: number;
  target_mode: "external" | "internal_demo";
  target_endpoint: string;
  total_test_results: number;
  vector_scores: Record<string, number>;
  vector_details: Record<string, RedTeamTestResultDetail[]>;
  compliance_mappings: Record<string, ComplianceMappingSpecDetail>;
}

export interface RedTeamRunHistoryItem {
  id: string;
  scan_id: string;
  target_mode: "external" | "internal_demo";
  target_endpoint: string;
  total_tests: number;
  completed_tests: number;
  status: string;
  overall_score: number;
  vector_scores: Record<string, number>;
  started_at: string;
  completed_at?: string;
}
