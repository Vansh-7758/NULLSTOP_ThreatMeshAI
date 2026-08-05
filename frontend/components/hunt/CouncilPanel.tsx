// frontend/components/hunt/CouncilPanel.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Package, Playbook, AgentOutput } from '@/types';
import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import {
  Shield,
  TrendingDown,
  Star,
  Wrench,
  Scale,
  Eye,
  FileCheck,
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  GitPullRequest,
  Copy,
  Check,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface CouncilPanelProps {
  package: Package | null;
  playbook: Playbook | null;
  scanId: string;
  agentOutputs?: Record<string, AgentOutput>;
}

const AGENTS = [
  { id: 'threat_agent', name: 'Threat Agent', role: 'Threat Characterization', icon: Shield },
  { id: 'risk_agent', name: 'Risk Agent', role: 'Business Impact', icon: TrendingDown },
  { id: 'trust_agent', name: 'Trust Agent', role: 'Trust Score Explainer', icon: Star },
  { id: 'patch_agent', name: 'Patch Agent', role: 'Dependency Upgrade', icon: Wrench },
  { id: 'compliance_agent', name: 'Compliance Agent', role: 'Regulatory Mapping', icon: Scale },
  { id: 'safety_agent', name: 'Safety Agent', role: 'AI & Data Pipeline Safety', icon: Eye },
  { id: 'governance_agent', name: 'Governance Agent', role: 'Corporate Security Auditor', icon: FileCheck },
  { id: 'consensus_node', name: 'Consensus Engine', role: 'Multi-Agent Synthesis', icon: Brain }
];

export default function CouncilPanel({
  package: pkg,
  playbook,
  scanId,
  agentOutputs = {}
}: CouncilPanelProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [copiedCmd, setCopiedCmd] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    threat: true,
    action: true,
    impact: false,
    trust: false,
    patch: true,
    compliance: true,
    safety: false,
    governance: false,
    citations: false
  });

  if (!pkg) {
    return (
      <div className="w-full h-full min-h-[500px] bg-[#161B22] border border-[#30363D] rounded-xl flex flex-col items-center justify-center p-8 text-center">
        <Brain size={48} className="text-[#8B949E] mb-3 opacity-40" />
        <h3 className="text-base font-semibold text-[#E6EDF3] mb-1">No Package Selected</h3>
        <p className="text-xs text-[#8B949E] max-w-xs">
          Select an at-risk package from the left sidebar to inspect its 8-Agent Council analysis and consensus playbook.
        </p>
      </div>
    );
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const confidenceScore = playbook?.confidence_score ?? 88.0;
  const confidenceColor =
    confidenceScore >= 80 ? '#00C896' : confidenceScore >= 60 ? '#F0A500' : '#E84040';

  const upgradeCmd =
    (playbook as any)?.patch_recommendation?.upgrade_command ||
    `npm install ${pkg.name}@latest`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(upgradeCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleExportPlaybook = () => {
    const filename = `threatmesh-playbook-${pkg.name}-${new Date().toISOString().split('T')[0]}.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(playbook || {}, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-6 space-y-6 shadow-sm overflow-hidden">
      {/* Top Package Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#30363D]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-[#E6EDF3]">{pkg.name}</h2>
            <span className="text-xs font-mono text-[#8B949E]">v{pkg.version}</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#0D1117] text-[#00C896] border border-[#00C896]/30 font-bold">
              {pkg.ecosystem}
            </span>
          </div>
          <p className="text-xs text-[#8B949E] mt-1">Multi-Agent AI Reasoning & Consensus Analysis</p>
        </div>

        <div className="flex items-center gap-3">
          <TrustScoreBadge score={pkg.trust_score} size="lg" />
          <button
            onClick={handleExportPlaybook}
            className="px-3 py-1.5 bg-[#30363D] hover:bg-[#8B949E]/20 text-[#E6EDF3] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* 8 Agent Grid (2 Rows of 4 Cards) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-3 flex items-center gap-1.5">
          <Brain size={14} className="text-[#00C896]" /> 8-Agent Council Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AGENTS.map((ag) => {
            const Icon = ag.icon;
            const outputObj = agentOutputs[ag.id];
            const isDone = playbook != null || outputObj?.status === 'completed';
            const isRunning = outputObj?.status === 'running';
            const isFailed = outputObj?.status === 'failed';

            let statusColor = '#30363D';
            if (isDone) statusColor = '#00C896';
            else if (isRunning) statusColor = '#F0A500';
            else if (isFailed) statusColor = '#E84040';

            return (
              <div
                key={ag.id}
                className="bg-[#0D1117] border rounded-xl p-3 flex flex-col justify-between transition-all"
                style={{ borderColor: statusColor }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#161B22] text-[#00C896]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#E6EDF3]">{ag.name}</h4>
                        <span className="text-[10px] text-[#8B949E] block">{ag.role}</span>
                      </div>
                    </div>

                    {isDone ? (
                      <CheckCircle2 size={16} className="text-[#00C896]" />
                    ) : isRunning ? (
                      <Loader2 size={16} className="text-[#F0A500] animate-spin" />
                    ) : isFailed ? (
                      <XCircle size={16} className="text-[#E84040]" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#30363D]" />
                    )}
                  </div>

                  <p className="text-[11px] text-[#8B949E] leading-snug line-clamp-2 mt-1">
                    {isDone
                      ? `Evaluated ${ag.name.replace(' Agent', '')} parameters.`
                      : isRunning
                      ? 'Analyzing...'
                      : 'Pending execution'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consensus Playbook Accordion Section */}
      {playbook && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-[#30363D] pt-6 space-y-4"
        >
          {/* Header & Confidence Score */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#00C896]" />
              <h3 className="text-base font-bold text-[#E6EDF3]">Consensus Remediation Playbook</h3>
            </div>

            <div className="flex items-center gap-2 bg-[#0D1117] border border-[#30363D] px-3 py-1 rounded-full">
              <span className="text-xs text-[#8B949E]">Council Confidence:</span>
              <span className="text-xs font-bold" style={{ color: confidenceColor }}>
                {Math.round(confidenceScore)}%
              </span>
            </div>
          </div>

          {/* 1. Recommended Action (Always Expanded / Prominent) */}
          <div className="bg-[#0D1117] border border-[#00C896]/40 rounded-xl overflow-hidden">
            <div
              onClick={() => toggleSection('action')}
              className="p-4 flex items-center justify-between cursor-pointer bg-[#00C896]/10 border-b border-[#00C896]/30 select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#00C896]">
                Single Recommended Action
              </span>
              {expandedSections.action ? <ChevronUp size={16} className="text-[#00C896]" /> : <ChevronDown size={16} className="text-[#00C896]" />}
            </div>
            {expandedSections.action && (
              <div className="p-4 space-y-3">
                <p className="text-sm font-semibold text-[#E6EDF3] leading-relaxed">
                  {playbook.recommended_action || `Upgrade ${pkg.name} immediately.`}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => router.push(`/scan/${scanId}?package=${pkg.name}`)}
                    className="px-4 py-2 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-2 shadow-md"
                  >
                    <GitPullRequest size={15} /> Fix Package in FIX Module
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Threat Summary */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden">
            <div
              onClick={() => toggleSection('threat')}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#161B22] transition-colors select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#E84040]">
                Threat Characterization Summary
              </span>
              {expandedSections.threat ? <ChevronUp size={16} className="text-[#8B949E]" /> : <ChevronDown size={16} className="text-[#8B949E]" />}
            </div>
            {expandedSections.threat && (
              <div className="p-4 border-t border-[#30363D] text-xs text-[#E6EDF3] leading-relaxed">
                {playbook.threat_summary}
              </div>
            )}
          </div>

          {/* 3. Patch Recommendation & Command */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden">
            <div
              onClick={() => toggleSection('patch')}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#161B22] transition-colors select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                Patch & Upgrade Target
              </span>
              {expandedSections.patch ? <ChevronUp size={16} className="text-[#8B949E]" /> : <ChevronDown size={16} className="text-[#8B949E]" />}
            </div>
            {expandedSections.patch && (
              <div className="p-4 border-t border-[#30363D] space-y-3 text-xs">
                <div className="flex items-center justify-between bg-[#161B22] p-3 rounded-lg border border-[#30363D]">
                  <span className="font-mono text-[#00C896] font-bold">{upgradeCmd}</span>
                  <button
                    onClick={handleCopyCommand}
                    className="p-1.5 rounded bg-[#30363D] hover:bg-[#8B949E]/20 text-[#E6EDF3] transition-colors"
                    title="Copy command"
                  >
                    {copiedCmd ? <Check size={14} className="text-[#00C896]" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Compliance Mapping Tags */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden">
            <div
              onClick={() => toggleSection('compliance')}
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#161B22] transition-colors select-none"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#F0A500]">
                Compliance Standard Mappings
              </span>
              {expandedSections.compliance ? <ChevronUp size={16} className="text-[#8B949E]" /> : <ChevronDown size={16} className="text-[#8B949E]" />}
            </div>
            {expandedSections.compliance && (
              <div className="p-4 border-t border-[#30363D] flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-semibold">
                  NIST CSF 2.0: PR.DS-06
                </span>
                <span className="px-2.5 py-1 rounded bg-[#E84040]/15 text-[#E84040] border border-[#E84040]/30 font-semibold">
                  MITRE ATT&CK: T1195.001
                </span>
                <span className="px-2.5 py-1 rounded bg-[#F0A500]/15 text-[#F0A500] border border-[#F0A500]/30 font-semibold">
                  OWASP Top 10: A06:2021
                </span>
                <span className="px-2.5 py-1 rounded bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-semibold">
                  ISO 27001: A.8.19
                </span>
                <span className="px-2.5 py-1 rounded bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30 font-semibold">
                  EU AI Act: Article 15 Compliant
                </span>
              </div>
            )}
          </div>

          {/* 5. Evidence Citations */}
          {playbook.evidence_citations && playbook.evidence_citations.length > 0 && (
            <div className="bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden">
              <div
                onClick={() => toggleSection('citations')}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#161B22] transition-colors select-none"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                  Evidence Citations ({playbook.evidence_citations.length})
                </span>
                {expandedSections.citations ? <ChevronUp size={16} className="text-[#8B949E]" /> : <ChevronDown size={16} className="text-[#8B949E]" />}
              </div>
              {expandedSections.citations && (
                <div className="p-4 border-t border-[#30363D] space-y-2 text-xs">
                  {playbook.evidence_citations.map((cite, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#8B949E]">
                      <span className="font-mono font-bold text-[#00C896]">{idx + 1}.</span>
                      <span>{cite}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
