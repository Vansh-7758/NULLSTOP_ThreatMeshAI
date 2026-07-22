'use client'

import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Bug, GitPullRequest } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  totalPackages: number;
  atRiskCount: number;
  activeCVEs: number;
  openPRs: number;
}

const AnimatedCount = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = count;
    const duration = 1000;
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(start + (value - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{count}</span>;
}

export default function SummaryRow({ totalPackages, atRiskCount, activeCVEs, openPRs }: Props) {
  const cards = [
    { label: 'Total Packages', value: totalPackages, icon: Shield, color: 'text-accent' },
    { label: 'At Risk', value: atRiskCount, icon: AlertTriangle, color: 'text-danger' },
    { label: 'Active CVEs', value: activeCVEs, icon: Bug, color: 'text-warning' },
    { label: 'Open PRs', value: openPRs, icon: GitPullRequest, color: 'text-accent' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.02 }}
          className="bg-card border border-border rounded-xl p-6 flex items-center space-x-4 hover-glow"
        >
          <div className={`p-3 rounded-lg bg-background ${card.color}`}>
            <card.icon className="w-8 h-8" />
          </div>
          <div>
            <div className={`text-2xl font-bold ${card.color}`}>
              <AnimatedCount value={card.value} />
            </div>
            <div className="text-sm text-text-secondary">{card.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
