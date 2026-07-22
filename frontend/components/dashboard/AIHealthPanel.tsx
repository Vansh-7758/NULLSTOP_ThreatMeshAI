'use client'

import React from 'react';
import { AIHealthMetrics } from '@/types';
import { Shield, Brain, Lock, EyeOff, AlertOctagon, CheckCircle } from 'lucide-react';

export default function AIHealthPanel({ metrics }: { metrics: AIHealthMetrics }) {
  if (!metrics) return null;

  const cards = [
    { label: 'Safety Score', value: `${metrics.safety_score}%`, icon: Shield, color: metrics.safety_score > 90 ? 'text-accent' : 'text-warning' },
    { label: 'Hallucination Rate', value: `${(metrics.hallucination_rate * 100).toFixed(1)}%`, icon: Brain, color: metrics.hallucination_rate < 0.05 ? 'text-accent' : 'text-danger' },
    { label: 'Jailbreak Resist', value: `${metrics.jailbreak_resistance}%`, icon: Lock, color: metrics.jailbreak_resistance > 95 ? 'text-accent' : 'text-warning' },
    { label: 'Unsafe Prompts', value: metrics.unsafe_prompts_blocked, icon: EyeOff, color: 'text-text-secondary' },
    { label: 'Policy Violations', value: metrics.policy_violations, icon: AlertOctagon, color: metrics.policy_violations === 0 ? 'text-accent' : 'text-danger' },
    { label: 'Compliance Score', value: `${metrics.compliance_score}%`, icon: CheckCircle, color: metrics.compliance_score > 90 ? 'text-accent' : 'text-warning' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-bold">AI System Health</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-card p-4 flex flex-col items-center justify-center text-center">
            <card.icon className={`w-6 h-6 mb-2 ${card.color}`} />
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-text-secondary mt-1">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
