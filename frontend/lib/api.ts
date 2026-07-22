import {
  Package,
  ScanStatus,
  AttackPath,
  Playbook,
  PredictedRisk,
  HealthStatus,
  GovernanceEvent,
  AIHealthMetrics,
  RedTeamResult,
  PRResponse
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
}

export const uploadSBOM = async (file: File): Promise<{ scan_id: string; status: string; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload-sbom`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${res.status}`);
  }
  return res.json();
};

export const triggerScan = (scanId: string) => fetchAPI<{ message: string; scan_id: string }>(`/api/scan/${scanId}`, { method: 'POST' });
export const getScanStatus = (scanId: string) => fetchAPI<ScanStatus>(`/api/scan/${scanId}/status`);
export const getPackages = (scanId: string) => fetchAPI<Package[]>(`/api/scan/${scanId}/packages`);
export const getAttackPaths = (scanId: string) => fetchAPI<AttackPath[]>(`/api/scan/${scanId}/attack-paths`);
export const getPlaybooks = (scanId: string) => fetchAPI<Playbook[]>(`/api/scan/${scanId}/playbooks`);
export const getPredictions = (scanId: string) => fetchAPI<PredictedRisk[]>(`/api/scan/${scanId}/predictions`);
export const generatePR = (scanId: string, packageName: string) => fetchAPI<PRResponse>(`/api/scan/${scanId}/generate-pr/${packageName}`, { method: 'POST' });
export const getHealth = () => fetchAPI<HealthStatus>('/api/health');
export const checkPrompt = (prompt: string, model: string) => fetchAPI<GovernanceEvent>('/api/governance/check-prompt', { method: 'POST', body: JSON.stringify({ prompt, model }) });
export const getAuditLog = () => fetchAPI<GovernanceEvent[]>('/api/governance/audit-log');
export const getGovernanceMetrics = () => fetchAPI<AIHealthMetrics>('/api/governance/metrics');
export const runRedTeam = (scanId: string) => fetchAPI<{ message: string; scan_id: string }>(`/api/red-team/run/${scanId}`, { method: 'POST' });
export const getRedTeamResults = (scanId: string) => fetchAPI<RedTeamResult[]>(`/api/red-team/results/${scanId}`);
