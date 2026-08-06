// frontend/components/dashboard/TrustDistributionChart.tsx
'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Package } from '@/types';

interface TrustDistributionChartProps {
  packages: Package[];
}

export default function TrustDistributionChart({ packages }: TrustDistributionChartProps) {
  const distribution = React.useMemo(() => {
    let trusted = 0;
    let watch = 0;
    let atRisk = 0;

    packages.forEach((pkg) => {
      const score = pkg.trust_score ?? 100;
      if (score >= 80) trusted++;
      else if (score >= 50) watch++;
      else atRisk++;
    });

    return [
      { name: 'Trusted (80-100)', value: trusted, color: '#22c55e' },
      { name: 'Watchlist (50-79)', value: watch, color: '#f59e0b' },
      { name: 'At Risk (0-49)', value: atRisk, color: '#ef4444' }
    ];
  }, [packages]);

  const total = packages.length || 1;

  return (
    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #ED9E58, transparent)' }}
      />

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-[#A34054] uppercase tracking-widest font-['Plus_Jakarta_Sans']">
          TRUST SCORE DISTRIBUTION
        </h3>
        <span className="text-[11px] font-mono text-[#ED9E58] font-bold">
          {packages.length} Total Packages
        </span>
      </div>

      <div className="w-full h-44 relative my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={68}
              paddingAngle={4}
              dataKey="value"
            >
              {distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(27,25,49,0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="px-3 py-2 rounded-xl bg-[#1B1931]/95 border border-[rgba(163,64,84,0.3)] shadow-2xl backdrop-blur-xl text-xs font-mono">
                      <p className="font-bold text-white mb-1">{data.name}</p>
                      <p style={{ color: data.color }} className="font-bold">
                        {data.value} packages ({Math.round((data.value / total) * 100)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-3 gap-2 border-t border-[rgba(163,64,84,0.15)] pt-3">
        {distribution.map((item) => (
          <div key={item.name} className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="text-[10px] font-bold text-white font-mono">{item.value}</span>
            </div>
            <span className="text-[9px] font-semibold text-[#A34054] truncate max-w-full">
              {item.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
