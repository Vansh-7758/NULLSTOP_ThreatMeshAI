// frontend/components/defend/TenantCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Tenant } from '@/types';
import {
  Building2,
  ShieldAlert,
  CheckCircle2,
  Server,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  Info,
  ShieldCheck
} from 'lucide-react';

interface TenantCardProps {
  tenant: Tenant;
  isSimulated?: boolean;
  staggerMs?: number;
  lastCompromisedPackage?: string;
}

export default function TenantCard({
  tenant,
  isSimulated,
  staggerMs = 0,
  lastCompromisedPackage = 'lodash'
}: TenantCardProps) {
  const score = tenant.cyber_health_score ?? 88.5;
  const isCritical = score < 50;
  const isWarn = score >= 50 && score < 75;

  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Auto-expand explanation when attack is simulated
  useEffect(() => {
    if (isSimulated || isCritical) {
      setShowExplanation(true);
    }
  }, [isSimulated, isCritical]);

  const sharedPkgs: string[] =
    tenant.shared_packages && tenant.shared_packages.length > 0
      ? tenant.shared_packages
      : ['lodash', 'axios', 'react', 'log4j-core'];
  const pkgName = lastCompromisedPackage || 'lodash';
  const isAttacked = Boolean(
    isSimulated || isCritical || isWarn || score < 75 || (tenant.critical_packages_count && tenant.critical_packages_count > 0)
  );

  // Auto-expand explanation when attack is simulated or tenant is attacked
  useEffect(() => {
    if (isAttacked) {
      setShowExplanation(true);
    }
  }, [isAttacked]);

  return (
    <div
      style={{
        transitionDelay: isSimulated ? `${staggerMs}ms` : '0ms'
      }}
      className={`bg-[#161B22] rounded-2xl p-5 border flex flex-col justify-between space-y-4 shadow-lg transition-all duration-500 hover:border-[#7C3AED]/50 ${
        isAttacked
          ? 'border-[#E84040] shadow-[0_0_25px_rgba(232,64,64,0.35)] ring-2 ring-[#E84040]/50 scale-[1.02]'
          : 'border-[#30363D]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isCritical
                ? 'bg-[#E84040]/10 text-[#E84040] border-[#E84040]/30'
                : isWarn
                ? 'bg-[#F0A500]/10 text-[#F0A500] border-[#F0A500]/30'
                : 'bg-[#00C896]/10 text-[#00C896] border-[#00C896]/30'
            }`}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#E6EDF3] leading-snug">{tenant.name}</h4>
            <span className="text-[10px] font-mono text-[#8B949E] block mt-0.5">
              ID: {tenant.id}
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold border ${
            isCritical
              ? 'text-[#E84040] bg-[#E84040]/15 border-[#E84040]/40'
              : isWarn
              ? 'text-[#F0A500] bg-[#F0A500]/15 border-[#F0A500]/40'
              : 'text-[#00C896] bg-[#00C896]/15 border-[#00C896]/40'
          }`}
        >
          {isCritical ? 'CRITICAL RISK' : isWarn ? 'WARNING' : 'HEALTHY'}
        </span>
      </div>

      {/* Cyber Health Score Circular Meter & Monitored Info */}
      <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4 flex items-center justify-between gap-4">
        {/* Circular Gauge */}
        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[#30363D]"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`transition-all duration-700 ease-out ${
                isCritical ? 'text-[#E84040]' : isWarn ? 'text-[#F0A500]' : 'text-[#00C896]'
              }`}
              strokeDasharray={`${score}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-center">
            <span
              className={`text-xs font-black block leading-none ${
                isCritical ? 'text-[#E84040]' : isWarn ? 'text-[#F0A500]' : 'text-[#00C896]'
              }`}
            >
              {score.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="text-right space-y-1">
          <span className="text-[10px] font-mono text-[#8B949E] uppercase block">
            ADTG Monitored Graph
          </span>
          <span className="text-xs font-bold text-[#E6EDF3] block flex items-center justify-end gap-1">
            <Server size={13} className="text-[#00C896]" /> {tenant.packages_count || 40} Packages
          </span>
          {isAttacked ? (
            <span className="text-[10px] font-mono text-[#E84040] font-bold block flex items-center justify-end gap-1">
              <ShieldAlert size={11} /> {tenant.critical_packages_count || 1} Compromised Node
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#00C896] block flex items-center justify-end gap-1">
              <CheckCircle2 size={11} /> All Nodes Clean
            </span>
          )}
        </div>
      </div>

      {/* Shared ADTG Graph Packages List */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono text-[#8B949E] uppercase block flex items-center gap-1">
          <Layers size={12} className="text-[#7C3AED]" /> Shared ADTG Packages:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {sharedPkgs.map((pkg) => (
            <span
              key={pkg}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                isAttacked && pkg === pkgName
                  ? 'bg-[#E84040]/20 text-[#E84040] border-[#E84040]/50 font-extrabold animate-pulse'
                  : 'bg-[#21262D] text-[#E6EDF3] border-[#30363D]'
              }`}
            >
              {pkg}
            </span>
          ))}
        </div>
      </div>

      {/* Live Blast Radius Alert Indicator */}
      {isAttacked && (
        <div
          style={{ transitionDelay: `${staggerMs}ms` }}
          className="bg-[#E84040]/15 border border-[#E84040]/40 rounded-xl p-2.5 text-[11px] text-[#E84040] font-mono flex items-center gap-2 animate-bounce shadow-sm"
        >
          <ShieldAlert size={14} className="shrink-0" />
          <span className="font-bold">
            BLAST RADIUS ALERT (+{staggerMs}ms): Health score degraded across shared ADTG graph layer!
          </span>
        </div>
      )}

      {/* Detailed Textual Explanation Toggle & Card Panel */}
      <div className="pt-2 border-t border-[#30363D]">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between py-1.5 px-2 bg-[#0D1117] hover:bg-[#21262D] rounded-lg text-[11px] font-mono text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
        >
          <span className="flex items-center gap-1.5 font-bold text-[#7C3AED]">
            <FileText size={13} />
            {showExplanation ? 'Hide Detailed Analysis' : 'What Just Happened? (Detailed Analysis)'}
          </span>
          {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 p-3.5 bg-[#0D1117] border border-[#30363D] rounded-xl text-xs space-y-2.5 animate-in fade-in duration-200">
            {isAttacked ? (
              <>
                <div className="flex items-center gap-2 text-[#E84040] font-extrabold font-mono text-[11px] border-b border-[#E84040]/30 pb-1.5">
                  <Zap size={14} /> Zero-Day Attack Impact Analysis ({tenant.name})
                </div>

                <p className="text-[#E6EDF3] leading-relaxed">
                  <strong>Vulnerability Discovery:</strong> A high-severity supply chain vulnerability was detected on shared package <code className="bg-[#21262D] px-1 py-0.5 rounded text-[#E84040] font-mono">{pkgName}</code>.
                </p>

                <p className="text-[#8B949E] leading-relaxed">
                  <strong>Graph Propagation Mechanics:</strong> Because <code className="bg-[#21262D] px-1 py-0.5 rounded text-[#E6EDF3] font-mono">{tenant.name}</code> is connected to <code className="bg-[#21262D] px-1 py-0.5 rounded text-[#E6EDF3] font-mono">{pkgName}</code> via Neo4j <code className="text-[#00C896] font-mono">HAS_PACKAGE</code> edges, the degraded trust score immediately forced a health drop down to <span className="text-[#E84040] font-bold font-mono">{score.toFixed(1)}/100</span> (+{staggerMs}ms alert delay).
                </p>

                <div className="bg-[#E84040]/10 border border-[#E84040]/30 p-2 rounded-lg text-[11px] text-[#E84040] leading-normal font-mono">
                  <strong>Recommended Defense Action:</strong> Isolate container instances utilizing {pkgName}, upgrade to verified non-vulnerable patch release, and trigger automated PR remediation.
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[#00C896] font-extrabold font-mono text-[11px] border-b border-[#00C896]/30 pb-1.5">
                  <ShieldCheck size={14} /> Baseline Security Posture ({tenant.name})
                </div>

                <p className="text-[#E6EDF3] leading-relaxed">
                  <strong>Status Summary:</strong> All {tenant.packages_count || 40} open-source dependencies in the ADTG graph layer are currently evaluated as clean and uncompromised.
                </p>

                <p className="text-[#8B949E] leading-relaxed">
                  <strong>Cross-Tenant Guardrail:</strong> Shared packages (<code className="bg-[#21262D] px-1 py-0.5 rounded text-[#E6EDF3] font-mono">lodash</code>, <code className="bg-[#21262D] px-1 py-0.5 rounded text-[#E6EDF3] font-mono">axios</code>, <code className="bg-[#21262D] px-1 py-0.5 rounded text-[#E6EDF3] font-mono">react</code>) are continuously monitored via real-time WebSocket threat feeds.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
