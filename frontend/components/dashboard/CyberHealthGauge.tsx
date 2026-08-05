// frontend/components/dashboard/CyberHealthGauge.tsx
'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface CyberHealthGaugeProps {
  score?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function CyberHealthGauge({
  score = 100,
  loading = false,
  error = null,
  onRetry
}: CyberHealthGaugeProps) {
  const shouldReduceMotion = useReducedMotion();

  const clampedScore = useMemo(() => Math.max(0, Math.min(100, score)), [score]);

  const { color, label, statusColor, IconComponent } = useMemo(() => {
    if (clampedScore >= 80) {
      return { color: '#00C896', label: 'Healthy', statusColor: 'text-[#00C896]', IconComponent: ShieldCheck };
    } else if (clampedScore >= 60) {
      return { color: '#F0A500', label: 'Caution', statusColor: 'text-[#F0A500]', IconComponent: AlertTriangle };
    } else {
      return { color: '#E84040', label: 'At Risk', statusColor: 'text-[#E84040]', IconComponent: ShieldAlert };
    }
  }, [clampedScore]);

  // Gauge SVG math:
  // Radius = 100, Center = (140, 140), StrokeWidth = 18
  // 270 degrees arc: Circumference = 2 * PI * R = 628.318
  // 270 deg of 360 deg = 0.75 * 628.318 = 471.239 total arc length
  const radius = 100;
  const circumference = 2 * Math.PI * radius; // ~628.3
  const totalArcLength = 0.75 * circumference; // ~471.2
  const filledArcLength = (clampedScore / 100) * totalArcLength;
  const strokeDashoffset = totalArcLength - filledArcLength;

  if (loading) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[380px] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-[280px] h-[280px] relative flex items-center justify-center">
          <svg width="280" height="280" viewBox="0 0 280 280" className="transform rotate-[135deg]">
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="transparent"
              stroke="#30363D"
              strokeWidth="18"
              strokeDasharray={`${totalArcLength} ${circumference}`}
              strokeLinecap="round"
              className="animate-pulse opacity-40"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="h-10 w-20 bg-[#30363D] rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-[#30363D] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[380px] flex flex-col items-center justify-center text-center">
        <ShieldAlert className="text-[#E84040] mb-3" size={40} />
        <p className="text-[#E6EDF3] font-semibold text-base mb-1">Failed to calculate health score</p>
        <p className="text-[#8B949E] text-xs mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-1.5 bg-[#30363D] hover:bg-[#8B949E]/20 text-[#E6EDF3] text-xs font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 flex flex-col items-center justify-between h-[380px] relative"
    >
      <div className="w-full flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#E6EDF3]">Overall Health</h3>
        <span className="text-xs text-[#8B949E]">System Posture</span>
      </div>

      <div className="relative w-[280px] h-[250px] flex items-center justify-center mt-2">
        <svg width="280" height="280" viewBox="0 0 280 280" className="transform rotate-[135deg]">
          {/* Background Track Arc */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="transparent"
            stroke="#30363D"
            strokeWidth="18"
            strokeDasharray={`${totalArcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx="140"
            cy="140"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="18"
            strokeDasharray={`${totalArcLength} ${circumference}`}
            initial={shouldReduceMotion ? false : { strokeDashoffset: totalArcLength }}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Contents */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={clampedScore}
            className="text-[48px] font-bold leading-none tracking-tight mb-1"
            style={{ color }}
          >
            {Math.round(clampedScore)}
          </motion.span>
          <span className="text-[14px] text-[#8B949E] font-medium mb-1">Cyber Health Score</span>
          <div className="flex items-center gap-1.5 mt-1">
            <IconComponent size={16} style={{ color }} />
            <span className={`text-xs font-bold uppercase tracking-wider ${statusColor}`}>{label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
