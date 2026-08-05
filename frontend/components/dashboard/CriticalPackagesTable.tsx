// frontend/components/dashboard/CriticalPackagesTable.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Package, AttackPath } from '@/types';
import { getPackages, generatePR, getAttackPaths } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import { GitPullRequest, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface CriticalPackagesTableProps {
  scanId?: string;
  initialPackages?: Package[];
  initialAttackPaths?: AttackPath[];
  onFix?: (packageName: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function CriticalPackagesTable({
  scanId = 'default',
  initialPackages,
  initialAttackPaths = [],
  onFix,
  loading: initialLoading = false,
  error: initialError = null
}: CriticalPackagesTableProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [packages, setPackages] = useState<Package[]>(initialPackages || []);
  const [attackPaths, setAttackPaths] = useState<AttackPath[]>(initialAttackPaths);
  const [loading, setLoading] = useState<boolean>(!initialPackages && initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  const [prLoadingMap, setPrLoadingMap] = useState<Record<string, boolean>>({});
  const [prUrlMap, setPrUrlMap] = useState<Record<string, string>>({});
  const [prErrorMap, setPrErrorMap] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    if (!scanId) return;
    setLoading(true);
    setError(null);
    try {
      const [pkgs, paths] = await Promise.all([
        getPackages(scanId).catch(() => []),
        getAttackPaths(scanId).catch(() => [])
      ]);
      setPackages(pkgs);
      setAttackPaths(paths);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    if (initialPackages && initialPackages.length > 0) {
      setPackages(initialPackages);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [fetchData, initialPackages]);

  // WebSocket refetch on trust score update
  useEffect(() => {
    const unsubscribe = wsClient.onTrustUpdate(() => {
      fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  // Reachable check: returns true if package name is in any attack path
  const reachableSet = useMemo(() => {
    const set = new Set<string>();
    attackPaths.forEach((ap) => {
      if (ap.target_package) {
        const pkgName = ap.target_package.split('@')[0];
        set.add(pkgName);
      }
      if (Array.isArray(ap.path)) {
        ap.path.forEach((p) => {
          const pkgName = p.split('@')[0];
          set.add(pkgName);
        });
      }
    });
    return set;
  }, [attackPaths]);

  // Top 10 sorted by trust score ascending
  const sortedPackages = useMemo(() => {
    return [...packages]
      .sort((a, b) => (a.trust_score ?? 100) - (b.trust_score ?? 100))
      .slice(0, 10);
  }, [packages]);

  const handleFix = async (e: React.MouseEvent, pkg: Package) => {
    e.stopPropagation();
    if (onFix) {
      onFix(pkg.name);
      return;
    }

    setPrLoadingMap((prev) => ({ ...prev, [pkg.name]: true }));
    setPrErrorMap((prev) => ({ ...prev, [pkg.name]: '' }));

    try {
      const res = await generatePR(scanId, pkg.name);
      if (res && res.pr_url) {
        setPrUrlMap((prev) => ({ ...prev, [pkg.name]: res.pr_url }));
      }
    } catch (err: any) {
      setPrErrorMap((prev) => ({ ...prev, [pkg.name]: err.message || 'PR failed' }));
    } finally {
      setPrLoadingMap((prev) => ({ ...prev, [pkg.name]: false }));
    }
  };

  const getEcosystemBadgeColor = (eco: string) => {
    const e = eco.toLowerCase();
    if (e === 'npm') return 'bg-[#E84040]/15 text-[#E84040] border-[#E84040]/30';
    if (e === 'pypi') return 'bg-[#00C896]/15 text-[#00C896] border-[#00C896]/30';
    if (e === 'maven') return 'bg-[#F0A500]/15 text-[#F0A500] border-[#F0A500]/30';
    return 'bg-[#8B949E]/15 text-[#8B949E] border-[#8B949E]/30';
  };

  if (loading) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[400px] flex flex-col justify-between animate-pulse">
        <div className="h-5 w-48 bg-[#30363D] rounded mb-4" />
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-[#30363D]/40 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[400px] flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-[#E84040] mb-3" size={36} />
        <p className="text-[#E6EDF3] font-semibold text-base mb-1">Failed to load critical packages</p>
        <p className="text-[#8B949E] text-xs mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-1.5 bg-[#30363D] hover:bg-[#8B949E]/20 text-[#E6EDF3] text-xs font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (sortedPackages.length === 0) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[400px] flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="text-[#00C896] mb-3" size={36} />
        <p className="text-[#E6EDF3] font-semibold text-base mb-1">No Critical Packages Found</p>
        <p className="text-[#8B949E] text-xs">All scanned dependencies have healthy trust scores.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 shadow-sm overflow-hidden flex flex-col h-[400px]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#E6EDF3]">Critical Packages</h3>
          <p className="text-xs text-[#8B949E]">Top 10 packages requiring immediate attention</p>
        </div>
        <span className="text-xs text-[#8B949E] font-medium">{sortedPackages.length} Flagged</span>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#30363D] text-[11px] text-[#8B949E] uppercase tracking-wider font-semibold">
              <th className="pb-3 pl-2">Package</th>
              <th className="pb-3">Version</th>
              <th className="pb-3">Trust Score</th>
              <th className="pb-3">Reachable</th>
              <th className="pb-3 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D]/40 text-xs">
            {sortedPackages.map((pkg) => {
              const score = pkg.trust_score ?? 100;
              const isReachable = reachableSet.has(pkg.name);
              const isCriticalGlow = score < 30;
              const isPrLoading = prLoadingMap[pkg.name];
              const prUrl = prUrlMap[pkg.name];
              const prError = prErrorMap[pkg.name];

              return (
                <tr
                  key={pkg.id || pkg.name}
                  onClick={() => router.push(`/scan/${scanId}?package=${pkg.name}`)}
                  className={`hover:bg-[#0D1117]/60 cursor-pointer transition-colors ${
                    isCriticalGlow ? 'border-l-2 border-l-[#E84040]' : ''
                  }`}
                >
                  {/* Name & Ecosystem */}
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#E6EDF3] hover:text-[#00C896] transition-colors">
                        {pkg.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono ${getEcosystemBadgeColor(pkg.ecosystem)}`}>
                        {pkg.ecosystem}
                      </span>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="py-3 text-[#8B949E] font-mono">{pkg.version}</td>

                  {/* Trust Score */}
                  <td className="py-3">
                    <div className="flex items-center gap-2 max-w-[120px]">
                      <TrustScoreBadge score={score} size="sm" />
                      <div className="w-16 h-1.5 bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]/40">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(5, score)}%`,
                            backgroundColor: score >= 80 ? '#00C896' : score >= 50 ? '#F0A500' : '#E84040'
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Reachable */}
                  <td className="py-3">
                    {isReachable ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#E84040]/15 text-[#E84040]">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#30363D]/40 text-[#8B949E]">
                        No
                      </span>
                    )}
                  </td>

                  {/* Fix Action */}
                  <td className="py-3 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                    {prUrl ? (
                      <a
                        href={prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#00C896]/15 hover:bg-[#00C896]/25 text-[#00C896] text-xs font-semibold rounded-md border border-[#00C896]/30 transition-colors"
                      >
                        <GitPullRequest size={12} /> PR Created
                      </a>
                    ) : (
                      <button
                        disabled={isPrLoading}
                        onClick={(e) => handleFix(e, pkg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#30363D] hover:bg-[#00C896] text-[#E6EDF3] hover:text-[#0D1117] text-xs font-semibold rounded-md transition-all disabled:opacity-50"
                      >
                        {isPrLoading ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            Fix Package <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    )}
                    {prError && <p className="text-[10px] text-[#E84040] mt-0.5 text-right">{prError}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
