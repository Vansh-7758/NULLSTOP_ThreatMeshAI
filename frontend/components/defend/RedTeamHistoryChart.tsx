// frontend/components/defend/RedTeamHistoryChart.tsx
'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { RedTeamRunHistoryItem } from '@/types';
import { TrendingUp, History } from 'lucide-react';

interface RedTeamHistoryChartProps {
  history: RedTeamRunHistoryItem[];
}

export default function RedTeamHistoryChart({ history }: RedTeamHistoryChartProps) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 text-center text-xs text-[#8B949E]">
        No historical Red Team runs recorded yet for this scan.
      </div>
    );
  }

  // Format data chronological (oldest to newest)
  const chartData = [...history]
    .reverse()
    .map((item, idx) => {
      const dt = item.started_at ? new Date(item.started_at) : new Date();
      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = `${dt.getMonth() + 1}/${dt.getDate()}`;
      return {
        run: `Run #${history.length - idx}`,
        score: item.overall_score,
        label: `${dateStr} ${timeStr}`,
        mode: item.target_mode === 'external' ? 'External Endpoint' : 'Internal Demo'
      };
    });

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 space-y-4 shadow-md">
      <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[#00C896]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
            Historical AI Safety & Resilience Score Trend
          </h4>
        </div>
        <span className="text-[10px] font-mono text-[#8B949E]">
          {history.length} Completed Runs Recorded
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" opacity={0.5} />
            <XAxis dataKey="label" stroke="#8B949E" fontSize={10} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#8B949E" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0D1117',
                borderColor: '#30363D',
                borderRadius: '8px',
                color: '#E6EDF3',
                fontSize: '11px'
              }}
              formatter={(val: any) => [`${val}%`, 'Safety Score']}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#00C896"
              strokeWidth={2.5}
              dot={{ fill: '#00C896', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
