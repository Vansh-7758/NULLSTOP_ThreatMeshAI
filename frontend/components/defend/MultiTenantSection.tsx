// frontend/components/defend/MultiTenantSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import TenantCard from './TenantCard';
import { getTenants, registerTenant, simulateAttack, resetTenants, uploadAndRegisterTenants } from '@/lib/api';
import { useWebSocket, wsClient } from '@/lib/websocket';
import { Tenant, PropagationEvent } from '@/types';
import {
  Building2,
  Plus,
  Zap,
  Activity,
  AlertOctagon,
  Loader2,
  Layers,
  RotateCcw,
  ShieldAlert,
  Info,
  Radio,
  FileText,
  CheckCircle2,
  Server,
  ArrowRight,
  ShieldCheck,
  Upload,
  AlertCircle,
  FileUp,
  Sparkles
} from 'lucide-react';

interface MultiTenantSectionProps {
  scanId: string;
}

export default function MultiTenantSection({ scanId }: MultiTenantSectionProps) {
  useWebSocket();

  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Multi-SBOM Upload States
  const [app1Name, setApp1Name] = useState('Fintech Mobile App');
  const [app1File, setApp1File] = useState<File | null>(null);

  const [app2Name, setApp2Name] = useState('Healthcare Patient Portal');
  const [app2File, setApp2File] = useState<File | null>(null);

  const [isUploadingMulti, setIsUploadingMulti] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Single Existing Scan Registration State
  const [tenantName, setTenantName] = useState('');
  const [targetScanId, setTargetScanId] = useState(scanId || '');
  const [isRegistering, setIsRegistering] = useState(false);

  // Simulator States
  const [packageName, setPackageName] = useState('lodash');
  const [newTrustScore, setNewTrustScore] = useState(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [simulatedTenants, setSimulatedTenants] = useState<Record<string, boolean>>({});
  const [staggerDelays, setStaggerDelays] = useState<Record<string, number>>({});
  const [impactBannerText, setImpactBannerText] = useState<string | null>(null);
  const [propagationLogs, setPropagationLogs] = useState<PropagationEvent[]>([]);

  useEffect(() => {
    if (scanId) {
      setTargetScanId(scanId);
    }
  }, [scanId]);

  const loadTenants = async () => {
    try {
      const data = await getTenants();
      setTenants(data || []);
    } catch (e) {
      console.error('Error loading tenants:', e);
      setTenants([]);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Listen to WebSocket attack_simulated events across clients
  useEffect(() => {
    const unsubscribe = wsClient.onMessage((data: unknown) => {
      const msg = data as Record<string, any>;
      if (msg && msg.event_type === 'attack_simulated') {
        const evt: PropagationEvent = {
          event_type: 'attack_simulated',
          package_name: msg.package_name,
          new_trust_score: msg.new_trust_score,
          triggered_by: msg.triggered_by,
          affected_tenants: msg.affected_tenants || []
        };

        // Fix 1: Deduplicate duplicate event broadcasts
        setPropagationLogs((prev) => {
          if (prev.length > 0) {
            const latest = prev[0];
            if (
              latest.package_name === msg.package_name &&
              latest.new_trust_score === msg.new_trust_score &&
              latest.affected_tenants?.length === (msg.affected_tenants?.length || 0)
            ) {
              return prev;
            }
          }
          return [evt, ...prev];
        });

        setImpactBannerText(
          msg.banner_message ||
            `One compromised package (${msg.package_name}) in Portfolio Application immediately lowered trust scores across connected tenant graphs via the shared ADTG layer.`
        );

        // Fix 2: Real-time state gauge update across tenant cards
        if (msg.affected_tenants && Array.isArray(msg.affected_tenants)) {
          setTenants((prevTenants) =>
            prevTenants.map((t) => {
              const affected = msg.affected_tenants.find(
                (at: { tenant_id: string; new_score: number }) => at.tenant_id === t.id
              );
              if (affected) {
                const newScore = affected.new_score;
                return {
                  ...t,
                  cyber_health_score: newScore,
                  status: newScore < 50 ? 'critical' : newScore < 75 ? 'warning' : 'healthy',
                  critical_packages_count: (t.critical_packages_count || 0) + 1
                };
              }
              return t;
            })
          );
        }

        // Staggered flash border animation (0ms, 300ms, 600ms)
        const delays: Record<string, number> = {};
        msg.affected_tenants?.forEach((at: { tenant_id: string; stagger_ms?: number }, idx: number) => {
          const delay = at.stagger_ms ?? idx * 300;
          delays[at.tenant_id] = delay;
          setTimeout(() => {
            setSimulatedTenants((prev) => ({ ...prev, [at.tenant_id]: true }));
          }, delay);
        });

        setStaggerDelays(delays);

        // Remove flash highlights after 8 seconds
        setTimeout(() => {
          setSimulatedTenants({});
        }, 8000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handler: Upload 1 or 2 SBOM files directly on the page and register tenants
  const handleUploadAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!app1Name.trim() || !app1File || isUploadingMulti) {
      setUploadError('Please select at least Application #1 Name and an SBOM file to upload.');
      return;
    }

    setIsUploadingMulti(true);
    try {
      await uploadAndRegisterTenants(
        app1Name.trim(),
        app1File,
        app2Name.trim() && app2File ? app2Name.trim() : undefined,
        app2File || undefined
      );

      setApp1File(null);
      setApp2File(null);
      await loadTenants();
    } catch (err: any) {
      console.error('Failed to upload and register tenants:', err);
      setUploadError(err.message || 'Failed to upload SBOMs and build portfolio graph.');
    } finally {
      setIsUploadingMulti(false);
    }
  };

  // Handler: Auto-Ingest Sample Portfolio for Fast Hackathon Demo
  const handleAutoDemoSetup = async () => {
    setIsUploadingMulti(true);
    setUploadError(null);
    try {
      // Sample SBOM content fallback
      const sampleContent = JSON.stringify({
        bomFormat: "CycloneDX",
        specVersion: "1.4",
        version: 1,
        components: [
          { name: "lodash", version: "4.17.21", purl: "pkg:npm/lodash@4.17.21", type: "library" },
          { name: "axios", version: "1.6.2", purl: "pkg:npm/axios@1.6.2", type: "library" },
          { name: "react", version: "18.2.0", purl: "pkg:npm/react@18.2.0", type: "library" },
          { name: "log4j-core", version: "2.14.1", purl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1", type: "library" },
          { name: "express", version: "4.18.2", purl: "pkg:npm/express@4.18.2", type: "library" }
        ]
      });

      const file1 = new File([sampleContent], "fintech-app-sbom.json", { type: "application/json" });
      const file2 = new File([sampleContent], "healthcare-portal-sbom.json", { type: "application/json" });

      await uploadAndRegisterTenants(
        "Fintech Mobile App",
        file1,
        "Healthcare Patient Portal",
        file2
      );

      await loadTenants();
    } catch (err: any) {
      console.error("Auto demo setup failed:", err);
      setUploadError(err.message || "Failed to run auto demo setup.");
    } finally {
      setIsUploadingMulti(false);
    }
  };

  // Handler: Register single scan ID
  const handleRegisterSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    const nameToRegister = tenantName.trim();
    const scanToRegister = targetScanId.trim() || scanId;

    if (!nameToRegister || !scanToRegister || isRegistering) return;
    setIsRegistering(true);

    try {
      await registerTenant(nameToRegister, scanToRegister);
      setTenantName('');
      await loadTenants();
    } catch (err: any) {
      console.error('Failed to register tenant:', err);
      setUploadError(err.message || `Failed to register scan '${scanToRegister}'. Ensure scan exists.`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSimulateAttack = async (pkgToAttack: string = packageName) => {
    if (isSimulating) return;
    setIsSimulating(true);
    setImpactBannerText(null);
    try {
      const res = await simulateAttack(pkgToAttack, newTrustScore);
      if (res && res.banner_text) {
        setImpactBannerText(res.banner_text);
      }
    } catch (err) {
      console.error('Failed to simulate attack:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    setImpactBannerText(null);
    setSimulatedTenants({});
    setPropagationLogs([]);
    try {
      await resetTenants();
      await loadTenants();
    } catch (e) {
      console.error('Failed to reset tenants:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const isAnyCritical = tenants.some((t) => (t.cyber_health_score ?? 88) < 50);

  return (
    <div className="space-y-6">
      {/* EXPLANATORY ARCHITECTURE BANNER */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#30363D] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#E6EDF3] flex items-center gap-2">
              <Layers size={20} className="text-[#7C3AED]" /> Multi-Tenant Portfolio Defense & Shared ADTG Graph Layer
            </h3>
            <p className="text-xs text-[#8B949E] mt-1 max-w-3xl leading-relaxed">
              Upload multiple application SBOMs directly on this page to build a shared <strong>Neo4j ADTG Dependency Graph</strong>. When a shared package (e.g. <code>lodash</code>) is compromised, blast radius signals propagate via WebSockets to all connected tenant dashboards simultaneously.
            </p>
          </div>

          {tenants.length > 0 && (
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="px-3.5 py-2 bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs font-bold rounded-xl transition-colors border border-[#30363D] flex items-center gap-1.5 shrink-0"
            >
              {isResetting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Clear Portfolio Tenants
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8B949E] gap-2 pt-1">
          <span className="flex items-center gap-1.5 text-[#00C896] font-bold">
            <Radio size={14} className="animate-pulse" /> Live Shared Neo4j Graph Layer Active
          </span>
          <span>Registered Portfolio Apps: {tenants.length}</span>
          <span>WebSocket Signal Latency: &lt; 50ms</span>
        </div>
      </div>

      {/* PROMINENT IMPACT BANNER (WHEN ATTACK IS SIMULATED) */}
      {impactBannerText && (
        <div className="p-4 bg-[#E84040]/15 border-2 border-[#E84040] rounded-xl flex items-center justify-between gap-4 text-xs text-[#E84040] font-extrabold shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert size={22} className="shrink-0 animate-bounce" />
            <span className="text-sm leading-relaxed">{impactBannerText}</span>
          </div>
          <button
            onClick={() => setImpactBannerText(null)}
            className="text-xs text-[#8B949E] hover:text-white shrink-0 font-mono"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* DEDICATED MULTI-TENANT SBOM UPLOAD & AUTO-REGISTRATION PANEL */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#30363D] pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-[#E6EDF3] flex items-center gap-2">
              <Upload size={18} className="text-[#00C896]" /> Upload Application SBOMs directly to Build Portfolio Graph
            </h4>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Upload two application SBOMs directly here (independent of WATCH page) to build shared package nodes in Neo4j.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoDemoSetup}
            disabled={isUploadingMulti}
            className="px-4 py-2 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#7C3AED] border border-[#7C3AED]/50 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-sm"
          >
            {isUploadingMulti ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            ⚡ 1-Click Hackathon Demo Setup
          </button>
        </div>

        {uploadError && (
          <div className="p-3 bg-[#E84040]/10 border border-[#E84040]/30 rounded-xl flex items-center gap-2 text-xs text-[#E84040]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadAndRegister} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App #1 Box */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E6EDF3] border-b border-[#30363D] pb-2">
                <Building2 size={16} className="text-[#00C896]" /> Application #1 (Primary Tenant)
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8B949E] uppercase block mb-1">
                  Application Name <span className="text-[#E84040]">*</span>
                </label>
                <input
                  type="text"
                  value={app1Name}
                  onChange={(e) => setApp1Name(e.target.value)}
                  placeholder="e.g. Fintech Mobile App"
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg px-3 py-2 text-xs text-[#E6EDF3] focus:outline-none focus:border-[#00C896]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8B949E] uppercase block mb-1">
                  Upload Application #1 SBOM File <span className="text-[#E84040]">*</span>
                </label>
                <input
                  type="file"
                  accept=".json,.spdx,.xml"
                  onChange={(e) => setApp1File(e.target.files?.[0] || null)}
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg p-2 text-xs text-[#E6EDF3] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#00C896]/20 file:text-[#00C896] hover:file:bg-[#00C896]/30 cursor-pointer"
                />
                {app1File && (
                  <span className="text-[10px] font-mono text-[#00C896] block mt-1">
                    Selected: {app1File.name} ({(app1File.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>

            {/* App #2 Box */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E6EDF3] border-b border-[#30363D] pb-2">
                <Building2 size={16} className="text-[#7C3AED]" /> Application #2 (Secondary Tenant)
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8B949E] uppercase block mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={app2Name}
                  onChange={(e) => setApp2Name(e.target.value)}
                  placeholder="e.g. Healthcare Patient Portal"
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg px-3 py-2 text-xs text-[#E6EDF3] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8B949E] uppercase block mb-1">
                  Upload Application #2 SBOM File
                </label>
                <input
                  type="file"
                  accept=".json,.spdx,.xml"
                  onChange={(e) => setApp2File(e.target.files?.[0] || null)}
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg p-2 text-xs text-[#E6EDF3] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#7C3AED]/20 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/30 cursor-pointer"
                />
                {app2File && (
                  <span className="text-[10px] font-mono text-[#7C3AED] block mt-1">
                    Selected: {app2File.name} ({(app2File.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!app1Name.trim() || !app1File || isUploadingMulti}
              className="px-6 py-3 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105"
            >
              {isUploadingMulti ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              Ingest Both Application SBOMs & Build Portfolio Graph
            </button>
          </div>
        </form>
      </div>

      {/* DEMO CONTROL PANEL (VISIBLE IF TENANTS ARE REGISTERED) */}
      {tenants.length > 0 && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E84040] flex items-center gap-2">
              <Zap size={16} /> Cross-Tenant Supply Chain Attack Propagation Simulator
            </h4>
            <span className="text-[10px] font-mono text-[#8B949E]">
              300ms Staggered Visual Broadcast Across Registered Graph
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Target Package Presets */}
            <div className="md:col-span-6 space-y-2">
              <label className="text-xs font-bold text-[#E6EDF3] block">Package to Compromise:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'lodash', label: 'lodash (CVE-2026-3891)' },
                  { name: 'log4j-core', label: 'log4j-core (CVE-2021-44228)' },
                  { name: 'axios', label: 'axios (CVE-2026-1182)' }
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPackageName(p.name)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      packageName === p.name
                        ? 'bg-[#E84040]/20 text-[#E84040] border-[#E84040]'
                        : 'bg-[#0D1117] text-[#8B949E] border-[#30363D] hover:text-[#E6EDF3]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Score Slider */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-[#E6EDF3] block">
                Degraded Trust Score: <span className="text-[#E84040] font-mono font-extrabold">{newTrustScore}/100</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={newTrustScore}
                onChange={(e) => setNewTrustScore(Number(e.target.value))}
                className="w-full h-2 bg-[#0D1117] rounded-lg appearance-none cursor-pointer accent-[#E84040]"
              />
            </div>

            {/* Simulate Action Button */}
            <div className="md:col-span-3">
              <button
                onClick={() => handleSimulateAttack(packageName)}
                disabled={isSimulating}
                className="w-full py-3 bg-[#E84040] hover:bg-[#c93232] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-105"
              >
                {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <AlertOctagon size={16} />}
                Simulate Attack & Propagate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER DETAILED TECHNICAL EXPLANATION PANEL */}
      {(isAnyCritical || impactBannerText) && tenants.length > 0 && (
        <div className="bg-[#161B22] border-2 border-[#E84040]/60 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E84040]/10 text-[#E84040] rounded-xl border border-[#E84040]/30">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#E6EDF3] uppercase tracking-wider flex items-center gap-2">
                  Detailed Explanation: What Just Happened Across Your Enterprise Portfolio
                </h4>
                <p className="text-xs text-[#8B949E] font-mono mt-0.5">
                  Technical Analysis of Cross-Tenant Blast Radius & ADTG Graph Signal Propagation
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-[#E84040] px-3 py-1 bg-[#E84040]/10 border border-[#E84040]/30 rounded-full animate-pulse">
              LIVE ATTACK PROPAGATION ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Step 1 & 2 */}
            <div className="space-y-4 bg-[#0D1117] border border-[#30363D] rounded-xl p-4">
              <div className="space-y-1">
                <h5 className="font-bold text-[#E84040] uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <Zap size={14} /> 1. Zero-Day Vulnerability Discovery
                </h5>
                <p className="text-[#E6EDF3] leading-relaxed">
                  A high-severity vulnerability was flagged on open-source package <code className="bg-[#21262D] text-[#E84040] px-1.5 py-0.5 rounded font-mono font-bold">{packageName}</code>, dropping its global ADTG Trust Score to <span className="text-[#E84040] font-mono font-bold">{newTrustScore}/100</span>.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-[#30363D]">
                <h5 className="font-bold text-[#7C3AED] uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <Layers size={14} /> 2. Shared Neo4j Graph Layer Resolution
                </h5>
                <p className="text-[#E6EDF3] leading-relaxed">
                  Instead of storing isolated package lists per app, ThreatMesh maintains a single <code className="bg-[#21262D] text-[#00C896] px-1.5 py-0.5 rounded font-mono">Package</code> node in Neo4j. The node is connected via <code className="text-[#00C896] font-mono">HAS_PACKAGE</code> edges across {tenants.length} registered tenant application scan graphs.
                </p>
              </div>
            </div>

            {/* Step 3 & 4 */}
            <div className="space-y-4 bg-[#0D1117] border border-[#30363D] rounded-xl p-4">
              <div className="space-y-1">
                <h5 className="font-bold text-[#F0A500] uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <Radio size={14} /> 3. Staggered 300ms WebSocket Propagation
                </h5>
                <p className="text-[#E6EDF3] font-mono text-[11px] leading-relaxed">
                  All registered tenant dashboards were notified asynchronously via WebSocket, updating their health score gauges with a 300ms visual stagger.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-[#30363D]">
                <h5 className="font-bold text-[#00C896] uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <ShieldCheck size={14} /> 4. Enterprise CISO Value Proposition
                </h5>
                <p className="text-[#8B949E] leading-relaxed">
                  Enterprise security teams no longer need manual alert correlation across isolated tools. A threat identified in one application immediately protects all apps across the enterprise from a single source of truth.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TENANT CARDS GRID OR EMPTY STATE */}
      {tenants.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3] flex items-center gap-2">
              <Activity size={15} className="text-[#00C896]" /> Registered Portfolio Applications ({tenants.length})
            </h4>
            <span className="text-[10px] font-mono text-[#8B949E]">
              Fetched live from GET /api/defend/tenants
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tenants.map((t) => (
              <TenantCard
                key={t.id}
                tenant={t}
                isSimulated={Boolean(simulatedTenants[t.id])}
                staggerMs={staggerDelays[t.id] || 0}
                lastCompromisedPackage={packageName}
              />
            ))}
          </div>
        </div>
      ) : (
        /* EMPTY STATE INSTRUCTIONS */
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-2xl flex items-center justify-center mx-auto text-[#7C3AED]">
            <Building2 size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h4 className="text-base font-extrabold text-[#E6EDF3]">
              No Applications Registered in Enterprise Portfolio Yet
            </h4>
            <p className="text-xs text-[#8B949E] leading-relaxed">
              Upload two application SBOM files above to build a shared dependency graph in Neo4j and test real-time cross-tenant blast radius propagation.
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-5 max-w-2xl mx-auto text-left space-y-3 text-xs">
            <h5 className="font-bold text-[#00C896] uppercase font-mono text-[11px] flex items-center gap-2">
              <Info size={14} /> How to Test Multi-Tenant Portfolio Defense for Hackathon Demo:
            </h5>
            <ol className="space-y-2 text-[#E6EDF3] list-decimal list-inside font-mono text-[11px] leading-relaxed">
              <li>
                Click <code className="bg-[#7C3AED]/20 text-[#7C3AED] px-1.5 py-0.5 rounded">⚡ 1-Click Hackathon Demo Setup</code> above to automatically ingest sample portfolio SBOMs into Neo4j.
              </li>
              <li>
                Or upload two custom SBOM files directly in the form above and click <code className="bg-[#00C896]/20 text-[#00C896] px-1.5 py-0.5 rounded">Ingest Both Application SBOMs</code>.
              </li>
              <li>
                Both applications will automatically link to shared package nodes in Neo4j (such as <code className="text-[#F0A500]">lodash</code> and <code className="text-[#F0A500]">axios</code>).
              </li>
              <li>
                Click <strong>"Simulate Attack & Propagate"</strong> to watch real-time cross-tenant blast radius propagation across both tenant cards simultaneously!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* OPTIONAL SINGLE SCAN REGISTRATION EXPANDABLE */}
      {tenants.length > 0 && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4">
          <form onSubmit={handleRegisterSingle} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Add 3rd Application Name (e.g. SaaS Analytics)"
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-xs text-[#E6EDF3] focus:outline-none focus:border-[#00C896]"
              />
            </div>
            <div className="flex-1 w-full">
              <input
                type="text"
                value={targetScanId}
                onChange={(e) => setTargetScanId(e.target.value)}
                placeholder="Scan ID (e.g. scan-123)"
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-xs text-[#E6EDF3] font-mono focus:outline-none focus:border-[#00C896]"
              />
            </div>
            <button
              type="submit"
              disabled={!tenantName.trim() || !targetScanId.trim() || isRegistering}
              className="w-full sm:w-auto px-4 py-2 bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] font-bold text-xs rounded-lg border border-[#30363D] transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {isRegistering ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Single Existing Scan ID
            </button>
          </form>
        </div>
      )}

      {/* PROPAGATION EVENT LOG STREAM */}
      {propagationLogs.length > 0 && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3] flex items-center gap-2">
            <Zap size={15} className="text-[#E84040]" /> Real-Time Cross-Tenant WebSocket Event Stream
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {propagationLogs.map((log, idx) => (
              <div key={idx} className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E84040] flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Compromise Event on {log.package_name} (Trust Score: {log.new_trust_score})
                  </span>
                  <span className="text-[10px] text-[#8B949E]">
                    {log.affected_tenants.length} Portfolio Apps Alerted
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {log.affected_tenants.map((at) => (
                    <span key={at.tenant_id} className="text-[10px] bg-[#E84040]/10 border border-[#E84040]/30 text-[#E84040] px-2 py-0.5 rounded flex items-center gap-1">
                      {at.tenant_name}: {at.old_score.toFixed(1)} &rarr; {at.new_score.toFixed(1)} (+{at.stagger_ms || 0}ms)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
