// frontend/components/hunt/CouncilPanel.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle, Clock, Loader2, Cpu } from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputSnippet?: string;
  accent: string;
}

interface CouncilPanelProps {
  scanId: string | null;
  currentPackage: string;
  packagesAnalyzed: number;
  totalPackages: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export default function CouncilPanel({
  scanId,
  currentPackage,
  packagesAnalyzed,
  totalPackages,
  status
}: CouncilPanelProps) {
  const agents: AgentInfo[] = [
    { id: 'threat', name: 'Threat Intelligence Agent', role: 'CVE triage & exploit vulnerability mapping', status: status === 'running' ? 'completed' : status === 'completed' ? 'completed' : 'pending', accent: '#ef4444' },
    { id: 'risk', name: 'Business Risk Agent', role: 'Blast radius & financial impact analysis', status: status === 'running' ? 'completed' : status === 'completed' ? 'completed' : 'pending', accent: '#f59e0b' },
    { id: 'trust', name: 'Trust Analyst Agent', role: '5-factor AADTG score recalculation', status: status === 'running' ? 'running' : status === 'completed' ? 'completed' : 'pending', accent: '#ED9E58' },
    { id: 'patch', name: 'Patch Synthesizer Agent', role: 'Non-breaking version bump computation', status: status === 'running' ? 'pending' : status === 'completed' ? 'completed' : 'pending', accent: '#9A5FFD' },
    { id: 'compliance', name: 'Compliance Mapper Agent', role: 'NIST CSF, MITRE ATT&CK & OWASP mapping', status: status === 'running' ? 'pending' : status === 'completed' ? 'completed' : 'pending', accent: '#3b82f6' },
    { id: 'safety', name: 'Safety Guard Agent', role: 'Jailbreak & hallucination resistance check', status: status === 'running' ? 'pending' : status === 'completed' ? 'completed' : 'pending', accent: '#22c55e' },
    { id: 'governance', name: 'Governance Agent', role: 'Policy compliance & event auditing', status: status === 'running' ? 'pending' : status === 'completed' ? 'completed' : 'pending', accent: '#3b82f6' },
    { id: 'consensus', name: 'AI Council Consensus', role: 'Final playbook synthesis & PR payload build', status: status === 'completed' ? 'completed' : 'pending', accent: '#ec4899' }
  ];

  const progressPct = totalPackages > 0 ? Math.round((packagesAnalyzed / totalPackages) * 100) : 0;

  return (
    <div className="glass-card p-6 lg:p-8 relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #9A5FFD, #ED9E58, transparent)' }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(233,188,185,0.20)] pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[rgba(154,95,253,0.18)] border border-[rgba(154,95,253,0.35)] flex items-center justify-center">
              <Cpu className="text-[#9A5FFD]" size={18} />
            </div>
            <h2 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
              8-AGENT AI COUNCIL SYNTHESIS
            </h2>
          </div>
          <p className="text-xs text-[#CBD5E1] font-sans">
            Multi-agent consensus engine analyzing business blast radius and generating safe remediation playbooks.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-mono font-bold text-[#ED9E58] uppercase tracking-wider">Analysis Progress</p>
            <p className="text-sm font-mono font-extrabold text-[#ED9E58]">
              {packagesAnalyzed} / {totalPackages || 8} Packages ({progressPct}%)
            </p>
          </div>
          <div className="w-24 h-2 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #9A5FFD, #ED9E58)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent, i) => {
          const isCompleted = agent.status === 'completed';
          const isRunning = agent.status === 'running';

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                isRunning
                  ? 'bg-[rgba(237,158,88,0.15)] border border-[rgba(237,158,88,0.45)] shadow-[0_0_24px_rgba(237,158,88,0.20)]'
                  : isCompleted
                  ? 'bg-[rgba(255,255,255,0.03)] border border-[rgba(233,188,185,0.20)] hover:border-[rgba(237,158,88,0.40)]'
                  : 'bg-[rgba(11,13,27,0.70)] border border-[rgba(233,188,185,0.12)] opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
                  style={{ background: `${agent.accent}25`, color: agent.accent, border: `1px solid ${agent.accent}50` }}
                >
                  {i + 1}
                </div>

                <span
                  className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"
                  style={{
                    background: isCompleted ? 'rgba(34,197,94,0.20)' : isRunning ? 'rgba(237,158,88,0.20)' : 'rgba(233,188,185,0.12)',
                    color: isCompleted ? '#22c55e' : isRunning ? '#ED9E58' : '#CBD5E1',
                    border: `1px solid ${isCompleted ? 'rgba(34,197,94,0.40)' : isRunning ? 'rgba(237,158,88,0.40)' : 'rgba(233,188,185,0.25)'}`
                  }}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle size={10} /> DONE
                    </>
                  ) : isRunning ? (
                    <>
                      <Loader2 size={10} className="animate-spin" /> RUNNING
                    </>
                  ) : (
                    <>
                      <Clock size={10} /> WAITING
                    </>
                  )}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mb-1 leading-tight font-['Plus_Jakarta_Sans']">{agent.name}</h4>
              <p className="text-[10px] text-[#CBD5E1] leading-relaxed line-clamp-2 font-sans">{agent.role}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
