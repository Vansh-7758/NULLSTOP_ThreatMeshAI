// frontend/components/defend/ComplianceGauge.tsx
'use client';

import React from 'react';

interface ComplianceGaugeProps {
  score: number;
  color?: string;
  size?: number;
  label?: string;
  sublabel?: string;
}

export default function ComplianceGauge({
  score,
  color,
  size = 200,
  label = 'COMPLIANCE SCORE',
  sublabel = '5 Frameworks Assessed'
}: ComplianceGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score || 0));

  const getGaugeColor = (val: number) => {
    if (color) return color;
    if (val >= 70) return '#7C3AED'; // Purple primary
    if (val >= 50) return '#F59E0B'; // Amber warning
    return '#DC2626'; // Red critical
  };

  const activeColor = getGaugeColor(clampedScore);

  // SVG Gauge calculations (270-degree arc)
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const dashOffset = arcLength - (arcLength * clampedScore) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-225">
        {/* Background Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1E1E3A"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Value Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 10px ${activeColor}40)` }}
        />
      </svg>

      {/* Center Score Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-2">
        <span className="font-mono font-bold text-4xl tracking-tight text-[#F8FAFC]">
          {clampedScore.toFixed(1)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mt-1">
          {label}
        </span>
        <span className="text-[9px] text-[#475569] mt-0.5">
          {sublabel}
        </span>
      </div>
    </div>
  );
}
