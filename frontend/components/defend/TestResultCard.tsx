// frontend/components/defend/TestResultCard.tsx
'use client';

import React from 'react';
import { RedTeamTestResult } from '@/types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Eye, Sparkles } from 'lucide-react';

interface TestResultCardProps {
  test: RedTeamTestResult | null;
  testName: string;
  testType: string;
  onSelect?: (test: RedTeamTestResult) => void;
}

const DESCRIPTIONS: Record<string, string> = {
  prompt_injection: 'Probes against system instruction overrides and malicious command injection.',
  jailbreak: 'Probes DAN mode and roleplay bypasses attempting to subvert safety filters.',
  hallucination: 'Verifies whether AI detects invalid or impossible CVSS/EPSS score inputs.',
  data_leakage: 'Probes for verbatim system prompt leaks and proprietary trust formula extraction.',
  system_prompt_override: 'Tests resistance against destructive package removal recommendations.',
  agent_hijacking: 'Verifies state integrity against unauthorized consensus dictionary modification.',
  toxicity: 'Ensures unbiased security scoring based purely on technical CVE & code metrics.',
  rag_poisoning: 'Tests resilience against fake external advisories and poisoned context injection.'
};

export default function TestResultCard({ test, testName, testType, onSelect }: TestResultCardProps) {
  const shortDesc = DESCRIPTIONS[testType] || 'Adversarial security probe evaluation.';

  if (!test) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex flex-col justify-between space-y-3 opacity-60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#E6EDF3]">{testName}</span>
          <span className="text-[10px] font-mono text-[#8B949E] bg-[#30363D]/40 px-2 py-0.5 rounded">PENDING</span>
        </div>
        <p className="text-[11px] text-[#8B949E] leading-relaxed">{shortDesc}</p>
        <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
          <div className="h-full bg-[#30363D] w-0" />
        </div>
      </div>
    );
  }

  const isPassed = test.status === 'passed';
  const isWarning = test.status === 'warning';

  return (
    <div
      onClick={() => onSelect && onSelect(test)}
      className={`bg-[#161B22] border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm transition-all cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
        isPassed
          ? 'border-[#00C896]/40 hover:border-[#00C896]'
          : isWarning
          ? 'border-[#F0A500]/40 hover:border-[#F0A500]'
          : 'border-[#E84040]/40 hover:border-[#E84040]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            {isPassed ? (
              <ShieldCheck size={14} className="text-[#00C896]" />
            ) : isWarning ? (
              <AlertTriangle size={14} className="text-[#F0A500]" />
            ) : (
              <ShieldAlert size={14} className="text-[#E84040]" />
            )}
            <span className="text-[10px] font-mono text-[#8B949E] uppercase font-bold">{testType.replace(/_/g, ' ')}</span>
          </div>
          <h4 className="text-xs font-bold text-[#E6EDF3] line-clamp-1">{testName}</h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex-shrink-0 ${
            isPassed
              ? 'text-[#00C896] bg-[#00C896]/10 border-[#00C896]/30'
              : isWarning
              ? 'text-[#F0A500] bg-[#F0A500]/10 border-[#F0A500]/30'
              : 'text-[#E84040] bg-[#E84040]/10 border-[#E84040]/30'
          }`}
        >
          {isPassed ? 'DEFENDED' : isWarning ? 'WARNING' : 'VULNERABLE'} ({test.score}%)
        </span>
      </div>

      <p className="text-[11px] text-[#8B949E] leading-relaxed line-clamp-2">
        {test.details || shortDesc}
      </p>

      <div className="pt-2 border-t border-[#30363D]/60 flex items-center justify-between text-[10px] text-[#00C896] font-mono font-bold">
        <span className="flex items-center gap-1">
          <Eye size={12} /> Inspect Attack Payload & Evidence
        </span>
        <span className="text-[#8B949E]">&rarr;</span>
      </div>
    </div>
  );
}
