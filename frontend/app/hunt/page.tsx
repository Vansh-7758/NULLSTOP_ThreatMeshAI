// frontend/app/hunt/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getPackages, triggerHunt, getHuntPlaybooks, getHuntStatus } from '@/lib/api';
import { useWebSocket, wsClient } from '@/lib/websocket';
import { Package, Playbook, HuntStatus as HuntStatusType } from '@/types';

import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import HuntProgressBar from '@/components/hunt/HuntProgressBar';
import AgentStatusStream from '@/components/hunt/AgentStatusStream';
import CouncilPanel from '@/components/hunt/CouncilPanel';
import CopilotPanel from '@/components/hunt/CopilotPanel';

import {
  ShieldAlert,
  Play,
  Search,
  Upload,
  CheckCircle2,
  Loader2,
  XCircle,
  Brain,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export default function HuntPage() {
  const shouldReduceMotion = useReducedMotion();
  useWebSocket();

  const [scanId, setScanId] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [huntStatus, setHuntStatus] = useState<HuntStatusType | null>(null);

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHunting, setIsHunting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read scan_id from localStorage on mount
  useEffect(() => {
    const storedScanId =
      localStorage.getItem('active_scan_id') ||
      localStorage.getItem('scan_id') ||
      'default';
    setScanId(storedScanId);
  }, []);

  // Fetch packages & playbooks when scanId is resolved
  const fetchHuntData = useCallback(async () => {
    if (!scanId) return;
    setLoading(true);
    try {
      const [pkgs, pbs, hStatus] = await Promise.all([
        getPackages(scanId).catch(() => []),
        getHuntPlaybooks(scanId).catch(() => []),
        getHuntStatus(scanId).catch(() => null)
      ]);

      let finalPkgs = pkgs;
      if ((!finalPkgs || finalPkgs.length === 0) && scanId === 'default') {
        finalPkgs = [
          { id: "pkg-1", name: "log4j-core", version: "2.14.1", ecosystem: "maven", trust_score: 10.0, node_type: "package", dependencies: ["log4j-api"], first_seen: "2026-08-01", purl: null },
          { id: "pkg-2", name: "struts2-core", version: "2.3.12", ecosystem: "maven", trust_score: 15.0, node_type: "package", dependencies: ["ognl"], first_seen: "2026-08-01", purl: null },
          { id: "pkg-3", name: "spring-core", version: "5.3.17", ecosystem: "maven", trust_score: 25.0, node_type: "package", dependencies: [], first_seen: "2026-08-01", purl: null },
          { id: "pkg-4", name: "jackson-databind", version: "2.9.8", ecosystem: "maven", trust_score: 42.0, node_type: "package", dependencies: [], first_seen: "2026-08-01", purl: null },
          { id: "pkg-5", name: "axios", version: "0.21.1", ecosystem: "npm", trust_score: 68.0, node_type: "package", dependencies: [], first_seen: "2026-08-01", purl: null },
          { id: "pkg-6", name: "lodash", version: "4.17.21", ecosystem: "npm", trust_score: 92.0, node_type: "package", dependencies: [], first_seen: "2026-08-01", purl: null },
          { id: "pkg-7", name: "requests", version: "2.25.1", ecosystem: "pypi", trust_score: 88.0, node_type: "package", dependencies: [], first_seen: "2026-08-01", purl: null },
          { id: "pkg-8", name: "urllib3", version: "1.26.4", ecosystem: "pypi", trust_score: 74.0, node_type: "package", dependencies: [], first_seen: "2026-08-01", purl: null }
        ];
      }

      setPackages(finalPkgs);
      setPlaybooks(pbs);
      if (hStatus) {
        setHuntStatus(hStatus);
        if (hStatus.status === 'running') {
          setIsHunting(true);
        }
      }

      // Auto-select first at-risk package
      const atRisk = finalPkgs.filter((p: any) => (p.trust_score ?? 100) < 50);
      if (atRisk.length > 0 && !selectedPackage) {
        setSelectedPackage(atRisk[0]);
      } else if (finalPkgs.length > 0 && !selectedPackage) {
        setSelectedPackage(finalPkgs[0]);
      }
    } catch (e) {
      console.error('Error fetching hunt page data:', e);
    } finally {
      setLoading(false);
    }
  }, [scanId, selectedPackage]);

  useEffect(() => {
    if (scanId) {
      fetchHuntData();
    }
  }, [scanId, fetchHuntData]);

  // WebSocket refetch on council_completed
  useEffect(() => {
    const unsubscribe = wsClient.onMessage((data: unknown) => {
      const msg = data as Record<string, any>;
      if (msg && msg.event_type === 'council_completed') {
        getHuntPlaybooks(scanId || 'default')
          .then((pbs) => setPlaybooks(pbs))
          .catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [scanId]);

  // At-risk packages filtered to trust score < 50
  const atRiskPackages = useMemo(() => {
    return packages.filter((p) => (p.trust_score ?? 100) < 50);
  }, [packages]);

  // All packages sorted with at-risk first, filtered by search query
  const filteredPackages = useMemo(() => {
    const sorted = [...packages].sort((a, b) => (a.trust_score ?? 100) - (b.trust_score ?? 100));
    return sorted.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [packages, searchQuery]);

  const handleStartHunt = async () => {
    if (!scanId) return;
    setIsHunting(true);
    try {
      await triggerHunt(scanId);
      
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const [pbs, hStatus] = await Promise.all([
            getHuntPlaybooks(scanId).catch(() => []),
            getHuntStatus(scanId).catch(() => null)
          ]);
          if (pbs && pbs.length > 0) {
            setPlaybooks(pbs);
          }
          if (hStatus) {
            setHuntStatus(hStatus);
          }
          // Only stop when backend status reaches 'completed' / 'failed' or max timeout reached
          if (hStatus?.status === 'completed' || hStatus?.status === 'failed' || attempts > 30) {
            clearInterval(interval);
            setIsHunting(false);
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 1500);
    } catch (e) {
      console.error('Failed to trigger hunt:', e);
      setIsHunting(false);
    }
  };

  // Map of package names to existing playbooks
  const playbookMap = useMemo(() => {
    const map = new Map<string, Playbook>();
    playbooks.forEach((pb) => map.set(pb.package_name, pb));
    return map;
  }, [playbooks]);

  const selectedPlaybook = selectedPackage ? playbookMap.get(selectedPackage.name) || null : null;

  // Determine sub-state
  const isNoScan = !scanId || (packages.length === 0 && !loading);
  const isReadyToHunt = !isNoScan && playbooks.length === 0 && !isHunting;
  const isActiveOrCompleted = !isNoScan && (playbooks.length > 0 || isHunting);

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6 space-y-6">
      <AnimatePresence mode="wait">
        {/* =========================================================================
           SUB-STATE 1: EMPTY STATE (NO SCAN EXISTS YET)
           ========================================================================= */}
        {isNoScan && (
          <motion.div
            key="substate-noscan"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center min-h-[75vh] text-center max-w-md mx-auto"
          >
            <div className="p-4 rounded-2xl bg-[#161B22] border border-[#30363D] mb-4 text-[#F0A500]">
              <ShieldAlert size={48} />
            </div>
            <h2 className="text-2xl font-bold text-[#E6EDF3] mb-2">Upload an SBOM in WATCH First</h2>
            <p className="text-xs text-[#8B949E] mb-6 leading-relaxed">
              Threat Hunting requires an active dependency scan. Upload a CycloneDX or SPDX SBOM file in WATCH to begin multi-agent analysis.
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2"
            >
              <Upload size={16} /> Go to WATCH & Upload SBOM
            </Link>
          </motion.div>
        )}

        {/* =========================================================================
           SUB-STATE 2: READY STATE (SCAN EXISTS, HUNT NOT YET TRIGGERED)
           ========================================================================= */}
        {isReadyToHunt && (
          <motion.div
            key="substate-ready"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center justify-center min-h-[75vh] text-center max-w-xl mx-auto"
          >
            <div className="p-5 rounded-2xl bg-[#161B22] border border-[#30363D] mb-5 text-[#00C896] shadow-xl">
              <Brain size={56} />
            </div>

            <h2 className="text-3xl font-extrabold text-[#E6EDF3] mb-2">
              Ready for 8-Agent Threat Hunt
            </h2>

            <p className="text-xs text-[#8B949E] mb-6 leading-relaxed max-w-md">
              Activate 8 specialized AI agents to analyze every at-risk package and generate explainable remediation playbooks.
            </p>

            <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 w-full max-w-md mb-8 flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs text-[#8B949E] block">At-Risk / Scanned Packages</span>
                <span className="text-lg font-bold text-[#E84040]">
                  {atRiskPackages.length} At-Risk <span className="text-xs font-normal text-[#8B949E]">/ {packages.length} Total Monitored</span>
                </span>
              </div>
              <span className="text-xs font-mono text-[#00C896] bg-[#00C896]/10 px-3 py-1 rounded-full border border-[#00C896]/30 font-bold">
                Scan {scanId.slice(0, 8)}...
              </span>
            </div>

            <button
              onClick={handleStartHunt}
              className="px-8 py-3.5 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-extrabold text-sm rounded-xl shadow-xl transition-all flex items-center gap-2.5 hover:scale-105"
            >
              <Play size={18} fill="#0D1117" /> Start Threat Hunt
            </button>
          </motion.div>
        )}

        {/* =========================================================================
           SUB-STATE 3: ACTIVE / COMPLETED STATE (FULL HUNT DASHBOARD UI)
           ========================================================================= */}
        {isActiveOrCompleted && (
          <motion.div
            key="substate-active"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Hunt Progress Bar */}
            <HuntProgressBar scanId={scanId} onCompleted={() => setIsHunting(false)} />

            {/* Main Content Layout: Left Sidebar + Main Council Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
              {/* Left Sidebar (280px / 3 cols) */}
              <div className="lg:col-span-3 bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex flex-col h-full shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#30363D]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                    Monitored Packages
                  </h3>
                  <span className="text-xs font-mono text-[#8B949E]">
                    <span className="text-[#E84040] font-bold">{atRiskPackages.length} Flagged</span> / {filteredPackages.length}
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#8B949E]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search packages..."
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#00C896]"
                  />
                </div>

                {/* Package List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredPackages.map((pkg) => {
                    const isSelected = selectedPackage?.name === pkg.name;
                    const pb = playbookMap.get(pkg.name);
                    const isDone = pb != null;

                    return (
                      <div
                        key={pkg.name}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all select-none flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#0D1117] border-[#00C896] shadow-sm'
                            : 'bg-[#0D1117]/60 border-[#30363D]/60 hover:bg-[#0D1117]'
                        }`}
                      >
                        <div className="flex flex-col pr-2 overflow-hidden">
                          <span className="text-xs font-bold text-[#E6EDF3] truncate">{pkg.name}</span>
                          <span className="text-[10px] font-mono text-[#8B949E]">v{pkg.version}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <TrustScoreBadge score={pkg.trust_score} size="sm" />
                          {isDone ? (
                            <CheckCircle2 size={14} className="text-[#00C896]" />
                          ) : isHunting ? (
                            <Loader2 size={14} className="animate-spin text-[#F0A500]" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[#30363D]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area (9 cols) */}
              <div className="lg:col-span-9 h-full">
                <CouncilPanel
                  package={selectedPackage}
                  playbook={selectedPlaybook}
                  scanId={scanId}
                />
              </div>
            </div>

            {/* Bottom Real-Time Stream */}
            <div className="w-full">
              <AgentStatusStream scanId={scanId} />
            </div>

            {/* Floating Security Copilot Panel */}
            <CopilotPanel scanId={scanId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
