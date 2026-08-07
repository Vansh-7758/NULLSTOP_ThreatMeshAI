// frontend/app/scan/[scanId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Package, AttackPath, CVERecord, TrustScore, Playbook } from '@/types';
import { getPackages, getAttackPaths, getPlaybooks } from '@/lib/api';
import DependencyGraph from '@/components/graph/DependencyGraph';
import PackageSidePanel from '@/components/graph/PackageSidePanel';
import AttackReplayTimeline from '@/components/timeline/AttackReplayTimeline';
import { ChevronRight, ArrowLeft, MousePointerClick, AlertCircle } from 'lucide-react';

export default function ScanDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const scanId = (params?.scanId as string) || 'default';
  const preSelectedPackageName = searchParams?.get('package');

  const [packages, setPackages] = useState<Package[]>([]);
  const [attackPaths, setAttackPaths] = useState<AttackPath[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgs, paths, pbs] = await Promise.all([
        getPackages(scanId).catch(() => []),
        getAttackPaths(scanId).catch(() => []),
        getPlaybooks(scanId).catch(() => [])
      ]);
      const safePkgs = Array.isArray(pkgs) ? pkgs : [];
      const safePaths = Array.isArray(paths) ? paths : [];
      const safePbs = Array.isArray(pbs) ? pbs : [];

      setPackages(safePkgs);
      setAttackPaths(safePaths);
      setPlaybooks(safePbs);

      if (preSelectedPackageName && safePkgs.length > 0) {
        const found = safePkgs.find((p) => p.name === preSelectedPackageName);
        if (found) setSelectedPackage(found);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load scan details');
    } finally {
      setLoading(false);
    }
  }, [scanId, preSelectedPackageName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
  };

  const handleCloseSidePanel = () => {
    setSelectedPackage(null);
  };

  const safePackages = Array.isArray(packages) ? packages : [];
  const safeAttackPaths = Array.isArray(attackPaths) ? attackPaths : [];
  const safePlaybooks = Array.isArray(playbooks) ? playbooks : [];

  // Find playbook for selected package
  const selectedPlaybook = safePlaybooks.find(
    (pb) => selectedPackage && pb.package_name === selectedPackage.name
  );

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#8B949E]">
        <Link href="/" className="hover:text-[#00C896] flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="font-mono text-[#E6EDF3] font-semibold">Scan {scanId.slice(0, 8)}...</span>
      </div>

      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E6EDF3]">Supply Chain Knowledge Graph</h1>
          <p className="text-xs text-[#8B949E]">Interactive graph analysis, reachability paths, and ADTG trust breakdown</p>
        </div>
      </div>

      {error && (
        <div className="bg-[#E84040]/10 border border-[#E84040]/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#E84040]">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-[#30363D] hover:bg-[#8B949E]/20 text-[#E6EDF3] text-xs font-semibold rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-[580px]">
        {/* Left Panel: Graph Canvas (60% width -> 6 cols) */}
        <div className="lg:col-span-6 h-full">
          <DependencyGraph
            packages={safePackages}
            attackPaths={safeAttackPaths}
            selectedPackageId={selectedPackage?.name}
            onPackageSelect={handlePackageSelect}
            loading={loading}
          />
        </div>

        {/* Right Panel: Side Panel or Empty State (40% width -> 4 cols) */}
        <div className="lg:col-span-4 h-full bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden relative">
          {selectedPackage ? (
            <PackageSidePanel
              package={selectedPackage}
              scanId={scanId}
              attackPaths={safeAttackPaths}
              playbook={selectedPlaybook}
              onClose={handleCloseSidePanel}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="p-4 rounded-full bg-[#0D1117] border border-[#30363D] mb-4 text-[#8B949E]">
                <MousePointerClick size={36} />
              </div>
              <h3 className="text-base font-semibold text-[#E6EDF3] mb-1">Select a Dependency Node</h3>
              <p className="text-xs text-[#8B949E] max-w-[260px] leading-relaxed">
                Click any package in the knowledge graph on the left to inspect its ADTG score breakdown, active CVEs, and attack reachability path.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Attack Replay Timeline */}
      <div className="w-full">
        <AttackReplayTimeline
          scanData={{
            cve_count: safePackages.reduce((acc, p) => acc + (p.trust_score < 80 ? 1 : 0), 0),
            lowest_trust_score: safePackages.length > 0 ? Math.min(...safePackages.map((p) => p.trust_score)) : 22,
            target_package: selectedPackage?.name || 'log4j-core'
          }}
        />
      </div>
    </div>
  );
}
