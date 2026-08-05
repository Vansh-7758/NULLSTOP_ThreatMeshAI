// frontend/components/defend/DomainProgressBar.tsx
'use client';

import React from 'react';
import { ComplianceGap } from '@/types';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface DomainProgressBarProps {
  domain: string;
  score: number;
  questionCount: number;
  answeredCount?: number;
  gapCount: number;
  expanded: boolean;
  onClick: () => void;
  gaps?: ComplianceGap[];
}

export default function DomainProgressBar({
  domain,
  score,
  questionCount,
  answeredCount = 0,
  gapCount,
  expanded,
  onClick,
  gaps = []
}: DomainProgressBarProps) {
  const getScoreColor = (val: number) => {
    if (val >= 70) return '#10B981'; // Success green
    if (val >= 50) return '#F59E0B'; // Warning amber
    return '#DC2626'; // Red critical
  };

  const barColor = getScoreColor(score);

  const getFrameworkPillClass = (fw: string) => {
    switch (fw.toLowerCase()) {
      case 'nist_csf':
      case 'nist':
        return 'bg-[#2563EB]/15 text-[#3B82F6] border-[#2563EB]/30';
      case 'iso_27001':
      case 'iso':
        return 'bg-[#7C3AED]/15 text-[#A855F7] border-[#7C3AED]/30';
      case 'gdpr':
        return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
      case 'eu_ai_act':
        return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'owasp':
        return 'bg-[#EA580C]/15 text-[#FB923C] border-[#EA580C]/30';
      default:
        return 'bg-[#475569]/15 text-[#94A3B8] border-[#475569]/30';
    }
  };

  return (
    <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl overflow-hidden transition-all">
      {/* Clickable Header Bar */}
      <div
        onClick={onClick}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1E1E3A]/40 transition-colors"
      >
        <div className="flex-1 pr-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
              {domain} Domain
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#94A3B8]">
                {answeredCount}/{questionCount} Answered
              </span>
              {gapCount > 0 && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30 flex items-center gap-1">
                  <AlertTriangle size={11} /> {gapCount} {gapCount === 1 ? 'Gap' : 'Gaps'}
                </span>
              )}
              <span className="text-xs font-bold font-mono" style={{ color: barColor }}>
                {score.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-2.5 bg-[#09090F] rounded-full overflow-hidden border border-[#1E1E3A]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: barColor }}
            />
          </div>
        </div>

        <button className="text-[#94A3B8] hover:text-[#F8FAFC]">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Accordion Expand Area */}
      {expanded && (
        <div className="border-t border-[#1E1E3A] bg-[#09090F]/70 p-4 space-y-3">
          {gaps.length === 0 ? (
            <p className="text-xs text-[#10B981] font-medium flex items-center gap-2">
              ✓ No compliance gaps detected for the {domain} domain.
            </p>
          ) : (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Identified Gaps & Recommended Actions:
              </span>
              {gaps.map((gap, i) => (
                <div key={i} className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#F8FAFC]">
                      [{gap.question_id}] {gap.question_text}
                    </span>
                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${
                        gap.risk_if_no === 'Critical'
                          ? 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30'
                          : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                      }`}
                    >
                      {gap.risk_if_no} Risk
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {gap.frameworks?.map((fw) => (
                      <span
                        key={fw}
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getFrameworkPillClass(
                          fw
                        )}`}
                      >
                        {fw.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#94A3B8] leading-relaxed border-t border-[#1E1E3A]/60 pt-1.5">
                    <strong className="text-[#F8FAFC]">Action:</strong> {gap.recommended_action}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
