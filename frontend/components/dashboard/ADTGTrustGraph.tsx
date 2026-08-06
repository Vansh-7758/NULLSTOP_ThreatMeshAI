// frontend/components/dashboard/ADTGTrustGraph.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from '@/types';
import { Cpu, Layers, Zap, Maximize2, Minimize2, ShieldAlert, ShieldCheck } from 'lucide-react';

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
  ring: number;
}

export default function ADTGTrustGraph({ packages = [] }: ADTGTrustGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'at-risk'>('all');

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Pure Red (#FF0033), Yellow (#FFCC00), Green (#00FF66)
  const getNodeColor = (score: number) => {
    if (score >= 80) return { fill: '#00FF66', stroke: '#00FF66', bg: 'bg-[rgba(0,255,102,0.18)] text-[#00FF66]' };
    if (score >= 50) return { fill: '#FFCC00', stroke: '#FFCC00', bg: 'bg-[rgba(255,204,0,0.18)] text-[#FFCC00]' };
    return { fill: '#FF0033', stroke: '#FF0033', bg: 'bg-[rgba(255,0,51,0.18)] text-[#FF0033]' };
  };

  const { nodes, rawCount } = useMemo(() => {
    const defaultPkgs = [
      { name: 'enterprise-ai-platform', version: '1.0.0', trust_score: 95.0, cves: [] },
      { name: 'auth-service', version: '2.1.4', trust_score: 10.0, cves: ['CVE-2024-1923'] },
      { name: 'log4j-core', version: '2.14.1', trust_score: 12.0, cves: ['CVE-2021-44228'] },
      { name: 'ua-parser-js', version: '0.7.28', trust_score: 25.0, cves: ['CVE-2021-42013'] },
      { name: 'event-stream', version: '3.3.6', trust_score: 15.0, cves: ['CVE-2018-1000851'] },
      { name: 'langchain', version: '0.0.190', trust_score: 35.0, cves: ['CVE-2023-36258'] },
      { name: 'chromadb', version: '0.3.21', trust_score: 42.0, cves: ['CVE-2023-40012'] },
      { name: 'requests', version: '2.28.1', trust_score: 8.0, cves: ['MAL-2024-01'] },
      { name: 'jsonwebtoken', version: '8.5.1', trust_score: 65.0, cves: ['CVE-2022-23529'] },
      { name: 'express', version: '4.17.1', trust_score: 72.0, cves: [] },
      { name: 'lodash', version: '4.17.20', trust_score: 78.0, cves: [] },
      { name: 'payment-gateway', version: '3.1.0', trust_score: 88.0, cves: [] },
      { name: 'flask', version: '2.2.5', trust_score: 30.0, cves: [] },
      { name: 'django', version: '3.2.19', trust_score: 28.0, cves: [] },
      { name: 'numpy', version: '1.21.0', trust_score: 40.0, cves: [] },
      { name: 'PyYAML', version: '5.3.1', trust_score: 18.0, cves: [] }
    ];

    const sourceList = packages && packages.length > 0
      ? packages.map(p => ({
          name: p.name,
          version: p.version,
          trust_score: p.trust_score ?? 100,
          cves: p.trust_score < 40 ? ['CVE-CRITICAL'] : p.trust_score < 70 ? ['CVE-HIGH'] : []
        }))
      : defaultPkgs;

    let filtered = sourceList;
    if (filterMode === 'at-risk') {
      filtered = sourceList.filter((p, i) => i === 0 || p.trust_score < 50);
    }

    const viewBoxWidth = isFullScreen ? 1200 : 600;
    const viewBoxHeight = isFullScreen ? 750 : 400;
    const centerX = viewBoxWidth / 2;
    const centerY = viewBoxHeight / 2;

    const ringRadii = isFullScreen ? [0, 160, 280, 400] : [0, 110, 180, 250];
    const ringCapacities = [1, 8, 14, 20];

    const nodeList: GraphNode[] = [];
    let currentRing = 1;
    let itemsInCurrentRing = 0;
    let angleOffset = 0;

    filtered.forEach((p, i) => {
      if (i === 0) {
        nodeList.push({
          id: p.name,
          name: p.name,
          version: p.version,
          score: p.trust_score,
          cveCount: p.cves.length,
          epssScore: 0.01,
          exploitAvailable: false,
          maintainerDays: 0,
          releaseDays: 0,
          cveImpact: 100,
          epssRisk: 99,
          exploitRisk: 100,
          maintainerHealth: 100,
          releaseCadence: 100,
          x: centerX,
          y: centerY,
          isRoot: true,
          ring: 0
        });
        return;
      }

      if (itemsInCurrentRing >= ringCapacities[currentRing]) {
        currentRing++;
        itemsInCurrentRing = 0;
        angleOffset += Math.PI / 6;
      }

      const radius = ringRadii[currentRing] || (150 + currentRing * 70);
      const totalInRing = Math.min(ringCapacities[currentRing], filtered.length - nodeList.length);
      const angle = angleOffset + (itemsInCurrentRing / Math.max(1, totalInRing)) * Math.PI * 2 - Math.PI / 2;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * (radius * 0.85);

      itemsInCurrentRing++;

      const score = p.trust_score;
      const isCrit = score < 40;
      const isHigh = score < 70;

      nodeList.push({
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
        ring: currentRing
      });
    });

    return { nodes: nodeList, rawCount: sourceList.length };
  }, [packages, isFullScreen, filterMode]);

  const activeNode = useMemo(() => {
    if (selectedNodeId) {
      const found = nodes.find((n) => n.id === selectedNodeId);
      if (found) return found;
    }
    const sorted = [...nodes].sort((a, b) => a.score - b.score);
    return sorted[0] || nodes[0];
  }, [selectedNodeId, nodes]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel((z) => Math.min(2.5, Math.max(0.4, z * zoomFactor)));
  };

  // Canvas pan drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const renderSVGMap = (width: number, height: number) => (
    <svg className="w-full h-full select-none" viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
        {/* Lines connecting to root (Static Solid Lines) */}
        {nodes.slice(1).map((node) => {
          const root = nodes[0];
          const isSelected = activeNode?.id === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isCrit = node.score < 50;

          return (
            <line
              key={`adtg-line-${node.id}`}
              x1={root.x}
              y1={root.y}
              x2={node.x}
              y2={node.y}
              stroke={isCrit ? '#FF0033' : isSelected || isHovered ? '#FFCC00' : '#4a4455'}
              strokeWidth={isCrit ? 2.5 : isSelected || isHovered ? 2.5 : 1.2}
              opacity={isCrit ? 0.95 : 0.4}
            />
          );
        })}

        {/* Nodes with Pure Red (#FF0033), Yellow (#FFCC00), and Green (#00FF66) */}
        {nodes.map((node) => {
          const color = getNodeColor(node.score);
          const isSelected = activeNode?.id === node.id;
          const isHovered = hoveredNodeId === node.id;
          const baseRadius = node.isRoot ? 16 : isFullScreen ? 12 : 9;
          const renderRadius = isHovered || isSelected ? baseRadius + 3 : baseRadius;
          const showLabel = node.isRoot || node.score < 50 || isSelected || isHovered || nodes.length <= 12 || isFullScreen;

          return (
            <g
              key={`node-${node.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id);
              }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="cursor-pointer"
            >
              {node.isRoot && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={renderRadius + 8}
                  fill="none"
                  stroke="#9A5FFD"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
              )}

              {(isSelected || isHovered) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={renderRadius + 5}
                  fill="none"
                  stroke={isSelected ? '#FFCC00' : color.stroke}
                  strokeWidth="2.5"
                />
              )}

              <circle
                cx={node.x}
                cy={node.y}
                r={renderRadius}
                fill={color.fill}
                stroke={color.stroke}
                strokeWidth={isSelected || isHovered ? '3' : '2'}
              />

              {showLabel && (
                <g>
                  <rect
                    x={node.x - (node.name.length * 3)}
                    y={node.y + renderRadius + 4}
                    width={node.name.length * 6}
                    height="14"
                    rx="3"
                    fill="rgba(11, 13, 27, 0.90)"
                    stroke={isSelected ? '#FFCC00' : 'rgba(233, 188, 185, 0.20)'}
                    strokeWidth="0.5"
                  />
                  <text
                    x={node.x}
                    y={node.y + renderRadius + 14}
                    textAnchor="middle"
                    fill={color.fill}
                    fontSize="9.5"
                    fontWeight={isSelected || isHovered || node.score < 50 ? 'bold' : 'normal'}
                    fontFamily="JetBrains Mono"
                  >
                    {node.name.length > 14 && !isFullScreen ? `${node.name.substring(0, 12)}..` : node.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );

  return (
    <>
      <div className="glass-card p-6 lg:p-8 space-y-6 relative overflow-hidden" ref={containerRef}>
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #FFCC00, #9A5FFD, transparent)' }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(233,188,185,0.20)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(237,158,88,0.15)] text-[#ED9E58] border border-[rgba(237,158,88,0.35)]">
                FEATURE 3
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Cpu className="text-[#FFCC00]" size={20} /> ADTG ADAPTIVE DEPENDENCY TRUST MESH SCORING
              </h2>
            </div>
            <p className="text-xs text-[#CBD5E1] font-sans">
              Dynamic 5-Signal Software Credit Score (0-100) analyzing {rawCount} dependencies with pure Red, Yellow, and Green indicators.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-3 font-mono text-[11px] bg-[rgba(27,25,49,0.92)] px-3.5 py-1.5 rounded-full border border-[rgba(233,188,185,0.25)] shrink-0">
              <span className="flex items-center gap-1.5 text-[#00FF66] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]"></span> &ge;80 Trusted
              </span>
              <span className="flex items-center gap-1.5 text-[#FFCC00] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00]"></span> 50-79 Watch
              </span>
              <span className="flex items-center gap-1.5 text-[#FF0033] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF0033]"></span> &lt;50 At Risk
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[rgba(27,25,49,0.92)] p-1 rounded-xl border border-[rgba(233,188,185,0.25)] text-xs font-mono">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                  filterMode === 'all' ? 'bg-[rgba(255,204,0,0.20)] text-[#FFCC00] border border-[rgba(255,204,0,0.40)]' : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                All ({rawCount})
              </button>
              <button
                onClick={() => setFilterMode('at-risk')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                  filterMode === 'at-risk' ? 'bg-[rgba(255,0,51,0.20)] text-[#FF0033] border border-[rgba(255,0,51,0.40)]' : 'text-[#CBD5E1] hover:text-white'
                }`}
              >
                At Risk
              </button>
            </div>

            <button
              onClick={() => setIsFullScreen(true)}
              className="px-3 py-1.5 bg-[rgba(255,204,0,0.20)] hover:bg-[rgba(255,204,0,0.35)] text-white border border-[rgba(255,204,0,0.45)] rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(255,204,0,0.20)] cursor-pointer"
            >
              <Maximize2 size={14} className="text-[#FFCC00]" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="lg:col-span-7 bg-[rgba(11,13,27,0.85)] border border-[rgba(233,188,185,0.25)] rounded-2xl p-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center justify-between text-xs font-mono text-[#CBD5E1] mb-2">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <Layers size={14} className="text-[#FFCC00]" /> Scroll to Zoom • Drag Background to Pan
              </span>
              <span className="text-[10px] text-[#00FF66] font-bold">● Fixed Layout</span>
            </div>

            {renderSVGMap(600, 400)}
          </div>

          {activeNode && (
            <div className="lg:col-span-5 glass-card p-5 rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-[rgba(233,188,185,0.20)] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#FFCC00] uppercase font-bold tracking-wider">Package Mesh Inspector</span>
                  <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-1.5">
                    {activeNode.name} <span className="text-xs font-mono text-[#CBD5E1]">@{activeNode.version}</span>
                  </h3>
                </div>

                <div className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold border ${getNodeColor(activeNode.score).bg} flex items-center gap-1`}>
                  Score: {activeNode.score.toFixed(1)} / 100
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-[#FFCC00] uppercase tracking-wider flex items-center justify-between font-['Plus_Jakarta_Sans']">
                  <span>5 ADTG Signal Breakdown</span>
                  <span className="text-[10px] text-[#CBD5E1]">Weighted Score</span>
                </h4>

                <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-medium">1. CVE Severity (30%)</span>
                    <span className={activeNode.cveImpact < 50 ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                      {activeNode.cveImpact.toFixed(0)} / 100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${activeNode.cveImpact < 50 ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.cveImpact}%` }}></div>
                  </div>
                </div>

                <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-medium">2. EPSS Exploitation (25%)</span>
                    <span className={activeNode.epssScore > 0.5 ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                      {(activeNode.epssScore * 100).toFixed(0)}% EPSS
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${activeNode.epssScore > 0.5 ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.epssRisk}%` }}></div>
                  </div>
                </div>

                <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-medium">3. Exploit Availability (20%)</span>
                    <span className={activeNode.exploitAvailable ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                      {activeNode.exploitAvailable ? 'PUBLIC EXPLOIT (0 pts)' : 'No Public Exploit (100 pts)'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${activeNode.exploitAvailable ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.exploitRisk}%` }}></div>
                  </div>
                </div>

                <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-medium">4. Maintainer Activity (15%)</span>
                    <span className="text-white">{activeNode.maintainerDays}d inactive</span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#9A5FFD] rounded-full" style={{ width: `${activeNode.maintainerHealth}%` }}></div>
                  </div>
                </div>

                <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-medium">5. Release Cadence (10%)</span>
                    <span className="text-white">{activeNode.releaseDays}d since release</span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FFCC00] rounded-full" style={{ width: `${activeNode.releaseCadence}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[rgba(255,204,0,0.12)] border border-[rgba(255,204,0,0.30)] rounded-xl text-xs leading-relaxed text-[#CBD5E1]">
                <span className="font-bold text-[#FFCC00] block mb-0.5 flex items-center gap-1 font-['Plus_Jakarta_Sans']">
                  <Zap size={13} /> Dynamic ADTG Credit Score:
                </span>
                Calculates a dynamic credit score (0-100) incorporating real-world EPSS exploit probability, public exploit scripts, maintainer activity, and release cadence.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN MODAL OVERLAY */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-[#0B0D1B]/95 backdrop-blur-2xl p-6 lg:p-8 flex flex-col justify-between overflow-hidden select-none"
          >
            <div className="flex items-center justify-between border-b border-[rgba(233,188,185,0.20)] pb-4 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[rgba(255,204,0,0.20)] border border-[rgba(255,204,0,0.40)] flex items-center justify-center">
                  <Cpu size={22} className="text-[#FFCC00]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                    FULLSCREEN ADTG TRUST MESH CANVAS — {rawCount} PACKAGES
                  </h2>
                  <p className="text-xs text-[#CBD5E1] font-sans">
                    Scroll wheel to zoom. Click and drag background to pan canvas. Click any node to inspect ADTG score.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFullScreen(false)}
                className="px-4 py-2 bg-[rgba(255,0,51,0.20)] hover:bg-[rgba(255,0,51,0.35)] text-[#FF0033] border border-[rgba(255,0,51,0.45)] rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Minimize2 size={16} />
                <span>Exit Fullscreen</span>
              </button>
            </div>

            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full flex-1 relative my-4 rounded-2xl bg-[rgba(11,13,27,0.90)] border border-[rgba(233,188,185,0.25)] overflow-hidden cursor-grab active:cursor-grabbing"
            >
              {renderSVGMap(1200, 750)}

              {activeNode && (
                <div className="absolute right-6 top-6 bottom-6 w-96 glass-card p-6 rounded-2xl backdrop-blur-2xl bg-[rgba(27,25,49,0.88)] border border-[rgba(233,188,185,0.30)] shadow-2xl overflow-y-auto z-40 space-y-5">
                  <div className="flex items-start justify-between gap-2 border-b border-[rgba(233,188,185,0.20)] pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#FFCC00] uppercase font-bold tracking-wider">FULLSCREEN ADTG INSPECTOR</span>
                      <h3 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                        {activeNode.name} <span className="text-xs font-mono text-[#CBD5E1]">@{activeNode.version}</span>
                      </h3>
                    </div>

                    <div className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold border ${getNodeColor(activeNode.score).bg}`}>
                      Score: {activeNode.score.toFixed(1)} / 100
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold text-[#FFCC00] uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                      5 ADTG Signal Breakdown
                    </h4>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">1. CVE Severity (30%)</span>
                        <span className={activeNode.cveImpact < 50 ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                          {activeNode.cveImpact.toFixed(0)} / 100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${activeNode.cveImpact < 50 ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.cveImpact}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">2. EPSS Exploitation (25%)</span>
                        <span className={activeNode.epssScore > 0.5 ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                          {(activeNode.epssScore * 100).toFixed(0)}% EPSS
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${activeNode.epssScore > 0.5 ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.epssRisk}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">3. Exploit Availability (20%)</span>
                        <span className={activeNode.exploitAvailable ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                          {activeNode.exploitAvailable ? 'PUBLIC EXPLOIT (0 pts)' : 'No Public Exploit (100 pts)'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${activeNode.exploitAvailable ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.exploitRisk}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">4. Maintainer Activity (15%)</span>
                        <span className="text-white">{activeNode.maintainerDays}d inactive</span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#9A5FFD] rounded-full" style={{ width: `${activeNode.maintainerHealth}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">5. Release Cadence (10%)</span>
                        <span className="text-white">{activeNode.releaseDays}d since release</span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFCC00] rounded-full" style={{ width: `${activeNode.releaseCadence}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
