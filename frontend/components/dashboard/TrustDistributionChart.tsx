'use client'

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrustDistribution } from '@/types';

export default function TrustDistributionChart({ distribution }: { distribution: TrustDistribution }) {
  const data = [
    { name: 'Trusted', value: distribution.trusted, color: '#00C896' },
    { name: 'Watch', value: distribution.watch, color: '#F0A500' },
    { name: 'At Risk', value: distribution.at_risk, color: '#E84040' },
  ];
  
  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  if (total === 0) {
    return <div className="bg-card border border-border p-6 rounded-xl flex items-center justify-center h-64 text-text-secondary">No data available</div>;
  }

  return (
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col h-full">
      <h3 className="text-lg font-bold mb-4">Trust Distribution</h3>
      <div className="flex-1 relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#161B22" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#E6EDF3' }}
              itemStyle={{ color: '#E6EDF3' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-text-secondary">Total</span>
        </div>
      </div>
    </div>
  );
}
