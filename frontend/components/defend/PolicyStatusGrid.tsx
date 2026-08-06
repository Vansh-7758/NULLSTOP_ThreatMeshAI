// frontend/components/defend/PolicyStatusGrid.tsx
'use client';

import React from 'react';
import { FileCode2, Lock, Flame, Bot, AlertTriangle } from 'lucide-react';

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
        <h4 className="text-xs font-bold uppercase tracking-wider text-white font-['Plus_Jakarta_Sans']">
          Active Guardrail Policies (5)
        </h4>
        <span className="text-[10px] text-[#22c55e] bg-[rgba(34,197,94,0.15)] px-2.5 py-0.5 rounded-full border border-[rgba(34,197,94,0.30)] font-mono font-bold">
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
              className="glass-card p-3.5 flex flex-col justify-between space-y-2 rounded-xl"
            >
              <div className="flex items-start justify-between">
                <div className={`p-1.5 rounded-lg ${isCritical ? 'bg-[rgba(239,68,68,0.20)] text-[#ef4444]' : isHigh ? 'bg-[rgba(245,158,11,0.20)] text-[#f59e0b]' : 'bg-[rgba(237,158,88,0.20)] text-[#ED9E58]'}`}>
                  <Icon size={16} />
                </div>
                <span className="text-[9px] font-mono text-[#22c55e] bg-[rgba(34,197,94,0.15)] px-1.5 py-0.5 rounded border border-[rgba(34,197,94,0.30)] font-bold">
                  ACTIVE
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#ED9E58] font-bold">{p.id}</span>
                  <span className="text-xs font-bold text-white truncate font-['Plus_Jakarta_Sans']">{p.name}</span>
                </div>
                <p className="text-[10px] text-[#CBD5E1] leading-tight line-clamp-2 mt-1 font-sans">{p.desc}</p>
              </div>

              <div className="pt-2 border-t border-[rgba(233,188,185,0.15)] flex items-center justify-between text-[10px]">
                <span className="text-[#CBD5E1] font-medium">Risk Level</span>
                <span className={`font-mono font-bold ${isCritical ? 'text-[#ef4444]' : isHigh ? 'text-[#f59e0b]' : 'text-[#ED9E58]'}`}>
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
