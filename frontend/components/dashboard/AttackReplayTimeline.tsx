// frontend/components/dashboard/AttackReplayTimeline.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, GitCommit, FileCode2, Database, ShieldAlert, Network, Users, CheckCircle2, GitPullRequest, ArrowRight, Sparkles, ExternalLink, Activity } from 'lucide-react';

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  timestamp: string;
  details: React.ReactNode;
}

interface AttackReplayTimelineProps {
  scanId?: string | null;
  packages?: any[];
  cves?: any[];
}

export default function AttackReplayTimeline({ scanId, packages = [], cves = [] }: AttackReplayTimelineProps) {
  const [currentStage, setCurrentStage] = useState<number>(0); // 0 = idle, 1..8 = stages
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animatedScore, setAnimatedScore] = useState<number>(100.0);

  // Identify target critical or sample package from current scan
  const lowestPkg = React.useMemo(() => {
    if (packages && packages.length > 0) {
      const sorted = [...packages].sort((a, b) => (a.trust_score ?? 100) - (b.trust_score ?? 100));
      return sorted[0];
    }
    return { name: 'log4j-core', version: '2.14.1', ecosystem: 'maven', trust_score: 10.0 };
  }, [packages]);

  const targetScore = lowestPkg.trust_score ?? 10.0;
  const targetName = lowestPkg.name || 'log4j-core';
  const targetVersion = lowestPkg.version || '2.14.1';
  const totalCount = packages.length > 0 ? packages.length : 16;
  const secondPkg = packages.length > 1 ? packages[1] : { name: 'ua-parser-js', version: '0.7.28' };

  // Auto-play timeline timer (600ms delay between stages)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStage < 8) {
      timer = setTimeout(() => {
        setCurrentStage((prev) => prev + 1);
      }, 900);
    } else if (currentStage >= 8) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStage]);

  // Stage 4 animated score countdown effect
  useEffect(() => {
    if (currentStage >= 4) {
      let current = 100.0;
      const target = Math.max(10.0, targetScore);
      const interval = setInterval(() => {
        current -= 3.0;
        if (current <= target) {
          current = target;
          clearInterval(interval);
        }
        setAnimatedScore(current);
      }, 30);
      return () => clearInterval(interval);
    } else {
      setAnimatedScore(100.0);
    }
  }, [currentStage, targetScore]);

  const handleStartReplay = () => {
    setCurrentStage(1);
    setIsPlaying(true);
    setAnimatedScore(100.0);
  };

  const stages: Stage[] = [
    {
      id: 1,
      title: 'Stage 1 — Developer Commits Code',
      subtitle: 'Developer pushes a new commit containing software dependency update',
      icon: GitCommit,
      color: '#7c3aed',
      badge: 'TRIGGER',
      timestamp: '00:00.000',
      details: (
        <div className="font-mono text-xs text-[#ccc3d8] bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
          <p><span className="text-[#8a809b]">Commit SHA:</span> <span className="text-white font-bold">7f3b89a</span></p>
          <p><span className="text-[#8a809b]">Branch:</span> <span className="text-[#a78bfa]">main</span> | <span className="text-[#8a809b]">Author:</span> dev@enterprise.com</p>
          <p className="text-[#00c896]">+ Pushed updated SBOM / manifest to repository ({scanId || 'scan-active'})</p>
        </div>
      )
    },
    {
      id: 2,
      title: 'Stage 2 — SBOM Diffed & New Dependency Detected',
      subtitle: 'ThreatMesh ingests SBOM, diffs changes against baseline',
      icon: FileCode2,
      color: '#3b82f6',
      badge: 'INGESTION',
      timestamp: '00:00.600',
      details: (
        <div className="font-mono text-xs text-[#ccc3d8] bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
          <p className="text-[#00c896]">+ Analyzed: {targetName}@{targetVersion} ({lowestPkg.ecosystem || 'npm'})</p>
          <p className="text-[#00c896]">+ Parsed: {secondPkg.name}@{secondPkg.version}</p>
          <p className="text-[#8a809b]">Total {totalCount} packages parsed, dependency tree graph constructed.</p>
        </div>
      )
    },
    {
      id: 3,
      title: 'Stage 3 — ThreatMesh Ingests Live Vulnerability Data',
      subtitle: 'Parallel live threat feed lookup across NVD, OSV.dev, & GitHub Advisories',
      icon: Database,
      color: '#ffc107',
      badge: 'THREAT INTEL',
      timestamp: '00:01.200',
      details: (
        <div className="font-mono text-xs text-[#ccc3d8] bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
          <div className="flex items-center justify-between text-[#ff2a6d] font-bold">
            <span>Threat Flagged in {targetName}@{targetVersion}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#ff2a6d]/20 text-[10px] border border-[#ff2a6d]/50">CRITICAL / HIGH</span>
          </div>
          <p className="text-[11px] text-[#ccc3d8]">EPSS Exploit Probability Evaluated | Public Exploit Signal Verified</p>
        </div>
      )
    },
    {
      id: 4,
      title: 'Stage 4 — Real-Time Trust Score Degradation',
      subtitle: 'ADTG 5-Signal Engine calculates dynamic software credit score in real-time',
      icon: ShieldAlert,
      color: '#ff2a6d',
      badge: 'ADTG SCORING',
      timestamp: '00:01.800',
      details: (
        <div className="bg-[#0c0c16] p-3 rounded-lg border border-[#ff2a6d]/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8a809b]">{targetName} Trust Score:</span>
            <span className="text-xl font-mono font-extrabold text-[#ff2a6d] animate-pulse">
              {animatedScore.toFixed(1)} / 100.0
            </span>
          </div>
          <div className="w-full h-2 bg-[#1f1f3a] rounded-full overflow-hidden">
            <div className="h-full bg-[#ff2a6d] transition-all duration-75" style={{ width: `${animatedScore}%` }}></div>
          </div>
          <p className="text-[10px] font-mono text-[#8a809b]">
            Deductions: CVE Severity | EPSS Risk Signal | Public Exploit Verification
          </p>
        </div>
      )
    },
    {
      id: 5,
      title: 'Stage 5 — Graph Reachability Discovers Attack Path',
      subtitle: 'Cypher graph walk identifies exposed route from public API entrypoint',
      icon: Network,
      color: '#ff2a6d',
      badge: 'REACHABILITY',
      timestamp: '00:02.400',
      details: (
        <div className="font-mono text-xs text-[#ccc3d8] bg-[#0c0c16] p-2.5 rounded-lg border border-[#ff2a6d]/50 space-y-1">
          <span className="text-[#ff2a6d] font-bold block mb-1">REACHABLE ATTACK PATH IDENTIFIED:</span>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#1f1f3a] text-white">Public API</span>
            <ArrowRight size={12} className="text-[#ff2a6d]" />
            <span className="px-2 py-0.5 rounded bg-[#1f1f3a] text-white">Gateway</span>
            <ArrowRight size={12} className="text-[#ff2a6d]" />
            <span className="px-2 py-0.5 rounded bg-[#ff2a6d]/20 text-[#ff2a6d] font-bold border border-[#ff2a6d]/50">{targetName}@{targetVersion}</span>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'Stage 6 — Multi-Agent AI Council Convenes',
      subtitle: '8 specialized AI agents analyze threat context, business impact & compliance',
      icon: Users,
      color: '#a78bfa',
      badge: 'AI COUNCIL',
      timestamp: '00:03.000',
      details: (
        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-center">
          {['Threat', 'Risk', 'Trust', 'Patch', 'Compliance', 'Safety', 'Governance', 'Orchestrator'].map((agent) => (
            <div key={agent} className="p-1 rounded bg-[#7c3aed]/20 text-[#c4b5fd] border border-[#7c3aed]/40 animate-pulse">
              {agent}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 7,
      title: 'Stage 7 — Patch Agent Recommends Verified Safe Version',
      subtitle: 'AI Council validates patch compatibility and verifies zero breaking changes',
      icon: CheckCircle2,
      color: '#00c896',
      badge: 'RECOMMENDATION',
      timestamp: '00:03.600',
      details: (
        <div className="font-mono text-xs text-[#ccc3d8] bg-[#0c0c16] p-2.5 rounded-lg border border-[#00c896]/50 space-y-1">
          <p className="text-[#00c896] font-bold flex items-center gap-1">
            <CheckCircle2 size={13} /> Upgrade Recommended: log4j-core 2.14.1 → 2.17.1
          </p>
          <p className="text-[11px] text-[#8a809b]">CVSS score resolved from 10.0 to 0.0. All 5 ADTG signals green.</p>
        </div>
      )
    },
    {
      id: 8,
      title: 'Stage 8 — Automated GitHub Pull Request Generated',
      subtitle: 'ThreatMesh generates automated zero-touch security remediation PR',
      icon: GitPullRequest,
      color: '#00c896',
      badge: 'REMEDIATION',
      timestamp: '00:04.200',
      details: (
        <div className="p-3 bg-[#00c896]/15 border border-[#00c896]/50 rounded-lg text-xs font-mono text-[#00c896] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1">
              <GitPullRequest size={14} /> Pull Request #42 Created
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#00c896]/20 text-[#00c896]">CLOSED THREAT</span>
          </div>
          <a
            href="https://github.com/threatmesh-ai/enterprise-app/pull/42"
            target="_blank"
            rel="noreferrer"
            className="text-white underline hover:text-[#a78bfa] block truncate font-bold flex items-center gap-1"
          >
            [Security Auto-Patch] Upgrade log4j-core to 2.17.1 <ExternalLink size={12} />
          </a>
        </div>
      )
    }
  ];

  return (
    <div className="bg-[#0e0e14]/90 border border-[#2D2D5E] rounded-xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E3A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/40">
              FEATURE 6
            </span>
            <h2 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="text-[#7c3aed]" size={20} /> Attack Replay Timeline
            </h2>
          </div>
          <p className="text-xs text-[#ccc3d8] mt-1">
            Visual 8-stage step-by-step animated sequence tracing supply chain attack detection from developer commit to automated PR fix.
          </p>
        </div>

        {/* Action Replay Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleStartReplay}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono font-bold rounded-lg shadow-lg transition-colors flex items-center gap-2"
          >
            {isPlaying ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} />}
            {isPlaying ? 'Playing Sequence...' : currentStage > 0 ? 'Replay Timeline' : 'Play Attack Replay'}
          </button>
        </div>
      </div>

      {/* Timeline Steps Layout */}
      <div className="space-y-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const isPassed = currentStage > stage.id;

          return (
            <motion.div
              key={stage.id}
              initial={false}
              animate={{
                opacity: currentStage === 0 || currentStage >= stage.id ? 1 : 0.4,
                scale: isActive ? 1.01 : 1
              }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-[#18182c] border-[#7c3aed] shadow-lg ring-1 ring-[#7c3aed]/50'
                  : isPassed
                  ? 'bg-[#12121f] border-[#232345]'
                  : 'bg-[#0c0c16]/60 border-[#1a1a2e]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-[#7c3aed]/30 border-[#7c3aed] text-white animate-pulse' : 'bg-[#18182c] border-[#2a2a4e] text-[#a78bfa]'
                  }`}>
                    <Icon size={18} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white font-['Space_Grotesk']">
                        {stage.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1a1a2e] text-[#a78bfa] border border-[#7c3aed]/30">
                        {stage.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a809b] mt-0.5">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-[#8a809b] shrink-0">
                  {stage.timestamp}
                </span>
              </div>

              {/* Stage Specific Details Panel */}
              {(currentStage === 0 || currentStage >= stage.id) && (
                <div className="mt-3 pl-12">
                  {stage.details}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
