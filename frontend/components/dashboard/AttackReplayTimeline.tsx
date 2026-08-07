// frontend/components/dashboard/AttackReplayTimeline.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, GitCommit, FileCode2, Database, ShieldAlert, Network, Users, CheckCircle2, GitPullRequest, ArrowRight, ExternalLink, Activity } from 'lucide-react';

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
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animatedScore, setAnimatedScore] = useState<number>(100.0);

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
      color: '#ED9E58',
      badge: 'TRIGGER',
      timestamp: '00:00.000',
      details: (
        <div className="font-mono text-xs text-[#E9BCB9] bg-[rgba(11,13,27,0.70)] p-3 rounded-xl border border-[rgba(163,64,84,0.15)] space-y-1">
          <p><span className="text-[#A34054]">Commit SHA:</span> <span className="text-white font-bold">7f3b89a</span></p>
          <p><span className="text-[#A34054]">Branch:</span> <span className="text-[#ED9E58]">main</span> | <span className="text-[#A34054]">Author:</span> dev@enterprise.com</p>
          <p className="text-[#22c55e]">+ Pushed updated SBOM / manifest to repository ({scanId || 'scan-active'})</p>
        </div>
      )
    },
    {
      id: 2,
      title: 'Stage 2 — SBOM Diffed & New Dependency Detected',
      subtitle: 'ThreatMesh ingests SBOM, diffs changes against baseline',
      icon: FileCode2,
      color: '#9A5FFD',
      badge: 'INGESTION',
      timestamp: '00:00.600',
      details: (
        <div className="font-mono text-xs text-[#E9BCB9] bg-[rgba(11,13,27,0.70)] p-3 rounded-xl border border-[rgba(163,64,84,0.15)] space-y-1">
          <p className="text-[#22c55e]">+ Analyzed: {targetName}@{targetVersion} ({lowestPkg.ecosystem || 'npm'})</p>
          <p className="text-[#22c55e]">+ Parsed: {secondPkg.name}@{secondPkg.version}</p>
          <p className="text-[#A34054]">Total {totalCount} packages parsed, dependency tree graph constructed.</p>
        </div>
      )
    },
    {
      id: 3,
      title: 'Stage 3 — Live Threat Intelligence Sync',
      subtitle: 'Parallel live threat feed lookup across NVD, OSV.dev, & GitHub Advisories',
      icon: Database,
      color: '#f59e0b',
      badge: 'THREAT INTEL',
      timestamp: '00:01.200',
      details: (
        <div className="font-mono text-xs text-[#E9BCB9] bg-[rgba(11,13,27,0.70)] p-3 rounded-xl border border-[rgba(163,64,84,0.15)] space-y-1">
          <div className="flex items-center justify-between text-[#ef4444] font-bold">
            <span>Threat Flagged in {targetName}@{targetVersion}</span>
            <span className="px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[10px] border border-[rgba(239,68,68,0.30)]">CRITICAL</span>
          </div>
          <p className="text-[11px] text-[#E9BCB9]/80">EPSS Exploit Probability Evaluated | Public Exploit Signal Verified</p>
        </div>
      )
    },
    {
      id: 4,
      title: 'Stage 4 — Real-Time Trust Score Degradation',
      subtitle: 'ADTG 5-Signal Engine calculates dynamic software credit score in real-time',
      icon: ShieldAlert,
      color: '#ef4444',
      badge: 'ADTG SCORING',
      timestamp: '00:01.800',
      details: (
        <div className="bg-[rgba(11,13,27,0.70)] p-3 rounded-xl border border-[rgba(239,68,68,0.30)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#A34054]">{targetName} Trust Score:</span>
            <span className="text-xl font-mono font-extrabold text-[#ef4444] animate-pulse">
              {animatedScore.toFixed(1)} / 100.0
            </span>
          </div>
          <div className="w-full h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
            <div className="h-full bg-[#ef4444] transition-all duration-75" style={{ width: `${animatedScore}%` }}></div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Stage 5 — Graph Reachability Discovers Attack Path',
      subtitle: 'Cypher graph walk identifies exposed route from public API entrypoint',
      icon: Network,
      color: '#ef4444',
      badge: 'REACHABILITY',
      timestamp: '00:02.400',
      details: (
        <div className="font-mono text-xs text-[#E9BCB9] bg-[rgba(11,13,27,0.70)] p-3 rounded-xl border border-[rgba(239,68,68,0.30)] space-y-1">
          <span className="text-[#ef4444] font-bold block mb-1">REACHABLE ATTACK PATH IDENTIFIED:</span>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="px-2.5 py-0.5 rounded-md bg-[rgba(27,25,49,0.90)] text-white border border-[rgba(163,64,84,0.25)]">Public API</span>
            <ArrowRight size={12} className="text-[#ef4444]" />
            <span className="px-2.5 py-0.5 rounded-md bg-[rgba(27,25,49,0.90)] text-white border border-[rgba(163,64,84,0.25)]">Gateway</span>
            <ArrowRight size={12} className="text-[#ef4444]" />
            <span className="px-2.5 py-0.5 rounded-md bg-[rgba(239,68,68,0.15)] text-[#ef4444] font-bold border border-[rgba(239,68,68,0.35)]">{targetName}@{targetVersion}</span>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'Stage 6 — Multi-Agent AI Council Convenes',
      subtitle: '8 specialized AI agents analyze threat context, business impact & compliance',
      icon: Users,
      color: '#9A5FFD',
      badge: 'AI COUNCIL',
      timestamp: '00:03.000',
      details: (
        <div className="grid grid-cols-4 gap-2 font-mono text-[10px] text-center">
          {['Threat', 'Risk', 'Trust', 'Patch', 'Compliance', 'Safety', 'Governance', 'Orchestrator'].map((agent) => (
            <div key={agent} className="p-1.5 rounded-lg bg-[rgba(154,95,253,0.15)] text-[#9A5FFD] border border-[rgba(154,95,253,0.30)] font-bold animate-pulse">
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
      color: '#22c55e',
      badge: 'RECOMMENDATION',
      timestamp: '00:03.600',
      details: (
        <div className="font-mono text-xs text-[#E9BCB9] bg-[rgba(11,13,27,0.70)] p-3 rounded-xl border border-[rgba(34,197,94,0.35)] space-y-1">
          <p className="text-[#22c55e] font-bold flex items-center gap-1">
            <CheckCircle2 size={13} /> Upgrade Recommended: log4j-core 2.14.1 → 2.17.1
          </p>
          <p className="text-[11px] text-[#A34054]">CVSS score resolved from 10.0 to 0.0. All 5 ADTG signals green.</p>
        </div>
      )
    },
    {
      id: 8,
      title: 'Stage 8 — Automated GitHub Pull Request Generated',
      subtitle: 'ThreatMesh generates automated zero-touch security remediation PR',
      icon: GitPullRequest,
      color: '#22c55e',
      badge: 'REMEDIATION',
      timestamp: '00:04.200',
      details: (
        <div className="p-3.5 bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.35)] rounded-xl text-xs font-mono text-[#22c55e] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1">
              <GitPullRequest size={14} /> Pull Request #1 Created
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.20)] text-[#22c55e] font-bold">CLOSED THREAT</span>
          </div>
          <a
            href="https://github.com/Vansh-7758/NULLSTOP_ThreatMeshAI/pull/1"
            target="_blank"
            rel="noreferrer"
            className="text-white underline hover:text-[#ED9E58] block truncate font-bold flex items-center gap-1"
          >
            [Security Auto-Patch] Upgrade log4j-core to 2.17.1 <ExternalLink size={12} />
          </a>
        </div>
      )
    }
  ];

  return (
    <div className="glass-card p-6 lg:p-8 space-y-6 relative overflow-hidden">
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #ED9E58, #9A5FFD, transparent)' }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(163,64,84,0.15)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(237,158,88,0.12)] text-[#ED9E58] border border-[rgba(237,158,88,0.30)]">
              FEATURE 6
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="text-[#ED9E58]" size={20} /> ATTACK REPLAY TIMELINE
            </h2>
          </div>
          <p className="text-xs text-[#A34054]">
            Visual 8-stage step-by-step animated sequence tracing supply chain attack detection from developer commit to automated PR fix.
          </p>
        </div>

        <button
          onClick={handleStartReplay}
          className="btn-primary-brand text-xs font-bold gap-2 shrink-0"
        >
          {isPlaying ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} className="fill-current" />}
          {isPlaying ? 'Playing Sequence...' : currentStage > 0 ? 'Replay Timeline' : 'Play Attack Replay'}
        </button>
      </div>

      {/* Timeline Steps Layout */}
      <div className="space-y-3.5">
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
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'bg-[rgba(237,158,88,0.08)] border-[rgba(237,158,88,0.40)] shadow-[0_0_24px_rgba(237,158,88,0.12)]'
                  : isPassed
                  ? 'bg-[rgba(27,25,49,0.70)] border-[rgba(163,64,84,0.18)]'
                  : 'bg-[rgba(11,13,27,0.50)] border-[rgba(163,64,84,0.10)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-[rgba(237,158,88,0.20)] border-[#ED9E58] text-[#ED9E58] animate-pulse' : 'bg-[rgba(27,25,49,0.80)] border-[rgba(163,64,84,0.25)] text-[#A34054]'
                  }`}>
                    <Icon size={18} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                        {stage.title}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(237,158,88,0.12)] text-[#ED9E58] border border-[rgba(237,158,88,0.25)]">
                        {stage.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#A34054] mt-0.5">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-[#A34054] shrink-0 font-bold">
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
