// frontend/components/defend/PolicyStatusGrid.tsx
'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, FileCode2, Lock, Flame, Bot, AlertTriangle } from 'lucide-react';

interface PolicyStatusGridProps {
  blockedCount?: number;
}

const POLICIES = [
  { id: 'GOV-P1', name: 'no_sql_injection', risk: 'CRITICAL', icon: FileCode2, desc: 'Regex patterns matching SQL injection syntax in prompt/response stream.' },
  { id: 'GOV-P2', name: 'no_pii_exposure', risk: 'HIGH', icon: Lock, desc: 'Detects SSN formats, credit card numbers, passwords, and private key headers.' },
  { id: 'GOV-P3', name: 'no_harmful_content', risk: 'CRITICAL', icon: Flame, desc: 'Blocks exploit generation, malware creation, and shellcode synthesis requests.' },
  { id: 'GOV-P4', name: 'no_jailbreak', risk: 'HIGH', icon: Bot, desc: 'Blocks DAN roleplay, instruction overrides, and system prompt bypass attempts.' },
  { id: 'GOV-P5', name: 'content_safety', risk: 'MEDIUM', icon: AlertTriangle, desc: 'Filters toxic language patterns and explicit harassment phrases.' }
];

export default function PolicyStatusGrid({ blockedCount = 0 }: PolicyStatusGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
          Active Guardrail Policies (5)
        </h4>
        <span className="text-[10px] text-[#00C896] bg-[#00C896]/10 px-2 py-0.5 rounded-full border border-[#00C896]/30 font-mono">
          All Enforced
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {POLICIES.map((p) => {
          const Icon = p.icon;
          const isCritical = p.risk === 'CRITICAL';
          const isHigh = p.risk === 'HIGH';

          return (
            <div
              key={p.id}
              className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-sm hover:border-[#00C896]/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className={`p-1.5 rounded-lg ${isCritical ? 'bg-[#E84040]/10 text-[#E84040]' : isHigh ? 'bg-[#F0A500]/10 text-[#F0A500]' : 'bg-[#F0A500]/7 text-[#F0A500]/70'}`}>
                  <Icon size={16} />
                </div>
                <span className="text-[9px] font-mono text-[#00C896] bg-[#00C896]/10 px-1.5 py-0.5 rounded border border-[#00C896]/20 font-bold">
                  ACTIVE
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-[#8B949E] font-bold">{p.id}</span>
                  <span className="text-xs font-bold text-[#E6EDF3] truncate">{p.name}</span>
                </div>
                <p className="text-[10px] text-[#8B949E] leading-tight line-clamp-2 mt-1">{p.desc}</p>
              </div>

              <div className="pt-2 border-t border-[#30363D]/60 flex items-center justify-between text-[10px]">
                <span className="text-[#8B949E]">Risk Level</span>
                <span className={`font-mono font-bold ${isCritical ? 'text-[#E84040]' : isHigh ? 'text-[#F0A500]' : 'text-[#F0A500]/70'}`}>
                  {p.risk}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
