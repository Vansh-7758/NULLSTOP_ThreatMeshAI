// frontend/components/dashboard/SummaryRow.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ShieldAlert, GitPullRequest } from 'lucide-react';

interface SummaryRowProps {
  totalPackages: number;
  atRiskCount: number;
  activeCVEs: number;
  openPRs: number;
}

export default function SummaryRow({
  totalPackages,
  atRiskCount,
  activeCVEs,
  openPRs
}: SummaryRowProps) {
  const cards = [
    {
      title: 'TOTAL PACKAGES',
      value: totalPackages,
      icon: ShieldCheck,
      color: '#ED9E58',
      glow: 'rgba(237,158,88,0.40)',
      borderColor: 'rgba(237,158,88,0.40)',
      subtext: 'Mapped in knowledge graph'
    },
    {
      title: 'AT-RISK COMPONENTS',
      value: atRiskCount,
      icon: AlertTriangle,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.40)',
      borderColor: 'rgba(245,158,11,0.40)',
      subtext: 'Trust score < 50 / 100'
    },
    {
      title: 'ACTIVE CVES',
      value: activeCVEs,
      icon: ShieldAlert,
      color: '#ef4444',
      glow: 'rgba(239,68,68,0.45)',
      borderColor: 'rgba(239,68,68,0.45)',
      subtext: 'Known vulnerabilities matched'
    },
    {
      title: 'AUTO REMEDIATION PRS',
      value: openPRs,
      icon: GitPullRequest,
      color: '#9A5FFD',
      glow: 'rgba(154,95,253,0.40)',
      borderColor: 'rgba(154,95,253,0.40)',
      subtext: 'Autonomous PRs ready to merge'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, i) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative glass-card p-6 overflow-hidden group cursor-pointer"
          >
            {/* Top gradient accent line */}
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }}
            />

            {/* Inner top glow background */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${card.color} 0%, transparent 70%)` }}
            />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-[#ED9E58] tracking-widest uppercase font-['Plus_Jakarta_Sans']">
                {card.title}
              </span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `${card.color}20`,
                  border: `1px solid ${card.color}40`
                }}
              >
                <Icon size={18} style={{ color: card.color }} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans']"
                style={{ textShadow: `0 0 24px ${card.glow}` }}
              >
                {card.value.toLocaleString()}
              </span>
            </div>

            <p className="text-[11px] font-semibold text-[#CBD5E1] mt-2">
              {card.subtext}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
