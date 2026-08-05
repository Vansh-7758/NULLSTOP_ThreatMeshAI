// frontend/components/graph/PackageSidePanel.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Package, CVERecord, TrustScore, Playbook, AttackPath } from '@/types';
import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import SeverityBadge from '@/components/shared/SeverityBadge';
import { generatePR } from '@/lib/api';
import { X, ExternalLink, GitPullRequest, ArrowRight, ShieldAlert, Sparkles, Loader2, Bug } from 'lucide-react';

interface PackageSidePanelProps {
  package: Package | null;
  cves?: CVERecord[];
  trustScore?: TrustScore | null;
  playbook?: Playbook | null;
  attackPaths?: AttackPath[];
  scanId?: string;
  onClose: () => void;
}

export default function PackageSidePanel({
  package: pkg,
  cves = [],
  trustScore,
  playbook,
  attackPaths = [],
  scanId = 'default',
  onClose
}: PackageSidePanelProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [prLoading, setPrLoading] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prError, setPrError] = useState<string | null>(null);

  if (!pkg) return null;

  const score = trustScore?.score ?? pkg.trust_score ?? 100;
  const breakdown = trustScore?.breakdown || {
    cve_impact: 100,
    epss_risk: 100,
    exploit_risk: 100,
    maintainer_health: 100,
    release_cadence: 100
  };

  // Find attack path involving this package
  const relevantAttackPath = attackPaths.find((ap) => {
    if (ap.target_package?.includes(pkg.name)) return true;
    if (Array.isArray(ap.path) && ap.path.some((p) => p.includes(pkg.name))) return true;
    return false;
  });

  const handleFixPackage = async () => {
    setPrLoading(true);
    setPrError(null);
    try {
      const res = await generatePR(scanId, pkg.name);
      if (res && res.pr_url) {
        setPrUrl(res.pr_url);
      }
    } catch (e: any) {
      setPrError(e.message || 'Failed to generate PR');
    } finally {
      setPrLoading(false);
    }
  };

  const adtgSignals = [
    { label: 'CVE Severity Impact (30%)', value: breakdown.cve_impact, color: '#E84040' },
    { label: 'EPSS Exploitation Risk (25%)', value: breakdown.epss_risk, color: '#F0A500' },
    { label: 'Exploit Code Status (20%)', value: breakdown.exploit_risk, color: '#B91C1C' },
    { label: 'Maintainer Health (15%)', value: breakdown.maintainer_health, color: '#8B5CF6' },
    { label: 'Release Cadence (10%)', value: breakdown.release_cadence, color: '#3B82F6' }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={shouldReduceMotion ? false : { x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-[440px] bg-[#161B22] border-l border-[#30363D] h-full flex flex-col justify-between shadow-2xl z-40 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#30363D] flex items-start justify-between bg-[#0D1117]/50">
          <div className="flex flex-col pr-2">
            <h2 className="text-xl font-bold text-[#E6EDF3] leading-tight truncate">{pkg.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-[#8B949E]">v{pkg.version}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#30363D]/40 text-[#8B949E] border border-[#30363D]">
                {pkg.ecosystem}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TrustScoreBadge score={score} size="lg" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#30363D]/40 hover:bg-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
          {/* Section 2: ADTG Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-3">
              ADTG Trust Score Breakdown
            </h3>
            <div className="space-y-2.5 bg-[#0D1117] border border-[#30363D] rounded-xl p-3.5">
              {adtgSignals.map((sig) => (
                <div key={sig.label} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8B949E] font-medium">{sig.label}</span>
                    <span className="font-mono font-bold text-[#E6EDF3]">{Math.round(sig.value)}/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#161B22] rounded-full overflow-hidden border border-[#30363D]/40">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, sig.value)}%`, backgroundColor: sig.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Attack Path (if applicable) */}
          {relevantAttackPath && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E84040] mb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Active Attack Propagation Path
              </h3>
              <div className="p-3 bg-[#E84040]/10 border border-[#E84040]/30 rounded-xl overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap">
                  {relevantAttackPath.path.map((step, idx) => (
                    <React.Fragment key={step + idx}>
                      <span className={`px-2 py-0.5 rounded font-bold ${step.includes(pkg.name) ? 'bg-[#E84040] text-[#0D1117]' : 'bg-[#161B22] text-[#E6EDF3] border border-[#30363D]'}`}>
                        {step}
                      </span>
                      {idx < relevantAttackPath.path.length - 1 && <ArrowRight size={12} className="text-[#E84040]" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 4: CVE List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-3 flex items-center justify-between">
              <span>Known Vulnerabilities ({cves.length})</span>
              <Bug size={14} />
            </h3>
            {cves.length === 0 ? (
              <p className="text-[#8B949E] text-xs italic bg-[#0D1117] p-3 rounded-lg border border-[#30363D]/40">
                No active CVEs associated with this component.
              </p>
            ) : (
              <div className="space-y-2.5">
                {cves.map((cve) => (
                  <div key={cve.cve_id} className="p-3 bg-[#0D1117] border border-[#30363D] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-[#E6EDF3] hover:text-[#00C896] flex items-center gap-1"
                      >
                        {cve.cve_id} <ExternalLink size={12} />
                      </a>
                      <SeverityBadge severity={cve.severity} />
                    </div>
                    <p className="text-[#8B949E] text-[11px] line-clamp-2">{cve.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-[#8B949E]">
                      <span>CVSS: <strong className="text-[#E6EDF3]">{cve.cvss_score}</strong></span>
                      <span>Exploitation Prob: <strong className="text-[#F0A500]">{(cve.epss_score * 100).toFixed(1)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="p-4 border-t border-[#30363D] bg-[#0D1117]/80 flex flex-col gap-2">
          {prUrl ? (
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <GitPullRequest size={15} /> View Generated PR
            </a>
          ) : (
            <button
              disabled={prLoading}
              onClick={handleFixPackage}
              className="w-full py-2 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {prLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating Remediation PR...
                </>
              ) : (
                <>
                  <GitPullRequest size={15} /> Fix Package & Generate PR
                </>
              )}
            </button>
          )}
          {prError && <p className="text-[10px] text-[#E84040] text-center">{prError}</p>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
