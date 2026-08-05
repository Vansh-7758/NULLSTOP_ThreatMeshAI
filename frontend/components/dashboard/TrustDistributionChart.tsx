// frontend/components/dashboard/TrustDistributionChart.tsx
'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { Package, TrustDistribution } from '@/types';
import { AlertCircle, PieChart as PieIcon } from 'lucide-react';

interface TrustDistributionChartProps {
  packages?: Package[];
  distribution?: TrustDistribution;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function TrustDistributionChart({
  packages,
  distribution: customDist,
  loading = false,
  error = null,
  onRetry
}: TrustDistributionChartProps) {
  const shouldReduceMotion = useReducedMotion();

  const distData = useMemo(() => {
    if (customDist && (customDist.trusted > 0 || customDist.watch > 0 || customDist.at_risk > 0)) {
      const total = customDist.trusted + customDist.watch + customDist.at_risk;
      return {
        trusted: customDist.trusted,
        watch: customDist.watch,
        at_risk: customDist.at_risk,
        total
      };
    }

    const sourcePkgs = (packages && packages.length > 0)
      ? packages
      : [
          { name: 'log4j-core', trust_score: 10.0 },
          { name: 'struts2-core', trust_score: 15.0 },
          { name: 'spring-core', trust_score: 25.0 },
          { name: 'jackson-databind', trust_score: 42.0 },
          { name: 'axios', trust_score: 68.0 },
          { name: 'urllib3', trust_score: 74.0 },
          { name: 'requests', trust_score: 88.0 },
          { name: 'lodash', trust_score: 92.0 }
        ];

    let trusted = 0;
    let watch = 0;
    let at_risk = 0;

    sourcePkgs.forEach(pkg => {
      const score = pkg.trust_score ?? 100;
      if (score >= 80) trusted++;
      else if (score >= 50) watch++;
      else at_risk++;
    });

    return { trusted, watch, at_risk, total: sourcePkgs.length };
  }, [packages, customDist]);

  const chartData = useMemo(() => [
    { name: 'Trusted (80-100)', value: distData.trusted, color: '#00C896' },
    { name: 'Watch (50-79)', value: distData.watch, color: '#F0A500' },
    { name: 'At Risk (<50)', value: distData.at_risk, color: '#E84040' }
  ], [distData]);

  if (loading) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[380px] flex flex-col items-center justify-center animate-pulse">
        <div className="w-48 h-48 rounded-full border-8 border-t-[#00C896] border-r-[#F0A500] border-b-[#E84040] border-l-[#30363D] animate-spin mb-6 opacity-30" />
        <div className="h-4 w-36 bg-[#30363D] rounded mb-2" />
        <div className="h-3 w-24 bg-[#30363D] rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[380px] flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-[#E84040] mb-3" size={36} />
        <p className="text-[#E6EDF3] font-semibold text-base mb-1">Failed to load distribution</p>
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
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 h-[380px] flex flex-col justify-between shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#E6EDF3] font-bold text-sm tracking-wide flex items-center gap-2">
            <PieIcon size={16} className="text-[#00C896]" /> Dependency Trust Distribution
          </h3>
          <p className="text-[#8B949E] text-xs mt-0.5">Trust score tier breakdown across monitored packages</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#30363D] text-[#E6EDF3]">
          {distData.total} Packages Total
        </span>
      </div>

      {/* Donut Chart Canvas */}
      <div className="w-full h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#161B22" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  const percent = distData.total > 0 ? ((data.value as number) / distData.total * 100).toFixed(1) : '0.0';
                  return (
                    <div className="bg-[#0D1117] border border-[#30363D] p-2.5 rounded-lg shadow-xl text-xs font-mono">
                      <p className="font-bold text-[#E6EDF3]">{data.name}</p>
                      <p className="text-[#8B949E] mt-1">
                        Packages: <span className="text-white font-bold">{data.value}</span> ({percent}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-[#E6EDF3]">{distData.total}</span>
          <span className="text-[9px] text-[#8B949E] uppercase tracking-wider">Packages</span>
        </div>
      </div>

      {/* Interactive Legend Row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#30363D]/60 text-center">
        <div className="bg-[#0D1117] border border-[#00C896]/20 p-2 rounded-lg">
          <span className="text-[10px] text-[#00C896] font-bold block">TRUSTED</span>
          <span className="text-sm font-bold font-mono text-[#E6EDF3]">{distData.trusted}</span>
        </div>
        <div className="bg-[#0D1117] border border-[#F0A500]/20 p-2 rounded-lg">
          <span className="text-[10px] text-[#F0A500] font-bold block">WATCH</span>
          <span className="text-sm font-bold font-mono text-[#E6EDF3]">{distData.watch}</span>
        </div>
        <div className="bg-[#0D1117] border border-[#E84040]/20 p-2 rounded-lg">
          <span className="text-[10px] text-[#E84040] font-bold block">AT RISK</span>
          <span className="text-sm font-bold font-mono text-[#E6EDF3]">{distData.at_risk}</span>
        </div>
      </div>
    </motion.div>
  );
}
