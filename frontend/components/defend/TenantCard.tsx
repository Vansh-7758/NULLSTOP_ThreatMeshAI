// frontend/components/defend/TenantCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ShieldAlert, Package, Layers, Activity } from 'lucide-react';
import { Tenant } from '@/types';

interface TenantCardProps {
  id?: string;
  name?: string;
  cyberHealthScore?: number;
  packagesCount?: number;
  sharedPackages?: string[];
  status?: string;
  criticalCount?: number;
  tenant?: Tenant;
  isSimulated?: boolean;
  staggerMs?: number;
  lastCompromisedPackage?: string;
}

export default function TenantCard({
  id,
  name,
  cyberHealthScore,
  packagesCount = 248,
  sharedPackages,
  status = 'active',
  criticalCount,
  tenant,
  isSimulated,
  staggerMs,
  lastCompromisedPackage
}: TenantCardProps) {
  const tenantId = id || tenant?.id || 'tenant-1';
  const tenantName = name || tenant?.name || 'Enterprise Tenant';
  const rawScore = cyberHealthScore ?? tenant?.cyber_health_score ?? 100;
  const score = Math.min(Math.max(Math.round(rawScore), 0), 100);
  const tenantShared = sharedPackages || tenant?.shared_packages || ['lodash', 'axios', 'react'];
  const tenantCritical = criticalCount ?? tenant?.critical_packages_count ?? (score < 50 ? 7 : 2);

  const getStatus = (s: number) => {
    if (s >= 80) return { label: 'HEALTHY', color: '#22c55e', bg: 'rgba(34,197,94,0.20)', border: 'rgba(34,197,94,0.40)', icon: ShieldCheck };
    if (s >= 50) return { label: 'WARNING', color: '#f59e0b', bg: 'rgba(245,158,11,0.20)', border: 'rgba(245,158,11,0.40)', icon: AlertTriangle };
    return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.20)', border: 'rgba(239,68,68,0.40)', icon: ShieldAlert };
  };

  const statusInfo = getStatus(score);
  const StatusIcon = statusInfo.icon;

  const r = 40;
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6 relative overflow-hidden group flex flex-col justify-between"
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${statusInfo.color}, transparent)` }}
      />

      <div>
        <div className="flex items-center justify-between mb-4 border-b border-[rgba(233,188,185,0.20)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[rgba(237,158,88,0.18)] border border-[rgba(237,158,88,0.35)] flex items-center justify-center">
              <Layers size={16} className="text-[#ED9E58]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans'] group-hover:text-[#ED9E58] transition-colors">
                {tenantName}
              </h3>
              <p className="text-[10px] font-mono text-[#CBD5E1]">ID: {tenantId}</p>
            </div>
          </div>

          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider"
            style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}
          >
            <StatusIcon size={11} /> {statusInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-4 items-center my-2">
          <div className="col-span-5 flex flex-col items-center">
            <div className="relative w-28 h-16 flex items-center justify-center">
              <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="9" strokeLinecap="round" />
                <motion.path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke={statusInfo.color}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                <span className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans'] leading-none">
                  {score}
                </span>
                <span className="text-[8px] font-mono font-extrabold text-[#ED9E58] uppercase">/ 100</span>
              </div>
            </div>
            <span className="text-[9px] font-extrabold text-[#ED9E58] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans']">
              Cyber Health
            </span>
          </div>

          <div className="col-span-7 space-y-2 border-l border-[rgba(233,188,185,0.20)] pl-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] text-[#CBD5E1] font-semibold flex items-center gap-1 font-sans">
                <Package size={12} className="text-[#ED9E58]" /> Total Packages:
              </span>
              <span className="font-mono font-extrabold text-white">{packagesCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] text-[#CBD5E1] font-semibold flex items-center gap-1 font-sans">
                <AlertTriangle size={12} className="text-[#ef4444]" /> Compromised:
              </span>
              <span className="font-mono font-extrabold text-[#ef4444]">{tenantCritical} pkgs</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] text-[#CBD5E1] font-semibold flex items-center gap-1 font-sans">
                <Activity size={12} className="text-[#22c55e]" /> Real-time Sync:
              </span>
              <span className="font-mono font-extrabold text-[#22c55e]">CONNECTED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(233,188,185,0.20)] pt-3 mt-4">
        <p className="text-[9px] font-extrabold text-[#ED9E58] uppercase tracking-widest mb-2 font-mono">
          Shared ADTG Packages:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tenantShared && tenantShared.length > 0 ? (
            tenantShared.map((pkg) => (
              <span
                key={pkg}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[rgba(237,158,88,0.18)] text-[#ED9E58] border border-[rgba(237,158,88,0.35)]"
              >
                {pkg}
              </span>
            ))
          ) : (
            <span className="text-[10px] font-mono text-[#CBD5E1]">No shared packages</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
