// frontend/components/dashboard/CyberHealthGauge.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CyberHealthGaugeProps {
  score: number;
}

export default function CyberHealthGauge({ score }: CyberHealthGaugeProps) {
  const normalizedScore = Math.min(Math.max(Math.round(score), 0), 100);

  // Status classification
  const getStatus = (s: number) => {
    if (s >= 80) return { label: 'HEALTHY', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.30)', icon: ShieldCheck };
    if (s >= 50) return { label: 'MODERATE RISK', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', icon: AlertTriangle };
    return { label: 'CRITICAL RISK', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.30)', icon: ShieldAlert };
  };

  const status = getStatus(normalizedScore);
  const StatusIcon = status.icon;

  // Arc calculation
  const r = 54;
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference * (1 - normalizedScore / 100);

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-between relative overflow-hidden h-full">
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${status.color}, transparent)` }}
      />

      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: status.color }} />
          <h3 className="text-xs font-bold text-[#A34054] uppercase tracking-widest font-['Plus_Jakarta_Sans']">
            COMPOSITE CYBER HEALTH
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider"
          style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.color }}
        >
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-48 h-28 my-2 flex items-center justify-center">
        <svg viewBox="0 0 140 80" className="absolute inset-0 w-full h-full">
          {/* Background Track */}
          <path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Animated Gauge Arc */}
          <motion.path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="url(#healthGaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="healthGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Score Counter */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <motion.span
            className="text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans'] leading-none"
            style={{ textShadow: `0 0 24px ${status.color}60` }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {normalizedScore}
          </motion.span>
          <span className="text-[10px] font-semibold text-[#A34054] uppercase tracking-wider mt-1">
            out of 100
          </span>
        </div>
      </div>

      <div className="w-full flex items-center justify-between text-[10px] font-semibold text-[#E9BCB9]/60 border-t border-[rgba(163,64,84,0.15)] pt-3 mt-2">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> 0 - 49 Critical</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> 50 - 79 Watch</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> 80 - 100 Safe</span>
      </div>
    </div>
  );
}
