// frontend/components/defend/GovernanceSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import PolicyStatusGrid from './PolicyStatusGrid';
import AuditLogTable from './AuditLogTable';
import PolicyTestPanel from './PolicyTestPanel';
import ComplianceGrid from './ComplianceGrid';
import { getGovernanceEvents, getComplianceReport, getGovernanceStats } from '@/lib/api';
import { GovernanceEvent, ComplianceReport } from '@/types';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';

interface GovernanceSectionProps {
  scanId: string;
}

export default function GovernanceSection({ scanId }: GovernanceSectionProps) {
  const [events, setEvents] = useState<GovernanceEvent[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [stats, setStats] = useState<{
    total_events: number;
    events_by_risk_level: Record<string, number>;
    blocked_count: number;
    allowed_count: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evts, comp, st] = await Promise.all([
        getGovernanceEvents(50).catch(() => []),
        getComplianceReport(scanId).catch(() => null),
        getGovernanceStats().catch(() => null)
      ]);
      setEvents(evts);
      setComplianceReport(comp);
      setStats(st);
    } catch (e) {
      console.error('Error loading governance data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [scanId]);

  const overallHealth = stats && stats.total_events > 0
    ? Math.round((stats.allowed_count / stats.total_events) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Top Compliance & Policy Health Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A34054] font-['Plus_Jakarta_Sans']">Guardrail Policy Health</span>
            <div className="text-2xl font-extrabold text-[#22c55e] mt-1 font-mono">{overallHealth}%</div>
            <span className="text-[10px] text-[#A34054]">Pass rate across 5 policies</span>
          </div>
          <div className="p-3 rounded-xl bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.30)]">
            <ShieldCheck size={28} />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A34054] font-['Plus_Jakarta_Sans']">Total Interceptions</span>
            <div className="text-2xl font-extrabold text-[#ef4444] mt-1 font-mono">{stats?.blocked_count || 0}</div>
            <span className="text-[10px] text-[#A34054]">Unsafe prompts/responses blocked</span>
          </div>
          <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.30)]">
            <ShieldAlert size={28} />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A34054] font-['Plus_Jakarta_Sans']">Framework Violations</span>
            <div className="text-2xl font-extrabold text-[#ED9E58] mt-1 font-mono">{complianceReport?.violations_count || 0}</div>
            <span className="text-[10px] text-[#A34054]">NIST/ISO/GDPR/OWASP/EU AI</span>
          </div>
          <div className="p-3 rounded-xl bg-[rgba(237,158,88,0.15)] text-[#ED9E58] border border-[rgba(237,158,88,0.30)]">
            <AlertOctagon size={28} />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A34054] font-['Plus_Jakarta_Sans']">Overall Compliance Status</span>
            <div className={`text-base font-extrabold mt-1 uppercase font-mono ${complianceReport?.overall_risk === 'COMPLIANT' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {complianceReport?.overall_risk || 'ASSESSING'}
            </div>
            <span className="text-[10px] text-[#A34054] font-mono">Scan {scanId.slice(0, 8)}...</span>
          </div>
          <div className="p-3 rounded-xl bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.30)]">
            <CheckCircle2 size={28} />
          </div>
        </div>
      </div>

      {/* Policy Status Grid */}
      <PolicyStatusGrid blockedCount={stats?.blocked_count} />

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <PolicyTestPanel />
          <AuditLogTable events={events} />
        </div>

        <div className="lg:col-span-6">
          <ComplianceGrid report={complianceReport} scanId={scanId} onRefresh={loadData} />
        </div>
      </div>
    </div>
  );
}
