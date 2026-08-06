// frontend/app/defend/page.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MultiTenantSection from '@/components/defend/MultiTenantSection';
import ComplianceFullSection from '@/components/defend/ComplianceFullSection';
import RedTeamSection from '@/components/defend/RedTeamSection';
import VerificationPanel from '@/components/defend/VerificationPanel';
import GovernanceSection from '@/components/defend/GovernanceSection';

import { ShieldAlert, Users, FileCheck, Target, ShieldCheck, Lock } from 'lucide-react';

export default function DefendPage() {
  const [activeTab, setActiveTab] = useState<'multi-tenant' | 'compliance' | 'red-team' | 'verification' | 'governance'>('multi-tenant');

  const tabs = [
    { id: 'multi-tenant', label: 'Multi-Tenant ADTG', icon: Users },
    { id: 'compliance', label: 'Compliance Engine', icon: FileCheck },
    { id: 'red-team', label: 'AI Red Team Service', icon: Target },
    { id: 'verification', label: '3-Layer Verification', icon: ShieldCheck },
    { id: 'governance', label: 'Policy & Audit Events', icon: Lock }
  ];

  return (
    <div className="min-h-screen text-white p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto relative z-10 font-sans">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(239,68,68,0.20)] border border-[rgba(239,68,68,0.40)] flex items-center justify-center">
            <ShieldAlert className="text-[#ef4444]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              MODULE 3 — DEFEND Multi-Tenant Governance & AI Red Team
            </h1>
            <p className="text-xs text-[#CBD5E1] font-sans mt-0.5">
              Multi-tenant vulnerability propagation, full-spectrum compliance, 3-layer verification & automated AI Red Teaming
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Dock */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[rgba(233,188,185,0.20)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? 'bg-[rgba(237,158,88,0.18)] text-white border border-[rgba(237,158,88,0.45)] shadow-[0_0_20px_rgba(237,158,88,0.20)]'
                  : 'bg-[rgba(27,25,49,0.70)] text-[#CBD5E1] hover:text-white hover:bg-[rgba(255,255,255,0.10)] border border-[rgba(233,188,185,0.15)]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#ED9E58]' : 'text-[#ED9E58]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        {activeTab === 'multi-tenant' && <MultiTenantSection scanId="default" />}
        {activeTab === 'compliance' && <ComplianceFullSection scanId="default" />}
        {activeTab === 'red-team' && <RedTeamSection scanId="default" />}
        {activeTab === 'verification' && (
          <VerificationPanel
            scanId="default"
            onProceedToReport={() => setActiveTab('compliance')}
            onReviseAnswers={() => setActiveTab('compliance')}
          />
        )}
        {activeTab === 'governance' && <GovernanceSection scanId="default" />}
      </motion.div>
    </div>
  );
}
