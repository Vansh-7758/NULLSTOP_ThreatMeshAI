// frontend/app/hunt/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { triggerHunt, getHuntStatus, getHuntPlaybooks } from '@/lib/api';
import { HuntStatus, Playbook } from '@/types';

import CouncilPanel from '@/components/hunt/CouncilPanel';
import CopilotPanel from '@/components/hunt/CopilotPanel';
import PlaybookSection from '@/components/dashboard/PlaybookSection';
import SectionDivider from '@/components/landing/ui/SectionDivider';

import { Radar, Play } from 'lucide-react';

export default function HuntPage() {
  const [scanId, setScanId] = useState<string | null>(null);
  const [huntStatus, setHuntStatus] = useState<HuntStatus | null>(null);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('active_scan_id') || localStorage.getItem('scan_id') || 'default';
    setScanId(stored);
  }, []);

  const fetchHuntData = async (id: string) => {
    try {
      const [statusRes, pbsRes] = await Promise.all([
        getHuntStatus(id).catch(() => null),
        getHuntPlaybooks(id).catch(() => [])
      ]);

      if (statusRes) setHuntStatus(statusRes);
      if (pbsRes) setPlaybooks(pbsRes);
    } catch (e) {
      console.error('Error fetching hunt status:', e);
    }
  };

  useEffect(() => {
    if (!scanId) return;

    fetchHuntData(scanId);
    const interval = setInterval(() => {
      fetchHuntData(scanId);
    }, 4000);

    return () => clearInterval(interval);
  }, [scanId]);

  const handleStartHunt = async () => {
    if (!scanId) return;
    setTriggering(true);
    try {
      await triggerHunt(scanId);
      await fetchHuntData(scanId);
    } catch (e) {
      console.error('Failed to trigger hunt:', e);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto relative z-10 font-sans">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(154,95,253,0.18)] border border-[rgba(154,95,253,0.40)] flex items-center justify-center">
            <Radar className="text-[#9A5FFD]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              MODULE 2 — HUNT Autonomous Analysis & Copilot
            </h1>
            <p className="text-xs text-[#CBD5E1] font-sans mt-0.5">
              Multi-agent threat hunting, consensus remediation playbooks, and AI Copilot Q&A
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartHunt}
            disabled={triggering || huntStatus?.status === 'running'}
            className="btn-primary-brand text-xs font-bold gap-2 disabled:opacity-50"
          >
            <Play size={14} className="fill-current" />
            <span>{triggering ? 'Triggering AI Council...' : huntStatus?.status === 'running' ? 'Hunt in Progress...' : 'Start AI Threat Hunt'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <CouncilPanel
            scanId={scanId}
            currentPackage={huntStatus?.current_package || 'log4j-core'}
            packagesAnalyzed={huntStatus?.packages_analyzed || (playbooks.length > 0 ? playbooks.length : 4)}
            totalPackages={huntStatus?.total_packages || 8}
            status={huntStatus?.status || 'idle'}
          />

          <SectionDivider variant="glow" />

          <div className="w-full">
            <PlaybookSection scanId={scanId || 'default'} initialPlaybooks={playbooks} />
          </div>
        </div>

        <div className="lg:col-span-4 h-full">
          <CopilotPanel scanId={scanId || 'default'} />
        </div>
      </div>
    </div>
  );
}
