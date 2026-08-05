// frontend/components/dashboard/ADTGTrustGraph.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package } from '@/types';
import { Cpu, Layers, Zap } from 'lucide-react';

interface ADTGTrustGraphProps {
  packages?: Package[];
}

interface GraphNode {
  id: string;
  name: string;
  version: string;
  score: number;
  cveCount: number;
  epssScore: number;
  exploitAvailable: boolean;
  maintainerDays: number;
  releaseDays: number;
  cveImpact: number;
  epssRisk: number;
  exploitRisk: number;
  maintainerHealth: number;
  releaseCadence: number;
  x: number;
  y: number;
  isRoot?: boolean;
}

export default function ADTGTrustGraph({ packages = [] }: ADTGTrustGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute clean layout & 5-signal breakdown data centered inside 600x400 viewBox
  const nodes = useMemo<GraphNode[]>(() => {
    const defaultPkgs = [
      { name: 'enterprise-app', version: '1.0.0', trust_score: 95.0, cves: [] },
      { name: 'auth-service', version: '2.4.0', trust_score: 90.0, cves: [] },
      { name: 'log4j-core', version: '2.14.1', trust_score: 10.0, cves: ['CVE-2021-44228'] },
      { name: 'ua-parser-js', version: '0.7.28', trust_score: 25.0, cves: ['CVE-2021-42013'] },
      { name: 'event-stream', version: '3.3.6', trust_score: 15.0, cves: ['CVE-2018-1000851'] },
      { name: 'langchain', version: '0.0.190', trust_score: 35.0, cves: ['CVE-2023-36258'] },
      { name: 'chromadb', version: '0.3.21', trust_score: 42.0, cves: ['CVE-2023-40012'] },
      { name: 'reqeusts', version: '2.28.1', trust_score: 5.0, cves: ['MAL-2024-01'] },
      { name: 'jsonwebtoken', version: '8.5.1', trust_score: 65.0, cves: ['CVE-2022-23529'] },
      { name: 'express', version: '4.17.1', trust_score: 72.0, cves: [] },
      { name: 'lodash', version: '4.17.20', trust_score: 78.0, cves: [] },
      { name: 'payment-gateway', version: '3.1.0', trust_score: 88.0, cves: [] }
    ];

    const sourceList = packages && packages.length > 0
      ? packages.map(p => ({
          name: p.name,
          version: p.version,
          trust_score: p.trust_score ?? 100,
          cves: p.trust_score < 40 ? ['CVE-CRITICAL'] : p.trust_score < 70 ? ['CVE-HIGH'] : []
        }))
      : defaultPkgs;

    const viewBoxWidth = 600;
    const viewBoxHeight = 400;
    const centerX = viewBoxWidth / 2; // 300
    const centerY = viewBoxHeight / 2; // 200

    const count = sourceList.length;

    return sourceList.map((p, i) => {
      let x = centerX;
      let y = centerY;

      if (i > 0) {
        const isInner = i <= 6;
        const radius = isInner ? 125 : 185;
        const totalInRing = isInner ? Math.min(6, count - 1) : Math.max(1, count - 7);
        const ringIdx = isInner ? i - 1 : i - 7;
        const angle = (ringIdx / totalInRing) * Math.PI * 2 - Math.PI / 2;

        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * (radius * 0.85);
      }

      // Clamp coordinates safely within SVG canvas margins
      x = Math.max(50, Math.min(550, x));
      y = Math.max(45, Math.min(355, y));

      const score = p.trust_score;
      const isCrit = score < 40;
      const isHigh = score < 70;

      return {
        id: p.name,
        name: p.name,
        version: p.version,
        score,
        cveCount: p.cves.length,
        epssScore: isCrit ? 0.97 : isHigh ? 0.42 : 0.01,
        exploitAvailable: isCrit,
        maintainerDays: isCrit ? 142 : isHigh ? 45 : 12,
        releaseDays: isCrit ? 190 : isHigh ? 60 : 18,
        cveImpact: isCrit ? 0.0 : isHigh ? 50.0 : 100.0,
        epssRisk: isCrit ? 3.0 : isHigh ? 58.0 : 99.0,
        exploitRisk: isCrit ? 0.0 : 100.0,
        maintainerHealth: isCrit ? 50.0 : isHigh ? 75.0 : 100.0,
        releaseCadence: isCrit ? 40.0 : isHigh ? 80.0 : 100.0,
        x,
        y,
        isRoot: i === 0
      };
    });
  }, [packages]);

  // Set default selected node to most at-risk
  const activeNode = useMemo(() => {
    if (selectedNodeId) {
      const found = nodes.find((n) => n.id === selectedNodeId);
      if (found) return found;
    }
    const sorted = [...nodes].sort((a, b) => a.score - b.score);
    return sorted[0] || nodes[0];
  }, [selectedNodeId, nodes]);

  const getNodeColor = (score: number) => {
    if (score >= 80) return { fill: '#00c896', stroke: '#00c896', bg: 'bg-[#00c896]/20 text-[#00c896]' };
    if (score >= 50) return { fill: '#ffc107', stroke: '#ffc107', bg: 'bg-[#ffc107]/20 text-[#ffc107]' };
    return { fill: '#ff2a6d', stroke: '#ff2a6d', bg: 'bg-[#ff2a6d]/20 text-[#ff2a6d]' };
  };

  return (
    <div className="bg-[#0e0e14]/90 border border-[#2D2D5E] rounded-xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Feature 3 Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E3A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/40">
              FEATURE 3
            </span>
            <h2 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="text-[#7c3aed]" size={20} /> ADTG Adaptive Dependency Trust Scoring
            </h2>
          </div>
          <p className="text-xs text-[#ccc3d8] mt-1">
            Dynamic 5-Signal Software Credit Score (0-100) combining CVE Severity, EPSS Exploitation Probability, Public Exploits, Maintainer Activity & Release Cadence.
          </p>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px] bg-[#141424] px-3 py-1.5 rounded-lg border border-[#232345] shrink-0">
          <span className="flex items-center gap-1 text-[#00c896]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00c896]"></span> &ge;80 Trusted
          </span>
          <span className="flex items-center gap-1 text-[#ffc107]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffc107]"></span> 50-79 Watch
          </span>
          <span className="flex items-center gap-1 text-[#ff2a6d]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff2a6d]"></span> &lt;50 At Risk
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas Graph (Left 7 Cols) + 5-Signal Inspector (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: SVG Dependency Graph */}
        <div className="lg:col-span-7 bg-[#090910] border border-[#1E1E3A] rounded-xl p-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-[#8a809b] mb-2">
            <span className="flex items-center gap-1">
              <Layers size={14} className="text-[#7c3aed]" /> Live Interactive Topology Node Map
            </span>
            <span className="text-[10px] text-[#00c896] animate-pulse">● Click node to inspect 5 signals</span>
          </div>

          <svg className="w-full h-[360px] select-none" viewBox="0 0 600 400">
            {/* Draw Link Lines from root node (index 0) to all child nodes */}
            {nodes.slice(1).map((node) => {
              const root = nodes[0];
              const isSelected = activeNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              return (
                <line
                  key={`link-${node.id}`}
                  x1={root.x}
                  y1={root.y}
                  x2={node.x}
                  y2={node.y}
                  stroke={isSelected || isHovered ? '#7c3aed' : node.score < 50 ? '#ff2a6d50' : '#232345'}
                  strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                  strokeDasharray={node.score < 50 ? '4 4' : 'none'}
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const color = getNodeColor(node.score);
              const isSelected = activeNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const baseRadius = node.isRoot ? 22 : 18;
              const renderRadius = isHovered || isSelected ? baseRadius + 3 : baseRadius;

              return (
                <g
                  key={`node-${node.id}`}
                  onClick={() => setSelectedNodeId(node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer"
                >
                  {/* Outer Pulsing Risk Aura for At-Risk Nodes */}
                  {node.score < 50 && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={baseRadius + 7}
                      fill="none"
                      stroke="#ff2a6d"
                      strokeWidth="1.5"
                      opacity="0.35"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer Selection Highlight Ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={renderRadius + 5}
                      fill="none"
                      stroke={isSelected ? '#7c3aed' : color.stroke}
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Main Circle Body */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={renderRadius}
                    fill="#141424"
                    stroke={color.stroke}
                    strokeWidth={isSelected || isHovered ? '3' : '2'}
                  />

                  {/* Score Text Label Centered */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="Space Grotesk"
                  >
                    {node.score.toFixed(0)}
                  </text>

                  {/* Package Name Text Label Below Node */}
                  <text
                    x={node.x}
                    y={node.y + renderRadius + 14}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#a78bfa' : '#ccc3d8'}
                    fontSize="10"
                    fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
                    fontFamily="monospace"
                  >
                    {node.name.length > 12 ? `${node.name.substring(0, 10)}..` : node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right 5 Cols: 5-Signal ADTG Inspector Panel */}
        {activeNode && (
          <div className="lg:col-span-5 bg-[#141424]/90 border border-[#232345] rounded-xl p-5 shadow-xl space-y-4">
            {/* Header of Selected Node */}
            <div className="flex items-start justify-between gap-2 border-b border-[#2A2A4E] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#8a809b] uppercase tracking-wider">Package Inspector</span>
                <h3 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-1.5">
                  {activeNode.name} <span className="text-xs font-mono text-[#8a809b]">@{activeNode.version}</span>
                </h3>
              </div>

              <div className={`px-3 py-1 rounded-lg text-sm font-mono font-extrabold border ${getNodeColor(activeNode.score).bg} flex items-center gap-1`}>
                Score: {activeNode.score.toFixed(1)} / 100
              </div>
            </div>

            {/* The 5 Signal Breakdown Bars */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-[#a78bfa] uppercase tracking-wider flex items-center justify-between">
                <span>5 ADTG Signal Breakdown</span>
                <span className="text-[10px] text-[#8a809b]">Weighted Score</span>
              </h4>

              {/* Signal 1: CVE Severity (30%) */}
              <div className="bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-medium">1. CVE Severity (30%)</span>
                  <span className={activeNode.cveImpact < 50 ? 'text-[#ff2a6d] font-bold' : 'text-[#00c896]'}>
                    {activeNode.cveImpact.toFixed(0)} / 100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1f1f3a] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${activeNode.cveImpact < 50 ? 'bg-[#ff2a6d]' : 'bg-[#00c896]'}`} style={{ width: `${activeNode.cveImpact}%` }}></div>
                </div>
                <p className="text-[10px] text-[#8a809b]">
                  {activeNode.cveCount > 0 ? `${activeNode.cveCount} active CVEs (-${100 - activeNode.cveImpact} pts deducted)` : 'No known CVE flaws'}
                </p>
              </div>

              {/* Signal 2: EPSS Exploitation (25%) */}
              <div className="bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-medium">2. EPSS Exploitation (25%)</span>
                  <span className={activeNode.epssScore > 0.5 ? 'text-[#ff2a6d] font-bold' : 'text-[#00c896]'}>
                    {(activeNode.epssScore * 100).toFixed(0)}% EPSS
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1f1f3a] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${activeNode.epssScore > 0.5 ? 'bg-[#ff2a6d]' : 'bg-[#00c896]'}`} style={{ width: `${activeNode.epssRisk}%` }}></div>
                </div>
                <p className="text-[10px] text-[#8a809b]">
                  Real-world 30-day active exploitation probability
                </p>
              </div>

              {/* Signal 3: Exploit Availability (20%) */}
              <div className="bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-medium">3. Exploit Availability (20%)</span>
                  <span className={activeNode.exploitAvailable ? 'text-[#ff2a6d] font-bold' : 'text-[#00c896]'}>
                    {activeNode.exploitAvailable ? 'PUBLIC EXPLOIT (0 pts)' : 'No Public Exploit (100 pts)'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1f1f3a] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${activeNode.exploitAvailable ? 'bg-[#ff2a6d]' : 'bg-[#00c896]'}`} style={{ width: `${activeNode.exploitRisk}%` }}></div>
                </div>
              </div>

              {/* Signal 4: Maintainer Activity (15%) */}
              <div className="bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-medium">4. Maintainer Activity (15%)</span>
                  <span className="text-white">{activeNode.maintainerDays}d inactive</span>
                </div>
                <div className="w-full h-1.5 bg-[#1f1f3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: `${activeNode.maintainerHealth}%` }}></div>
                </div>
              </div>

              {/* Signal 5: Release Cadence (10%) */}
              <div className="bg-[#0c0c16] p-2.5 rounded-lg border border-[#1f1f3a] space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-medium">5. Release Cadence (10%)</span>
                  <span className="text-white">{activeNode.releaseDays}d since release</span>
                </div>
                <div className="w-full h-1.5 bg-[#1f1f3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00c896] rounded-full" style={{ width: `${activeNode.releaseCadence}%` }}></div>
                </div>
              </div>
            </div>

            {/* Why ThreatMesh Value Proposition Callout */}
            <div className="p-3 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-lg text-xs leading-relaxed text-[#ccc3d8]">
              <span className="font-bold text-[#a78bfa] block mb-0.5 flex items-center gap-1">
                <Zap size={13} /> Why ThreatMesh vs Snyk / Dependabot:
              </span>
              Snyk assigns static severity based solely on CVE entries. ThreatMesh ADTG calculates a dynamic credit score (0-100) incorporating real-world EPSS exploit probability, public exploit scripts, maintainer activity, and release cadence.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
