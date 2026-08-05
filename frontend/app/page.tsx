// frontend/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { uploadSBOM, getScanStatus, getPackages, getPredictions, getPlaybooks, getCVEs, getDashboardData } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { ScanStatus, Package, PredictedRisk, Playbook } from '@/types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

import SummaryRow from '@/components/dashboard/SummaryRow';
import CyberHealthGauge from '@/components/dashboard/CyberHealthGauge';
import TrustDistributionChart from '@/components/dashboard/TrustDistributionChart';
import LiveFeed from '@/components/dashboard/LiveFeed';
import ADTGTrustGraph from '@/components/dashboard/ADTGTrustGraph';
import InteractiveDependencyGraph from '@/components/dashboard/InteractiveDependencyGraph';
import AttackReplayTimeline from '@/components/dashboard/AttackReplayTimeline';
import CriticalPackagesTable from '@/components/dashboard/CriticalPackagesTable';
import PredictedRiskPanel from '@/components/dashboard/PredictedRiskPanel';
import PlaybookSection from '@/components/dashboard/PlaybookSection';

import { Shield, Upload, FileText, Clock, Users, Loader2, AlertCircle, Eye, Radar, ShieldAlert, Zap } from 'lucide-react';

const ASCIIText = dynamic(() => import('@/components/ui/ASCIIText'), {
  ssr: false,
  loading: () => <h1 className="text-4xl font-extrabold text-[#7c3aed] font-['Space_Grotesk']">THREATMESH AI</h1>
});

export default function ExecutiveDashboardPage() {
  const shouldReduceMotion = useReducedMotion();
  useWebSocket();

  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [cves, setCves] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<PredictedRisk[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('active_scan_id') || localStorage.getItem('scan_id') || 'default';
    setActiveScanId(stored);
  }, []);

  const fetchDashboardData = useCallback(async (scanId: string) => {
    try {
      const [status, pkgs, fetchedCves, preds, pbs, dashData] = await Promise.all([
        getScanStatus(scanId).catch(() => null),
        getPackages(scanId).catch(() => []),
        getCVEs(scanId).catch(() => []),
        getPredictions(scanId).catch(() => []),
        getPlaybooks(scanId).catch(() => []),
        getDashboardData(scanId).catch(() => null)
      ]);

      if (status) setScanStatus(status);

      let finalPkgs = pkgs && pkgs.length > 0 ? pkgs : (dashData?.critical_packages || []);
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
      setPackages(finalPkgs || []);
      setCves(fetchedCves && fetchedCves.length > 0 ? fetchedCves : (dashData?.recent_events || []));
      setPredictions(preds && preds.length > 0 ? preds : (dashData?.predictions || []));
      setPlaybooks(pbs && pbs.length > 0 ? pbs : (dashData?.playbooks || []));
    } catch (e: unknown) {
      console.error('Error fetching dashboard data:', e);
    }
  }, []);

  useEffect(() => {
    if (!activeScanId) return;

    fetchDashboardData(activeScanId);
    const interval = setInterval(() => {
      fetchDashboardData(activeScanId);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeScanId, fetchDashboardData]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setUploadError('Please select a valid CycloneDX or SPDX JSON file.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const res = await uploadSBOM(file);
      if (res && res.scan_id) {
        localStorage.setItem('active_scan_id', res.scan_id);
        localStorage.setItem('scan_id', res.scan_id);
        setActiveScanId(res.scan_id);
        fetchDashboardData(res.scan_id);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setUploadError(errorObj.message || 'Failed to upload SBOM file');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const cyberHealthScore = React.useMemo(() => {
    if (!packages || packages.length === 0) return 100;
    const sum = packages.reduce((acc, p) => acc + (p.trust_score ?? 100), 0);
    return sum / packages.length;
  }, [packages]);

  return (
    <div className="min-h-screen text-[#E4E1EA] p-6 space-y-6">
      <AnimatePresence mode="wait">
        {!activeScanId ? (
          /* =========================================================================
             STATE 1: GOOGLE STITCH ENTRY TERMINAL HERO & SBOM UPLOAD ZONE
             ========================================================================= */
          <motion.div
            key="empty-state"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="relative flex flex-col items-center justify-center min-h-[85vh] max-w-4xl mx-auto text-center px-4"
          >
            {/* ASCII Text Canvas Component Title */}
            <div className="relative w-full h-32 mb-4 overflow-hidden rounded-2xl flex items-center justify-center">
              <ErrorBoundary fallback={<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">THREATMESH AI</h1>}>
                <ASCIIText
                  text="THREATMESH AI"
                  asciiFontSize={7}
                  textFontSize={160}
                  textColor="#7c3aed"
                  enableWaves={true}
                />
              </ErrorBoundary>
            </div>

            {/* Subtitle */}
            <p className="font-[#Space_Grotesk'] text-lg text-[#ccc3d8] max-w-xl mb-8 tracking-tight font-medium">
              Autonomous Software Supply Chain Defense Platform
            </p>

            {/* Stitch BorderGlow Card Hero Upload Container */}
            <div className="border-glow-card w-full max-w-2xl p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-2xl">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full bg-[#0e0e14]/90 border-2 border-dashed rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
                  isDragging
                    ? 'border-[#7c3aed] bg-[#7c3aed]/10 scale-[1.01]'
                    : 'border-[#2D2D5E] hover:border-[#7c3aed] hover:bg-[#141428]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#7c3aed]/30 transition-all">
                  {uploading ? (
                    <Loader2 className="animate-spin text-[#7c3aed]" size={32} />
                  ) : (
                    <Upload className="text-[#7c3aed]" size={32} />
                  )}
                </div>

                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-white mb-2">
                  {uploading ? 'Ingesting SBOM & Parallel Threat Intelligence...' : 'Upload CycloneDX / SPDX SBOM'}
                </h3>
                <p className="text-sm text-[#8a809b] max-w-md mb-4">
                  Drag and drop your SBOM JSON file here, or click to browse. ThreatMesh will parse components and query NVD, OSV.dev & GitHub Advisories in parallel.
                </p>

                <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a2e] text-[#a78bfa] rounded-full text-xs font-mono border border-[#7c3aed]/30">
                  <Shield size={12} /> Supports CycloneDX 1.4/1.5 & SPDX 2.2/2.3 JSON
                </span>
              </div>

              {uploadError && (
                <div className="mt-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-200 text-xs font-mono flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             STATE 2: ACTIVE WATCH DASHBOARD
             ========================================================================= */
          <motion.div
            key="active-dashboard"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Dashboard Sub-Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151526]/80 border border-[#1E1E3A] p-4 rounded-xl backdrop-blur-xl">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <Eye className="text-[#7C3AED]" size={24} /> MODULE 1 — WATCH Executive Monitor
                </h1>
                <p className="text-xs text-[#ccc3d8] mt-0.5">Real-time autonomous defense status for scan: <span className="font-mono text-[#7C3AED] font-bold">{activeScanId}</span></p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem('active_scan_id');
                    setActiveScanId(null);
                  }}
                  className="px-3.5 py-1.5 bg-[#1b1b21] hover:bg-[#2a2930] text-[#ccc3d8] hover:text-white text-xs font-mono font-bold rounded-lg border border-[#4a4455]/50 transition-colors"
                >
                  Clear Active Scan
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6d28d9] text-white text-xs font-mono font-bold rounded-lg shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Upload size={14} /> New SBOM
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>

            {/* Row 1: Summary Row */}
            <SummaryRow
              totalPackages={scanStatus?.total_packages || packages.length}
              atRiskCount={scanStatus?.at_risk_count || packages.filter((p) => p.trust_score < 50).length}
              activeCVEs={scanStatus?.cve_count || cves.length || packages.filter((p) => p.trust_score < 80).length}
              openPRs={1}
            />

            {/* Row 2: Two-Column Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CyberHealthGauge score={cyberHealthScore} />
                  <TrustDistributionChart packages={packages} />
                </div>
              </div>

              {/* Right Column (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <LiveFeed packages={packages} cves={cves} scanId={activeScanId} />
              </div>
            </div>

            {/* Feature 3: ADTG Dependency Trust Graph & 5-Signal Inspector */}
            <div className="w-full">
              <ADTGTrustGraph packages={packages} />
            </div>

            {/* Feature 4: Interactive Dependency Graph & Reachability Analysis */}
            <div className="w-full">
              <InteractiveDependencyGraph scanId={activeScanId} packages={packages} />
            </div>

            {/* Feature 6: Attack Replay Timeline */}
            <div className="w-full">
              <AttackReplayTimeline scanId={activeScanId} packages={packages} cves={cves} />
            </div>

            {/* Critical Packages Table */}
            <div className="w-full">
              <CriticalPackagesTable scanId={activeScanId} initialPackages={packages} />
            </div>

            {/* Predicted Risk Panel */}
            <div className="w-full">
              <PredictedRiskPanel scanId={activeScanId} initialPredictions={predictions} />
            </div>

            {/* Playbook Section */}
            <div className="w-full">
              <PlaybookSection scanId={activeScanId} initialPlaybooks={playbooks} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
