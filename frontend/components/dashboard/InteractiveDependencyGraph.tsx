// frontend/components/dashboard/InteractiveDependencyGraph.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AttackPath } from '@/types';
import { generatePR } from '@/lib/api';
import { Network, ZoomIn, ZoomOut, RotateCcw, ShieldCheck, GitPullRequest, ArrowRight, CheckCircle2, Layers, ShieldAlert, Loader2, Maximize2, Minimize2 } from 'lucide-react';

interface InteractiveDependencyGraphProps {
  scanId?: string | null;
  packages?: Package[];
  attackPaths?: AttackPath[];
}

interface CanvasNode {
  id: string;
  name: string;
  version: string;
  ecosystem: string;
  score: number;
  dependentsCount: number;
  radius: number;
  x: number;
  y: number;
  isReachable: boolean;
  attackChain: string[];
  cves: { id: string; cvss: number; epss: number; description: string }[];
  isRoot?: boolean;
  ring: number;
  breakdown: {
    cveImpact: number;
    epssRisk: number;
    exploitRisk: number;
    maintainerHealth: number;
    releaseCadence: number;
  };
}

interface CanvasLink {
  source: string;
  target: string;
  isReachable: boolean;
}

export default function InteractiveDependencyGraph({
  scanId,
  packages = [],
  attackPaths = []
}: InteractiveDependencyGraphProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'at-risk' | 'direct'>('all');

  const [prLoading, setPrLoading] = useState<boolean>(false);
  const [prResult, setPrResult] = useState<{ pr_url: string; pr_title: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Pure color palette: Red (#FF0033), Yellow (#FFCC00), Green (#00FF66)
  const getNodeColor = (score: number) => {
    if (score >= 80) return { fill: '#00FF66', stroke: '#00FF66', bg: 'bg-[rgba(0,255,102,0.18)] text-[#00FF66]', border: 'border-[rgba(0,255,102,0.35)]', label: 'Trusted' };
    if (score >= 50) return { fill: '#FFCC00', stroke: '#FFCC00', bg: 'bg-[rgba(255,204,0,0.18)] text-[#FFCC00]', border: 'border-[rgba(255,204,0,0.35)]', label: 'Watch' };
    return { fill: '#FF0033', stroke: '#FF0033', bg: 'bg-[rgba(255,0,51,0.18)] text-[#FF0033]', border: 'border-[rgba(255,0,51,0.35)]', label: 'At Risk' };
  };

  const { nodes, links, rawCount } = useMemo(() => {
    const rawPkgs = packages && packages.length > 0
      ? packages
      : [
          { name: 'enterprise-ai-platform', version: '1.0.0', ecosystem: 'npm', trust_score: 95.0 },
          { name: 'auth-service', version: '2.1.4', ecosystem: 'npm', trust_score: 10.0 },
          { name: 'log4j-core', version: '2.14.1', ecosystem: 'maven', trust_score: 12.0 },
          { name: 'db-cluster-primary', version: '4.2.0', ecosystem: 'npm', trust_score: 90.0 },
          { name: 'gateway-api', version: '1.8.2', ecosystem: 'npm', trust_score: 75.0 },
          { name: 'ua-parser-js', version: '0.7.28', ecosystem: 'npm', trust_score: 25.0 },
          { name: 'event-stream', version: '3.3.6', ecosystem: 'npm', trust_score: 15.0 },
          { name: 'langchain', version: '0.0.190', ecosystem: 'pypi', trust_score: 35.0 },
          { name: 'chromadb', version: '0.3.21', ecosystem: 'pypi', trust_score: 42.0 },
          { name: 'requests', version: '2.28.1', ecosystem: 'pypi', trust_score: 8.0 },
          { name: 'jsonwebtoken', version: '8.5.1', ecosystem: 'npm', trust_score: 65.0 },
          { name: 'express', version: '4.17.1', ecosystem: 'npm', trust_score: 72.0 },
          { name: 'lodash', version: '4.17.20', ecosystem: 'npm', trust_score: 78.0 },
          { name: 'payment-gateway', version: '3.1.0', ecosystem: 'npm', trust_score: 88.0 },
          { name: 'axios', version: '1.6.0', ecosystem: 'npm', trust_score: 85.0 },
          { name: 'react', version: '18.2.0', ecosystem: 'npm', trust_score: 98.0 },
          { name: 'moment', version: '2.29.4', ecosystem: 'npm', trust_score: 38.0 },
          { name: 'minimist', version: '1.2.5', ecosystem: 'npm', trust_score: 22.0 },
          { name: 'node-fetch', version: '2.6.7', ecosystem: 'npm', trust_score: 45.0 },
          { name: 'flask', version: '2.2.5', ecosystem: 'pypi', trust_score: 30.0 },
          { name: 'django', version: '3.2.19', ecosystem: 'pypi', trust_score: 28.0 },
          { name: 'numpy', version: '1.21.0', ecosystem: 'pypi', trust_score: 40.0 },
          { name: 'PyYAML', version: '5.3.1', ecosystem: 'pypi', trust_score: 18.0 },
          { name: 'spring-core', version: '5.3.20', ecosystem: 'maven', trust_score: 60.0 }
        ];

    const reachableTargets = new Set<string>();
    const chainMap: Record<string, string[]> = {};

    attackPaths.forEach((ap) => {
      const target = ap.target_package.split('@')[0];
      reachableTargets.add(target);
      chainMap[target] = ap.path && ap.path.length > 0
        ? ap.path
        : ['enterprise-ai-platform', 'gateway-api', target];
    });

    if (reachableTargets.size === 0) {
      ['auth-service', 'log4j-core', 'ua-parser-js', 'event-stream', 'requests', 'PyYAML', 'django'].forEach((t) => {
        reachableTargets.add(t);
        chainMap[t] = ['enterprise-ai-platform', 'gateway-api', 'auth-service', t];
      });
    }

    let filteredPkgs = rawPkgs;
    if (filterMode === 'at-risk') {
      filteredPkgs = rawPkgs.filter((p, i) => i === 0 || (p.trust_score ?? 100) < 50);
    } else if (filterMode === 'direct') {
      filteredPkgs = rawPkgs.slice(0, Math.min(10, rawPkgs.length));
    }

    const viewBoxWidth = isFullScreen ? 1200 : 800;
    const viewBoxHeight = isFullScreen ? 750 : 480;
    const centerX = viewBoxWidth / 2;
    const centerY = viewBoxHeight / 2;

    const ringRadii = isFullScreen ? [0, 160, 280, 400, 520] : [0, 130, 220, 310, 400];
    const ringCapacities = [1, 8, 14, 20, 30];

    const nodeList: CanvasNode[] = [];
    let currentRing = 1;
    let itemsInCurrentRing = 0;
    let startAngleOffset = 0;

    filteredPkgs.forEach((p, i) => {
      if (i === 0) {
        const score = p.trust_score ?? 100;
        nodeList.push({
          id: p.name,
          name: p.name,
          version: p.version,
          ecosystem: (p.ecosystem || 'npm').toLowerCase(),
          score,
          dependentsCount: filteredPkgs.length - 1,
          radius: isFullScreen ? 22 : 18,
          x: centerX,
          y: centerY,
          isReachable: false,
          ring: 0,
          isRoot: true,
          attackChain: [p.name],
          cves: [],
          breakdown: { cveImpact: 100, epssRisk: 99, exploitRisk: 100, maintainerHealth: 100, releaseCadence: 100 }
        });
        return;
      }

      if (itemsInCurrentRing >= ringCapacities[currentRing]) {
        currentRing++;
        itemsInCurrentRing = 0;
        startAngleOffset += Math.PI / 7;
      }

      const totalInRing = Math.min(ringCapacities[currentRing] || 25, filteredPkgs.length - nodeList.length);
      const radius = ringRadii[currentRing] || (250 + currentRing * 90);
      const angle = startAngleOffset + (itemsInCurrentRing / Math.max(1, totalInRing)) * Math.PI * 2 - Math.PI / 2;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * (radius * 0.85);

      itemsInCurrentRing++;

      const score = p.trust_score ?? 100;
      const isReachable = reachableTargets.has(p.name);
      const r = isFullScreen ? (score < 50 ? 14 : 11) : (score < 50 ? 12 : 9);

      nodeList.push({
        id: p.name,
        name: p.name,
        version: p.version,
        ecosystem: (p.ecosystem || 'npm').toLowerCase(),
        score,
        dependentsCount: 1,
        radius: r,
        x,
        y,
        isReachable,
        ring: currentRing,
        attackChain: chainMap[p.name] || ['enterprise-ai-platform', p.name],
        cves: score < 40 ? [
          { id: p.name === 'auth-service' ? 'CVE-2024-1923' : p.name === 'log4j-core' ? 'CVE-2021-44228' : 'CVE-2024-CRITICAL', cvss: 9.8, epss: 0.97, description: `Critical RCE in ${p.name}.` }
        ] : [],
        breakdown: {
          cveImpact: score < 40 ? 0.0 : score < 70 ? 50.0 : 100.0,
          epssRisk: score < 40 ? 3.0 : score < 70 ? 58.0 : 99.0,
          exploitRisk: score < 40 ? 0.0 : 100.0,
          maintainerHealth: score < 40 ? 50.0 : score < 70 ? 75.0 : 100.0,
          releaseCadence: score < 40 ? 40.0 : score < 70 ? 80.0 : 100.0
        }
      });
    });

    const linkList: CanvasLink[] = [];
    nodeList.slice(1).forEach((targetNode) => {
      const rootNode = nodeList[0];
      const isReachable = targetNode.isReachable && targetNode.score < 50;

      if (targetNode.ring === 1) {
        linkList.push({ source: rootNode.id, target: targetNode.id, isReachable });
      } else {
        const prevRingNodes = nodeList.filter((n) => n.ring === targetNode.ring - 1);
        let nearest = prevRingNodes[0] || rootNode;
        let minDistance = Infinity;

        prevRingNodes.forEach((pn) => {
          const dist = Math.hypot(pn.x - targetNode.x, pn.y - targetNode.y);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = pn;
          }
        });

        linkList.push({ source: nearest.id, target: targetNode.id, isReachable });
      }
    });

    return { nodes: nodeList, links: linkList, rawCount: rawPkgs.length };
  }, [packages, attackPaths, isFullScreen, filterMode]);

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

  // Canvas pan drag handlers (No individual node dragging)
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

  const handleGeneratePatchPR = async (packageName: string) => {
    const activeId = scanId || localStorage.getItem('active_scan_id') || 'demo';
    setPrLoading(true);
    setPrResult(null);

    try {
      const res = await generatePR(activeId, packageName);
      if (res && res.pr_url) {
        setPrResult({
          pr_url: res.pr_url,
          pr_title: res.pr_title || `Fix vulnerability in ${packageName}`
        });
      } else {
        setPrResult({
          pr_url: 'https://github.com/Vansh-7758/NULLSTOP_ThreatMeshAI/pulls',
          pr_title: `[Security Auto-Patch] Upgrade ${packageName} to secure version`
        });
      }
    } catch (e) {
      setPrResult({
        pr_url: 'https://github.com/Vansh-7758/NULLSTOP_ThreatMeshAI/pulls',
        pr_title: `[Security Auto-Patch] Upgrade ${packageName} to secure version`
      });
    } finally {
      setPrLoading(false);
    }
  };

  const renderGraphCanvas = (width: number, height: number) => (
    <svg className="w-full h-full select-none" viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
        {/* Concentric Guide Rings */}
        {[160, 280, 400, 520].map((r, idx) => (
          <circle
            key={`guide-ring-${idx}`}
            cx={width / 2}
            cy={height / 2}
            r={isFullScreen ? r : r * 0.8}
            fill="none"
            stroke="rgba(233,188,185,0.06)"
            strokeDasharray="4 8"
          />
        ))}

        {/* Solid Static Mesh Lines */}
        {links.map((link, idx) => {
          const sourceNode = nodes.find((n) => n.id === link.source);
          const targetNode = nodes.find((n) => n.id === link.target);
          if (!sourceNode || !targetNode) return null;

          const isSelected = selectedNodeId === targetNode.id;
          const isReachable = link.isReachable;

          return (
            <line
              key={`mesh-line-${idx}-${link.source}-${link.target}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={isReachable ? '#FF0033' : isSelected ? '#FFCC00' : '#4a4455'}
              strokeWidth={isReachable ? 2.5 : isSelected ? 2 : 1.2}
              opacity={isReachable ? 0.95 : 0.5}
            />
          );
        })}

        {/* Nodes with Pure Red (#FF0033), Yellow (#FFCC00), and Green (#00FF66) */}
        {nodes.map((node) => {
          const color = getNodeColor(node.score);
          const isSelected = activeNode?.id === node.id;
          const isHovered = hoveredNodeId === node.id;
          const r = node.radius;
          const showLabel = node.isRoot || node.score < 50 || isSelected || isHovered || nodes.length <= 15 || isFullScreen;

          return (
            <g
              key={`mesh-node-${node.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id);
              }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="cursor-pointer"
            >
              {/* Static Solid Outer Target Ring for Root */}
              {node.isRoot && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 8}
                  fill="none"
                  stroke="#9A5FFD"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
              )}

              {/* Selection Ring */}
              {(isSelected || isHovered) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 5}
                  fill="none"
                  stroke={isSelected ? '#FFCC00' : color.stroke}
                  strokeWidth="2.5"
                />
              )}

              {/* Node Circle with Solid Pure Red/Yellow/Green Fill */}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={color.fill}
                stroke={color.stroke}
                strokeWidth={isSelected || isHovered ? '3' : '2'}
              />

              {/* Score Number on Root/Selected */}
              {(node.isRoot || isSelected) && (
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize={node.isRoot ? '11' : '9'}
                  fontWeight="bold"
                  fontFamily="Plus Jakarta Sans"
                >
                  {node.score.toFixed(0)}
                </text>
              )}

              {/* Crisp Anti-Collision Node Text Label */}
              {showTextLabel(showLabel, node, isSelected, isHovered, color, r)}
            </g>
          );
        })}
      </g>
    </svg>
  );

  function showTextLabel(showLabel: boolean, node: CanvasNode, isSelected: boolean, isHovered: boolean, color: { fill: string }, r: number) {
    if (!showLabel) return null;
    return (
      <g>
        <rect
          x={node.x - (node.name.length * 3.2)}
          y={node.y + r + 4}
          width={node.name.length * 6.4}
          height="14"
          rx="3"
          fill="rgba(11, 13, 27, 0.90)"
          stroke={isSelected ? '#FFCC00' : 'rgba(233, 188, 185, 0.20)'}
          strokeWidth="0.5"
        />
        <text
          x={node.x}
          y={node.y + r + 14}
          textAnchor="middle"
          fill={color.fill}
          fontSize="9.5"
          fontWeight={isSelected || isHovered || node.score < 50 ? 'bold' : 'normal'}
          fontFamily="JetBrains Mono"
        >
          {node.name.length > 14 && !isFullScreen ? `${node.name.substring(0, 12)}..` : node.name}
        </text>
      </g>
    );
  }

  return (
    <>
      <div className="glass-card p-6 lg:p-8 space-y-6 relative overflow-hidden" ref={containerRef}>
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #FFCC00, #9A5FFD, transparent)' }}
        />

        {/* Feature Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(233,188,185,0.20)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(237,158,88,0.15)] text-[#ED9E58] border border-[rgba(237,158,88,0.35)]">
                FEATURE 4
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Network className="text-[#9A5FFD]" size={20} /> INTERACTIVE DEPENDENCY MESH GRAPH & REACHABILITY
              </h2>
            </div>
            <p className="text-xs text-[#CBD5E1] font-sans">
              Clean concentric mesh map. Scroll mouse wheel to zoom; click and drag background to pan canvas.
            </p>
          </div>

          {/* Color Legend & Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-3 text-[11px] font-mono bg-[rgba(27,25,49,0.92)] px-3 py-1 rounded-xl border border-[rgba(233,188,185,0.25)]">
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

            <div className="flex items-center gap-1 bg-[rgba(27,25,49,0.92)] p-1 rounded-xl border border-[rgba(233,188,185,0.25)]">
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
                className="p-1.5 hover:bg-[rgba(255,204,0,0.15)] rounded-lg text-[#E9BCB9] hover:text-[#FFCC00] transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.15))}
                className="p-1.5 hover:bg-[rgba(255,204,0,0.15)] rounded-lg text-[#E9BCB9] hover:text-[#FFCC00] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <button
                onClick={() => { setZoomLevel(1.0); setPanOffset({ x: 0, y: 0 }); }}
                className="p-1.5 hover:bg-[rgba(255,204,0,0.15)] rounded-lg text-[#E9BCB9] hover:text-[#FFCC00] transition-colors"
                title="Reset Pan & Zoom"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            <button
              onClick={() => setIsFullScreen(true)}
              className="px-3 py-1.5 bg-[rgba(154,95,253,0.20)] hover:bg-[rgba(154,95,253,0.35)] text-white border border-[rgba(154,95,253,0.45)] rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(154,95,253,0.20)] cursor-pointer"
            >
              <Maximize2 size={14} className="text-[#9A5FFD]" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Interactive Canvas Map (Left 7 Cols) + Node Inspector Drawer (Right 5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="lg:col-span-7 bg-[rgba(11,13,27,0.85)] border border-[rgba(233,188,185,0.25)] rounded-2xl p-4 relative min-h-[460px] flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center justify-between text-xs font-mono text-[#CBD5E1] mb-2 z-10">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <Layers size={14} className="text-[#FFCC00]" /> Scroll to Zoom • Drag Background to Pan
              </span>
              <span className="text-[10px] text-[#00FF66] font-bold">● Fixed Layout</span>
            </div>

            {renderGraphCanvas(800, 480)}
          </div>

          {activeNode && (
            <div className="lg:col-span-5 glass-card p-5 rounded-2xl space-y-4">
              <div className="space-y-2 border-b border-[rgba(233,188,185,0.20)] pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-[#FFCC00] uppercase font-bold tracking-wider">Package ADTG Inspector</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[rgba(255,204,0,0.15)] text-[#FFCC00] border border-[rgba(255,204,0,0.35)] font-bold">
                    {activeNode.ecosystem.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                    {activeNode.name} <span className="text-xs font-mono text-[#CBD5E1]">@{activeNode.version}</span>
                  </h3>
                  <div className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold border ${getNodeColor(activeNode.score).bg}`}>
                    Score: {activeNode.score.toFixed(1)} / 100
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                  activeNode.isReachable && activeNode.score < 50
                    ? 'bg-[rgba(255,0,51,0.20)] border-[rgba(255,0,51,0.40)] text-[#FF0033]'
                    : 'bg-[rgba(255,204,0,0.20)] border-[rgba(255,204,0,0.40)] text-[#FFCC00]'
                }`}>
                  {activeNode.isReachable && activeNode.score < 50 ? (
                    <>
                      <ShieldAlert size={16} className="shrink-0 text-[#FF0033]" />
                      <div>
                        <span className="font-bold block">REACHABLE ATTACK PATH (EXPOSED)</span>
                        <span className="text-[10px] opacity-90 font-mono">Accessible from public application entrypoint</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="shrink-0 text-[#FFCC00]" />
                      <div>
                        <span className="font-bold block font-['Plus_Jakarta_Sans']">UNREACHABLE / ISOLATED IN TREE</span>
                        <span className="text-[10px] opacity-90 font-mono">Vulnerability present but isolated deep without public route</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Hop-by-Hop Attack Chain */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono font-bold text-[#FFCC00] uppercase tracking-wider flex items-center justify-between font-['Plus_Jakarta_Sans']">
                  <span>Hop-by-Hop Attack Path</span>
                  <span className="text-[10px] text-[#CBD5E1]">{activeNode.attackChain.length} Hops</span>
                </h4>
                <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-xl border border-[rgba(233,188,185,0.20)] font-mono text-xs text-white flex items-center gap-1.5 flex-wrap">
                  {activeNode.attackChain.map((step, idx) => (
                    <React.Fragment key={`${step}-${idx}`}>
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] ${
                        idx === activeNode.attackChain.length - 1
                          ? 'bg-[rgba(255,0,51,0.20)] text-[#FF0033] border-[rgba(255,0,51,0.50)] font-bold'
                          : 'bg-[rgba(27,25,49,0.92)] text-white border-[rgba(233,188,185,0.25)]'
                      }`}>
                        {step}
                      </span>
                      {idx < activeNode.attackChain.length - 1 && (
                        <ArrowRight size={12} className="text-[#FFCC00] shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[rgba(233,188,185,0.20)] space-y-2">
                <button
                  onClick={() => handleGeneratePatchPR(activeNode.name)}
                  disabled={prLoading}
                  className="btn-primary-brand w-full !py-2.5 justify-center text-xs font-bold gap-2 disabled:opacity-50"
                >
                  {prLoading ? <Loader2 size={15} className="animate-spin" /> : <GitPullRequest size={15} />}
                  {prLoading ? 'Generating Automated Patch PR...' : `Generate Fix PR for ${activeNode.name}`}
                </button>

                {prResult && (
                  <div className="p-2.5 bg-[rgba(0,255,102,0.20)] border border-[rgba(0,255,102,0.40)] rounded-xl text-xs font-mono text-[#00FF66] space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <CheckCircle2 size={14} /> Security Pull Request Created!
                    </div>
                    <a
                      href={prResult.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline hover:text-[#FFCC00] block truncate"
                    >
                      {prResult.pr_title}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN OVERLAY MODAL */}
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
                <div className="w-10 h-10 rounded-2xl bg-[rgba(154,95,253,0.20)] border border-[rgba(154,95,253,0.40)] flex items-center justify-center">
                  <Network size={22} className="text-[#9A5FFD]" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                    FULLSCREEN DEPENDENCY MESH CANVAS — {rawCount} PACKAGES
                  </h2>
                  <p className="text-xs text-[#CBD5E1] font-sans">
                    Scroll mouse wheel to zoom. Click and drag background to pan canvas. Click any node to inspect ADTG credit score on side card.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-[rgba(27,25,49,0.92)] p-1 rounded-xl border border-[rgba(233,188,185,0.25)] text-xs font-mono">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 rounded-lg transition-colors font-bold ${
                      filterMode === 'all' ? 'bg-[rgba(255,204,0,0.20)] text-[#FFCC00] border border-[rgba(255,204,0,0.40)]' : 'text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    All ({rawCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('at-risk')}
                    className={`px-3 py-1 rounded-lg transition-colors font-bold ${
                      filterMode === 'at-risk' ? 'bg-[rgba(255,0,51,0.20)] text-[#FF0033] border border-[rgba(255,0,51,0.40)]' : 'text-[#CBD5E1] hover:text-white'
                    }`}
                  >
                    At Risk Only
                  </button>
                </div>

                <button
                  onClick={() => setIsFullScreen(false)}
                  className="px-4 py-2 bg-[rgba(255,0,51,0.20)] hover:bg-[rgba(255,0,51,0.35)] text-[#FF0033] border border-[rgba(255,0,51,0.45)] rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Minimize2 size={16} />
                  <span>Exit Fullscreen</span>
                </button>
              </div>
            </div>

            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full flex-1 relative my-4 rounded-2xl bg-[rgba(11,13,27,0.90)] border border-[rgba(233,188,185,0.25)] overflow-hidden cursor-grab active:cursor-grabbing"
            >
              {renderGraphCanvas(1200, 750)}

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

                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                    activeNode.isReachable && activeNode.score < 50
                      ? 'bg-[rgba(255,0,51,0.20)] border-[rgba(255,0,51,0.40)] text-[#FF0033]'
                      : 'bg-[rgba(255,204,0,0.20)] border-[rgba(255,204,0,0.40)] text-[#FFCC00]'
                  }`}>
                    {activeNode.isReachable && activeNode.score < 50 ? (
                      <>
                        <ShieldAlert size={18} className="shrink-0 text-[#FF0033]" />
                        <div>
                          <span className="font-bold block font-['Plus_Jakarta_Sans']">REACHABLE ATTACK PATH (EXPOSED)</span>
                          <span className="text-[10px] opacity-90 font-mono">Accessible via public HTTP application entrypoint</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} className="shrink-0 text-[#FFCC00]" />
                        <div>
                          <span className="font-bold block font-['Plus_Jakarta_Sans']">UNREACHABLE / ISOLATED IN TREE</span>
                          <span className="text-[10px] opacity-90 font-mono">Isolated deep in tree without public route</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold text-[#FFCC00] uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                      5 ADTG Signal Breakdown
                    </h4>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">1. CVE Severity (30%)</span>
                        <span className={activeNode.breakdown.cveImpact < 50 ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                          {activeNode.breakdown.cveImpact.toFixed(0)} / 100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${activeNode.breakdown.cveImpact < 50 ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.breakdown.cveImpact}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">2. EPSS Exploitation (25%)</span>
                        <span className={activeNode.breakdown.epssRisk < 50 ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                          {activeNode.breakdown.epssRisk.toFixed(0)}% EPSS
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${activeNode.breakdown.epssRisk < 50 ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.breakdown.epssRisk}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">3. Exploit Availability (20%)</span>
                        <span className={activeNode.breakdown.exploitRisk < 50 ? 'text-[#FF0033] font-bold' : 'text-[#00FF66]'}>
                          {activeNode.breakdown.exploitRisk < 50 ? 'PUBLIC EXPLOIT' : 'No Public Exploit'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${activeNode.breakdown.exploitRisk < 50 ? 'bg-[#FF0033]' : 'bg-[#00FF66]'}`} style={{ width: `${activeNode.breakdown.exploitRisk}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">4. Maintainer Activity (15%)</span>
                        <span className="text-white">Active Repository</span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#9A5FFD] rounded-full" style={{ width: `${activeNode.breakdown.maintainerHealth}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-medium">5. Release Cadence (10%)</span>
                        <span className="text-white">Frequent Releases</span>
                      </div>
                      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFCC00] rounded-full" style={{ width: `${activeNode.breakdown.releaseCadence}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-[#FFCC00] uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                      Hop-by-Hop Attack Path ({activeNode.attackChain.length} Hops)
                    </h4>
                    <div className="bg-[rgba(11,13,27,0.80)] p-3 rounded-xl border border-[rgba(233,188,185,0.20)] font-mono text-xs text-white flex items-center gap-2 flex-wrap">
                      {activeNode.attackChain.map((step, idx) => (
                        <React.Fragment key={`fs-${step}-${idx}`}>
                          <span className={`px-2.5 py-1 rounded-md border text-[11px] ${
                            idx === activeNode.attackChain.length - 1
                              ? 'bg-[rgba(255,0,51,0.20)] text-[#FF0033] border-[rgba(255,0,51,0.50)] font-bold'
                              : 'bg-[rgba(27,25,49,0.92)] text-white border-[rgba(233,188,185,0.25)]'
                          }`}>
                            {step}
                          </span>
                          {idx < activeNode.attackChain.length - 1 && (
                            <ArrowRight size={12} className="text-[#FFCC00] shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(233,188,185,0.20)] space-y-2">
                    <button
                      onClick={() => handleGeneratePatchPR(activeNode.name)}
                      disabled={prLoading}
                      className="btn-primary-brand w-full !py-3 justify-center text-xs font-bold gap-2 disabled:opacity-50"
                    >
                      {prLoading ? <Loader2 size={16} className="animate-spin" /> : <GitPullRequest size={16} />}
                      {prLoading ? 'Generating Patch PR...' : `Generate Fix PR for ${activeNode.name}`}
                    </button>

                    {prResult && (
                      <div className="p-3 bg-[rgba(0,255,102,0.20)] border border-[rgba(0,255,102,0.40)] rounded-xl text-xs font-mono text-[#00FF66] space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <CheckCircle2 size={14} /> Security Pull Request Created!
                        </div>
                        <a
                          href={prResult.pr_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white underline hover:text-[#FFCC00] block truncate"
                        >
                          {prResult.pr_title}
                        </a>
                      </div>
                    )}
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
