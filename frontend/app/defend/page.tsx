// frontend/app/defend/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import GovernanceSection from '@/components/defend/GovernanceSection';
import RedTeamSection from '@/components/defend/RedTeamSection';
import MultiTenantSection from '@/components/defend/MultiTenantSection';
import ComplianceFullSection from '@/components/defend/ComplianceFullSection';
import { ShieldCheck, Flame, Building2, ClipboardCheck } from 'lucide-react';

export default function DefendPage() {
  const shouldReduceMotion = useReducedMotion();

  const [scanId, setScanId] = useState<string>('default');
  const [activeTab, setActiveTab] = useState<'governance' | 'compliance' | 'red_team' | 'multi_tenant'>('governance');

  useEffect(() => {
    const storedScanId =
      localStorage.getItem('active_scan_id') ||
      localStorage.getItem('scan_id') ||
      'default';
    setScanId(storedScanId);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] p-6 space-y-6">
      {/* Top Header & Tab Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#30363D] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#E6EDF3] flex items-center gap-2.5">
            <ShieldCheck size={26} className="text-[#00C896]" /> MODULE 3 — DEFEND Engine
          </h1>
          <p className="text-xs text-[#8B949E] mt-1">
            AI Governance & Guardrails, Full-Spectrum Regulatory Compliance, Red Team Simulator, and Multi-Tenant Trust Propagation.
          </p>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 bg-[#161B22] border border-[#30363D] rounded-xl p-1 shadow-inner self-start md:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('governance')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'governance'
                ? 'bg-[#00C896] text-[#0D1117] shadow-md'
                : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]/40'
            }`}
          >
            <ShieldCheck size={14} /> AI Governance & Guardrails
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'compliance'
                ? 'bg-[#7C3AED] text-[#F8FAFC] shadow-md'
                : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]/40'
            }`}
          >
            <ClipboardCheck size={14} /> Full-Spectrum Compliance
          </button>

          <button
            onClick={() => setActiveTab('red_team')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'red_team'
                ? 'bg-[#00C896] text-[#0D1117] shadow-md'
                : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]/40'
            }`}
          >
            <Flame size={14} /> AI Red Team Simulator
          </button>

          <button
            onClick={() => setActiveTab('multi_tenant')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'multi_tenant'
                ? 'bg-[#00C896] text-[#0D1117] shadow-md'
                : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]/40'
            }`}
          >
            <Building2 size={14} /> Multi-Tenant Propagation
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'governance' && (
          <motion.div
            key="tab-governance"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GovernanceSection scanId={scanId} />
          </motion.div>
        )}

        {activeTab === 'compliance' && (
          <motion.div
            key="tab-compliance"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ComplianceFullSection scanId={scanId} />
          </motion.div>
        )}

        {activeTab === 'red_team' && (
          <motion.div
            key="tab-redteam"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RedTeamSection scanId={scanId} />
          </motion.div>
        )}

        {activeTab === 'multi_tenant' && (
          <motion.div
            key="tab-multitenant"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <MultiTenantSection scanId={scanId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
