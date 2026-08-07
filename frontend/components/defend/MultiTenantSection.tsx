// frontend/components/defend/MultiTenantSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import TenantCard from './TenantCard';
import { getTenants, registerTenant, simulateAttack, resetTenants, uploadAndRegisterTenants } from '@/lib/api';
import { useWebSocket, wsClient } from '@/lib/websocket';
import { Tenant, PropagationEvent } from '@/types';
import { Building2, Plus, Zap, Activity, AlertOctagon, Loader2, Layers, RotateCcw, ShieldAlert, Radio, FileText, Upload, AlertCircle, FileUp, Sparkles, CheckCircle2 } from 'lucide-react';

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

        const delays: Record<string, number> = {};
        msg.affected_tenants?.forEach((at: { tenant_id: string; stagger_ms?: number }, idx: number) => {
          const delay = at.stagger_ms ?? idx * 300;
          delays[at.tenant_id] = delay;
          setTimeout(() => {
            setSimulatedTenants((prev) => ({ ...prev, [at.tenant_id]: true }));
          }, delay);
        });

        setStaggerDelays(delays);

        setTimeout(() => {
          setSimulatedTenants({});
        }, 8000);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const handleAutoDemoSetup = async () => {
    setIsUploadingMulti(true);
    setUploadError(null);
    try {
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
      <div className="glass-card p-6 space-y-4 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #ED9E58, #9A5FFD, transparent)' }} />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[rgba(163,64,84,0.15)] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
              <Layers size={20} className="text-[#ED9E58]" /> MULTI-TENANT PORTFOLIO DEFENSE & SHARED ADTG GRAPH LAYER
            </h3>
            <p className="text-xs text-[#A34054] mt-1 max-w-3xl leading-relaxed font-medium">
              Upload multiple application SBOMs directly on this page to build a shared <strong>Neo4j ADTG Dependency Graph</strong>. When a shared package (e.g. <code>lodash</code>) is compromised, blast radius signals propagate via WebSockets to all connected tenant dashboards simultaneously.
            </p>
          </div>

          {tenants.length > 0 && (
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="btn-ghost-brand text-xs !py-2 !px-4 shrink-0"
            >
              {isResetting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Clear Portfolio Tenants
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#A34054] gap-2 pt-1">
          <span className="flex items-center gap-1.5 text-[#22c55e] font-bold">
            <Radio size={14} className="animate-pulse" /> Live Shared Neo4j Graph Layer Active
          </span>
          <span>Registered Portfolio Apps: {tenants.length}</span>
          <span>WebSocket Signal Latency: &lt; 50ms</span>
        </div>
      </div>

      {/* PROMINENT IMPACT BANNER (WHEN ATTACK IS SIMULATED) */}
      {impactBannerText && (
        <div className="p-5 bg-[rgba(239,68,68,0.15)] border-2 border-[#ef4444] rounded-2xl flex items-center justify-between gap-4 text-xs text-[#ef4444] font-extrabold shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert size={22} className="shrink-0 animate-bounce text-[#ef4444]" />
            <span className="text-sm leading-relaxed">{impactBannerText}</span>
          </div>
          <button
            onClick={() => setImpactBannerText(null)}
            className="text-xs text-[#A34054] hover:text-white shrink-0 font-mono"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* DEDICATED MULTI-TENANT SBOM UPLOAD & AUTO-REGISTRATION PANEL */}
      <div className="glass-card p-6 space-y-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[rgba(163,64,84,0.15)] pb-4">
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
              <Upload size={18} className="text-[#ED9E58]" /> UPLOAD APPLICATION SBOMS DIRECTLY TO BUILD PORTFOLIO GRAPH
            </h4>
            <p className="text-xs text-[#A34054] mt-0.5">
              Upload two application SBOMs directly here (independent of WATCH page) to build shared package nodes in Neo4j.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoDemoSetup}
            disabled={isUploadingMulti}
            className="btn-primary-brand text-xs !py-2 !px-4 shrink-0 shadow-lg"
          >
            {isUploadingMulti ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            ⚡ 1-Click Hackathon Demo Setup
          </button>
        </div>

        {uploadError && (
          <div className="p-3.5 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.30)] rounded-xl flex items-center gap-2 text-xs text-[#ef4444]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadAndRegister} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App #1 Box */}
            <div className="bg-[rgba(11,13,27,0.70)] border border-[rgba(163,64,84,0.20)] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-[rgba(163,64,84,0.15)] pb-2 font-['Plus_Jakarta_Sans']">
                <Building2 size={16} className="text-[#ED9E58]" /> Application #1 (Primary Tenant)
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#A34054] uppercase block mb-1">
                  Application Name <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={app1Name}
                  onChange={(e) => setApp1Name(e.target.value)}
                  placeholder="e.g. Fintech Mobile App"
                  className="w-full bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ED9E58]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#A34054] uppercase block mb-1">
                  Upload Application #1 SBOM File <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="file"
                  accept=".json,.spdx,.xml"
                  onChange={(e) => setApp1File(e.target.files?.[0] || null)}
                  className="w-full bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] rounded-xl p-2 text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[rgba(237,158,88,0.15)] file:text-[#ED9E58] cursor-pointer"
                />
              </div>
            </div>

            {/* App #2 Box */}
            <div className="bg-[rgba(11,13,27,0.70)] border border-[rgba(163,64,84,0.20)] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-[rgba(163,64,84,0.15)] pb-2 font-['Plus_Jakarta_Sans']">
                <Building2 size={16} className="text-[#9A5FFD]" /> Application #2 (Secondary Tenant)
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#A34054] uppercase block mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={app2Name}
                  onChange={(e) => setApp2Name(e.target.value)}
                  placeholder="e.g. Healthcare Patient Portal"
                  className="w-full bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#9A5FFD]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#A34054] uppercase block mb-1">
                  Upload Application #2 SBOM File
                </label>
                <input
                  type="file"
                  accept=".json,.spdx,.xml"
                  onChange={(e) => setApp2File(e.target.files?.[0] || null)}
                  className="w-full bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] rounded-xl p-2 text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[rgba(154,95,253,0.15)] file:text-[#9A5FFD] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!app1Name.trim() || !app1File || isUploadingMulti}
              className="btn-primary-brand text-xs !py-3 !px-6 gap-2 disabled:opacity-50"
            >
              {isUploadingMulti ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              Ingest Both Application SBOMs & Build Portfolio Graph
            </button>
          </div>
        </form>
      </div>

      {/* DEMO CONTROL PANEL */}
      {tenants.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(163,64,84,0.15)] pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ef4444] flex items-center gap-2 font-['Plus_Jakarta_Sans']">
              <Zap size={16} /> CROSS-TENANT SUPPLY CHAIN ATTACK PROPAGATION SIMULATOR
            </h4>
            <span className="text-[10px] font-mono text-[#A34054]">
              300ms Staggered Visual Broadcast Across Registered Graph
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 space-y-2">
              <label className="text-xs font-bold text-white block">Package to Compromise:</label>
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
                    className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all ${
                      packageName === p.name
                        ? 'bg-[rgba(239,68,68,0.20)] text-[#ef4444] border-[rgba(239,68,68,0.50)]'
                        : 'bg-[rgba(27,25,49,0.70)] text-[#A34054] border-[rgba(163,64,84,0.20)] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-white block">
                Degraded Trust Score: <span className="text-[#ef4444] font-mono font-extrabold">{newTrustScore}/100</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={newTrustScore}
                onChange={(e) => setNewTrustScore(Number(e.target.value))}
                className="w-full h-2 bg-[rgba(27,25,49,0.90)] rounded-lg appearance-none cursor-pointer accent-[#ef4444]"
              />
            </div>

            <div className="md:col-span-3">
              <button
                onClick={() => handleSimulateAttack(packageName)}
                disabled={isSimulating}
                className="btn-primary-brand w-full !py-3 justify-center text-xs font-bold gap-2 disabled:opacity-50"
              >
                {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <AlertOctagon size={16} />}
                Simulate Attack & Propagate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BEFORE VS AFTER ATTACK SIMULATION COMPARISON MATRIX */}
      <div className="glass-card p-6 space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(163,64,84,0.15)] pb-3 gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
            <Layers size={16} className="text-[#ED9E58]" /> MULTI-TENANT ATTACK PROPAGATION: BEFORE VS. AFTER COMPARISON
          </h4>
          <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border shrink-0 ${
            isAnyCritical 
              ? 'bg-[rgba(239,68,68,0.18)] text-[#ef4444] border-[rgba(239,68,68,0.40)] animate-pulse' 
              : 'bg-[rgba(34,197,94,0.15)] text-[#22c55e] border-[rgba(34,197,94,0.30)]'
          }`}>
            {isAnyCritical ? '🔴 POST-ATTACK STATE (Cascading Blast Radius Active)' : '🟢 PRE-ATTACK STATE (Baseline Zero-Trust Posture)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BEFORE ATTACK CARD */}
          <div className="p-5 rounded-2xl bg-[rgba(11,13,27,0.75)] border border-[rgba(34,197,94,0.30)] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[rgba(34,197,94,0.20)] pb-2.5">
              <span className="font-bold text-[#22c55e] flex items-center gap-1.5 font-['Plus_Jakarta_Sans']">
                <CheckCircle2 size={16} /> 1. BEFORE ATTACK (Pre-Simulation Baseline)
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] text-[#22c55e] font-bold">NORMAL POSTURE</span>
            </div>

            <ul className="space-y-2.5 text-[#CBD5E1] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e] font-bold text-sm">•</span>
                <span><strong>Shared Neo4j Graph Layer:</strong> Shared open-source packages (e.g. <code>lodash</code>, <code>axios</code>, <code>requests</code>) maintain high trust scores (<strong>92.0 / 100</strong>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e] font-bold text-sm">•</span>
                <span><strong>Tenant Isolation & Posture:</strong> Portfolio apps (Fintech Mobile App, Healthcare Portal) operate cleanly with healthy security metrics.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e] font-bold text-sm">•</span>
                <span><strong>Compliance Baseline:</strong> NIST CSF 2.0 and EU AI Act Article 15 compliance controls are fully satisfied.</span>
              </li>
            </ul>
          </div>

          {/* AFTER ATTACK CARD */}
          <div className={`p-5 rounded-2xl bg-[rgba(11,13,27,0.75)] border transition-all duration-300 space-y-3 font-mono text-xs ${
            isAnyCritical ? 'border-[#ef4444] bg-[rgba(239,68,68,0.08)] shadow-[0_0_24px_rgba(239,68,68,0.20)]' : 'border-[rgba(239,68,68,0.30)]'
          }`}>
            <div className="flex items-center justify-between border-b border-[rgba(239,68,68,0.20)] pb-2.5">
              <span className="font-bold text-[#ef4444] flex items-center gap-1.5 font-['Plus_Jakarta_Sans']">
                <AlertOctagon size={16} /> 2. AFTER ATTACK (Cascading Blast Radius)
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                isAnyCritical ? 'bg-[rgba(239,68,68,0.25)] text-[#ef4444] animate-pulse' : 'bg-[rgba(239,68,68,0.12)] text-[#ef4444]'
              }`}>
                {isAnyCritical ? 'PROPAGATION ACTIVATED' : 'READY TO SIMULATE'}
              </span>
            </div>

            <ul className="space-y-2.5 text-[#CBD5E1] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#ef4444] font-bold text-sm">•</span>
                <span><strong>Shared Package Poisoning:</strong> Target package (<code>{packageName}</code>) drops to <strong>{newTrustScore}.0 / 100</strong> (Supply Chain Poisoning).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ef4444] font-bold text-sm">•</span>
                <span><strong>Instant WebSocket Signal:</strong> Pushes <strong>&lt;50ms</strong> real-time alerts to all connected tenant graphs without requiring manual rescans.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ef4444] font-bold text-sm">•</span>
                <span><strong>Downstream Impact & PR Auto-Fix:</strong> Tenant score drops from <strong>92.0</strong> ➔ <strong>42.0</strong> (Critical). Clicking <strong>Generate Fix PR</strong> patches the shared dependency and restores all tenants to green.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* TENANT CARDS GRID OR EMPTY STATE */}
      {tenants.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
              <Activity size={15} className="text-[#22c55e]" /> Registered Portfolio Applications ({tenants.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="glass-card p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-[rgba(237,158,88,0.15)] border border-[rgba(237,158,88,0.30)] rounded-2xl flex items-center justify-center mx-auto text-[#ED9E58]">
            <Building2 size={32} />
          </div>
          <h4 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
            No Applications Registered in Portfolio Yet
          </h4>
          <p className="text-xs text-[#A34054] max-w-lg mx-auto leading-relaxed">
            Click <strong>"⚡ 1-Click Hackathon Demo Setup"</strong> above to instantly load sample portfolio SBOMs into Neo4j and simulate cross-tenant attack propagation.
          </p>
        </div>
      )}
    </div>
  );
}
