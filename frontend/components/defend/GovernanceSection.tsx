// frontend/components/defend/GovernanceSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import PolicyStatusGrid from './PolicyStatusGrid';
import AuditLogTable from './AuditLogTable';
import PolicyTestPanel from './PolicyTestPanel';
import ComplianceGrid from './ComplianceGrid';
import { getGovernanceEvents, getComplianceReport, getGovernanceStats } from '@/lib/api';
import { GovernanceEvent, ComplianceReport } from '@/types';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2, AlertOctagon } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B949E]">Guardrail Policy Health</span>
            <div className="text-2xl font-extrabold text-[#00C896] mt-1">{overallHealth}%</div>
            <span className="text-[10px] text-[#8B949E]">Pass rate across 5 policies</span>
          </div>
          <div className="p-3 rounded-full bg-[#00C896]/10 text-[#00C896]">
            <ShieldCheck size={28} />
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B949E]">Total Interceptions</span>
            <div className="text-2xl font-extrabold text-[#E84040] mt-1">{stats?.blocked_count || 0}</div>
            <span className="text-[10px] text-[#8B949E]">Unsafe prompts/responses blocked</span>
          </div>
          <div className="p-3 rounded-full bg-[#E84040]/10 text-[#E84040]">
            <ShieldAlert size={28} />
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B949E]">Framework Violations</span>
            <div className="text-2xl font-extrabold text-[#F0A500] mt-1">{complianceReport?.violations_count || 0}</div>
            <span className="text-[10px] text-[#8B949E]">NIST/ISO/GDPR/OWASP/EU AI</span>
          </div>
          <div className="p-3 rounded-full bg-[#F0A500]/10 text-[#F0A500]">
            <AlertOctagon size={28} />
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B949E]">Overall Compliance Status</span>
            <div className={`text-lg font-extrabold mt-1 uppercase ${complianceReport?.overall_risk === 'COMPLIANT' ? 'text-[#00C896]' : 'text-[#E84040]'}`}>
              {complianceReport?.overall_risk || 'ASSESSING'}
            </div>
            <span className="text-[10px] text-[#8B949E]">Scan {scanId.slice(0, 8)}...</span>
          </div>
          <div className="p-3 rounded-full bg-[#00C896]/10 text-[#00C896]">
            <CheckCircle2 size={28} />
          </div>
        </div>
      </div>

      {/* Policy Status Grid */}
      <PolicyStatusGrid blockedCount={stats?.blocked_count} />

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sub-section: Policy Dry-Run Panel & Audit Log */}
        <div className="lg:col-span-6 space-y-6">
          <PolicyTestPanel />
          <AuditLogTable events={events} />
        </div>

        {/* Right Sub-section: Regulatory Compliance Grid */}
        <div className="lg:col-span-6">
          <ComplianceGrid report={complianceReport} scanId={scanId} onRefresh={loadData} />
        </div>
      </div>
    </div>
  );
}
