'use client';
import { useState } from 'react';

const policiesData = [
  { id: '1', name: 'Jailbreak Prevention', desc: 'Blocks prompts attempting to bypass system instructions.', active: true, severity: 'High' },
  { id: '2', name: 'PII Masking', desc: 'Redacts personally identifiable information from inputs.', active: true, severity: 'Medium' },
  { id: '3', name: 'Code Injection Block', desc: 'Prevents malicious code execution via prompt payloads.', active: true, severity: 'Critical' },
  { id: '4', name: 'Tone & Bias Filter', desc: 'Flags outputs containing biased or toxic language.', active: false, severity: 'Low' },
];

export default function PolicyEngine() {
  const [policies, setPolicies] = useState(policiesData);

  const togglePolicy = (id: string) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6 text-[#E6EDF3]">
      <h2 className="text-lg font-semibold mb-4">Active Policies</h2>
      <div className="space-y-4">
        {policies.map(policy => (
          <div key={policy.id} className="flex items-center justify-between p-4 bg-[#0D1117] rounded-lg border border-[#30363D]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{policy.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-[#30363D] text-[#8B949E]">{policy.severity}</span>
              </div>
              <p className="text-sm text-[#8B949E] mt-1">{policy.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={policy.active} onChange={() => togglePolicy(policy.id)} />
              <div className="w-11 h-6 bg-[#30363D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C896]"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
