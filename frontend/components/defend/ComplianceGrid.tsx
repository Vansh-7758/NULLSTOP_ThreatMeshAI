// frontend/components/defend/ComplianceGrid.tsx
'use client';

import React from 'react';
import { ComplianceReport } from '@/types';
import { ShieldCheck, ShieldAlert, FileText, Download, RotateCw } from 'lucide-react';
import { downloadComplianceReport } from '@/lib/api';

interface ComplianceGridProps {
  report: ComplianceReport | null;
  scanId: string;
  onRefresh?: () => void;
}

export default function ComplianceGrid({ report, scanId, onRefresh }: ComplianceGridProps) {
  const FRAMEWORKS = [
    {
      key: 'nist_csf',
      title: 'NIST CSF 2.0',
      desc: 'Cybersecurity Framework (Identify, Protect, Detect, Respond)',
      data: report?.nist_csf
    },
    {
      key: 'iso_27001',
      title: 'ISO 27001:2022',
      desc: 'Control A.8.19: Secure Coding & Supplier Relationship Controls',
      data: report?.iso_27001
    },
    {
      key: 'gdpr',
      title: 'GDPR Article 32',
      desc: 'Security of Processing for Personal & Identity Data Components',
      data: report?.gdpr
    },
    {
      key: 'owasp',
      title: 'OWASP Top 10:2021',
      desc: 'A06: Vulnerable and Outdated Dependency Component Controls',
      data: report?.owasp
    },
    {
      key: 'eu_ai_act',
      title: 'EU AI Act Article 15',
      desc: 'High-Risk AI System Accuracy, Robustness & Cybersecurity Requirements',
      data: report?.eu_ai_act
    }
  ];

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="text-[#8B949E] bg-[#8B949E]/10 border border-[#8B949E]/30 px-2 py-0.5 rounded text-[10px] font-bold">NOT ASSESSED</span>;
    if (status.toUpperCase() === 'COMPLIANT' || status.toUpperCase() === 'PASS') {
      return <span className="text-[#00C896] bg-[#00C896]/10 border border-[#00C896]/30 px-2 py-0.5 rounded text-[10px] font-bold">COMPLIANT</span>;
    }
    return <span className="text-[#E84040] bg-[#E84040]/10 border border-[#E84040]/30 px-2 py-0.5 rounded text-[10px] font-bold">VIOLATION</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header Strip */}
      <div className="flex items-center justify-between bg-[#161B22] border border-[#30363D] rounded-xl p-4">
        <div>
          <h3 className="text-sm font-bold text-[#E6EDF3] flex items-center gap-2">
            <FileText size={16} className="text-[#00C896]" /> Regulatory Compliance Evaluation
          </h3>
          <p className="text-xs text-[#8B949E]">
            Automated verification against 5 mandatory security and AI regulatory frameworks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs font-semibold rounded-lg border border-[#30363D] transition-colors flex items-center gap-1.5"
            >
              <RotateCw size={13} /> Refresh
            </button>
          )}

          <button
            onClick={() => downloadComplianceReport(scanId)}
            className="px-4 py-1.5 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] text-xs font-extrabold rounded-lg shadow transition-colors flex items-center gap-1.5"
          >
            <Download size={14} /> Download Report
          </button>
        </div>
      </div>

      {/* Framework Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FRAMEWORKS.map((fw) => {
          const details: string[] = fw.data?.details || ['No evaluation data available. Run scan in WATCH first.'];
          const isViolation = fw.data?.status === 'VIOLATION';

          return (
            <div
              key={fw.key}
              className={`bg-[#161B22] border rounded-xl p-4 flex flex-col justify-between space-y-3 ${
                isViolation ? 'border-[#E84040]/40' : 'border-[#30363D]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#E6EDF3]">{fw.title}</h4>
                  <p className="text-[10px] text-[#8B949E] mt-0.5 leading-tight">{fw.desc}</p>
                </div>
                {getStatusBadge(fw.data?.status)}
              </div>

              <div className="bg-[#0D1117] border border-[#30363D]/60 rounded-lg p-2.5 space-y-1.5 custom-scrollbar max-h-32 overflow-y-auto">
                <span className="text-[9px] font-bold text-[#8B949E] uppercase block">Findings & Details</span>
                {details.map((d, i) => (
                  <p key={i} className="text-[11px] text-[#E6EDF3] leading-relaxed flex items-start gap-1.5">
                    <span className={isViolation ? 'text-[#E84040]' : 'text-[#00C896]'}>•</span>
                    <span>{d}</span>
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
