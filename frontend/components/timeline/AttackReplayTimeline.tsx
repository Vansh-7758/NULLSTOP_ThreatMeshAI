// frontend/components/timeline/AttackReplayTimeline.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  GitCommit,
  FileSearch,
  DownloadCloud,
  TrendingDown,
  GitBranch,
  Users,
  ShieldCheck,
  GitPullRequest,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';

interface ScanDataSummary {
  cve_count?: number;
  at_risk_count?: number;
  lowest_trust_score?: number;
  target_package?: string;
  pr_url?: string;
}

interface AttackReplayTimelineProps {
  scanData?: ScanDataSummary;
  autoPlay?: boolean;
  onStageChange?: (stageIndex: number) => void;
}

export default function AttackReplayTimeline({
  scanData = {},
  autoPlay = true,
  onStageChange
}: AttackReplayTimelineProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentActiveStage, setCurrentActiveStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const stages = [
    {
      id: 1,
      title: 'Developer Commits Code',
      icon: GitCommit,
      category: 'process',
      color: '#3B82F6',
      description: 'Feature commit pushed to repository triggering automated pipeline.'
    },
    {
      id: 2,
      title: 'SBOM Diffed & Parsed',
      icon: FileSearch,
      category: 'process',
      color: '#3B82F6',
      description: 'CycloneDX SBOM parsed and 15 components mapped into Neo4j graph.'
    },
    {
      id: 3,
      title: 'Threat Intel Ingested',
      icon: DownloadCloud,
      category: 'threat',
      color: '#E84040',
      description: `NVD, OSV, and GHSA feeds queried. Found ${scanData.cve_count || 12} active vulnerabilities.`
    },
    {
      id: 4,
      title: 'Trust Score Degraded',
      icon: TrendingDown,
      category: 'threat',
      color: '#E84040',
      description: `ADTG 5-factor formula calculated score drop to ${scanData.lowest_trust_score || 22}/100.`
    },
    {
      id: 5,
      title: 'Attack Path Discovered',
      icon: GitBranch,
      category: 'threat',
      color: '#E84040',
      description: `Cypher reachability analysis found 3-hop attack vector to ${scanData.target_package || 'log4j-core'}.`
    },
    {
      id: 6,
      title: 'AI Council Convened',
      icon: Users,
      category: 'process',
      color: '#3B82F6',
      description: '8 specialized LLM agents collaborated on threat reasoning & compliance.'
    },
    {
      id: 7,
      title: 'Safe Patch Identified',
      icon: ShieldCheck,
      category: 'resolution',
      color: '#00C896',
      description: 'Patch Agent verified non-breaking upgrade target version.'
    },
    {
      id: 8,
      title: 'GitHub PR Generated',
      icon: GitPullRequest,
      category: 'resolution',
      color: '#00C896',
      description: scanData.pr_url
        ? `Remediation PR created automatically on GitHub.`
        : 'Automated remediation PR generated for security patch.'
    }
  ];

  const playTimeline = useCallback(() => {
    setIsPlaying(true);
    setCurrentActiveStage(1);

    let stage = 1;
    const interval = setInterval(() => {
      stage += 1;
      if (stage > 8) {
        clearInterval(interval);
        setIsPlaying(false);
      } else {
        setCurrentActiveStage(stage);
        if (onStageChange) onStageChange(stage);
      }
    }, 600);
  }, [onStageChange]);

  useEffect(() => {
    if (autoPlay) {
      playTimeline();
    } else {
      setCurrentActiveStage(8);
    }
  }, [autoPlay, playTimeline]);

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 w-full shadow-sm">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#E6EDF3]">Attack Vector Replay Timeline</h3>
          <p className="text-xs text-[#8B949E]">Automated 8-stage incident detection and remediation sequence</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#8B949E] bg-[#0D1117] px-3 py-1 rounded-lg border border-[#30363D]">
            Stage <strong className="text-[#E6EDF3]">{currentActiveStage}</strong> of 8
          </span>
          <button
            disabled={isPlaying}
            onClick={playTimeline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            {isPlaying ? (
              <>
                <RotateCcw size={14} className="animate-spin" /> Playing...
              </>
            ) : (
              <>
                <Play size={14} /> Replay Timeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Stage Sequence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 relative">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = stage.id <= currentActiveStage;
          const isCurrent = stage.id === currentActiveStage;

          return (
            <motion.div
              key={stage.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stage.id * 0.05 }}
              className={`bg-[#0D1117] border rounded-xl p-3 flex flex-col justify-between transition-all duration-300 relative ${
                isActive
                  ? `border-[${stage.color}] shadow-md shadow-[${stage.color}]/10`
                  : 'border-[#30363D]/50 opacity-40'
              } ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#161B22]' : ''}`}
              style={{
                borderColor: isActive ? stage.color : '#30363D'
              }}
            >
              <div>
                {/* Top Icon Circle */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isActive ? stage.color : '#30363D',
                      color: isActive ? '#0D1117' : '#8B949E'
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  {isActive && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0D1117]"
                      style={{ backgroundColor: stage.color }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Stage Title */}
                <span className="text-[10px] font-mono text-[#8B949E] uppercase font-bold block mb-0.5">
                  Stage 0{stage.id}
                </span>
                <h4 className="text-xs font-bold text-[#E6EDF3] leading-snug mb-1.5">{stage.title}</h4>

                {/* Description */}
                <p className="text-[11px] text-[#8B949E] leading-relaxed line-clamp-3">{stage.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
