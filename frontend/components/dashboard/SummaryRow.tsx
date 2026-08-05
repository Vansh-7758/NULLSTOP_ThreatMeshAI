// frontend/components/dashboard/SummaryRow.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, AlertTriangle, Bug, GitPullRequest } from 'lucide-react';

interface SummaryRowProps {
  totalPackages?: number;
  atRiskCount?: number;
  activeCVEs?: number;
  openPRs?: number;
  loading?: boolean;
}

export default function SummaryRow({
  totalPackages = 0,
  atRiskCount = 0,
  activeCVEs = 0,
  openPRs = 0,
  loading = false
}: SummaryRowProps) {
  const shouldReduceMotion = useReducedMotion();

  const cards = [
    {
      id: 'total-packages',
      label: 'Total Packages',
      value: totalPackages,
      icon: Shield,
      iconColor: 'text-[#00C896]',
      valueColor: 'text-[#E6EDF3]'
    },
    {
      id: 'at-risk',
      label: 'Packages At Risk',
      value: atRiskCount,
      icon: AlertTriangle,
      iconColor: atRiskCount > 0 ? 'text-[#E84040]' : 'text-[#00C896]',
      valueColor: atRiskCount > 0 ? 'text-[#E84040]' : 'text-[#00C896]'
    },
    {
      id: 'active-cves',
      label: 'Active CVEs',
      value: activeCVEs,
      icon: Bug,
      iconColor: 'text-[#F0A500]',
      valueColor: activeCVEs > 0 ? 'text-[#F0A500]' : 'text-[#E6EDF3]'
    },
    {
      id: 'open-prs',
      label: 'Open Pull Requests',
      value: openPRs,
      icon: GitPullRequest,
      iconColor: 'text-[#00C896]',
      valueColor: 'text-[#E6EDF3]'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[110px] flex flex-col justify-between animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-[#30363D] rounded" />
              <div className="h-6 w-6 bg-[#30363D] rounded-full" />
            </div>
            <div className="h-8 w-16 bg-[#30363D] rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            variants={itemVariants}
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 flex flex-col justify-between hover:border-[#8B949E]/40 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#8B949E]">{card.label}</span>
              <div className="p-2 rounded-lg bg-[#0D1117] border border-[#30363D]/50">
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-[32px] font-bold leading-none tracking-tight ${card.valueColor}`}>
                {card.value}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
