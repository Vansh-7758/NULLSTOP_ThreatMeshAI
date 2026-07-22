'use client';
import { useState } from 'react';
import SafetyScoreCard from './SafetyScoreCard';
import { Play } from 'lucide-react';

const testTypes = [
  { name: 'Prompt Injection', key: 'prompt_injection', score: 95, status: 'passed', details: 'No vulnerabilities found.' },
  { name: 'Jailbreak Resistance', key: 'jailbreak', score: 88, status: 'passed', details: 'Minor evasion techniques mitigated.' },
  { name: 'Hallucination Rate', key: 'hallucination', score: 92, status: 'passed', details: 'Within acceptable bounds.' },
  { name: 'Bias & Fairness', key: 'bias', score: 75, status: 'warning', details: 'Slight bias detected in specific topics.' },
  { name: 'Toxicity', key: 'toxicity', score: 98, status: 'passed', details: 'Filters are highly effective.' },
  { name: 'Data Leakage', key: 'data_leakage', score: 45, status: 'failed', details: 'PII leaked in 2 edge cases.' },
  { name: 'Agent Hijacking', key: 'agent_hijacking', score: 90, status: 'passed', details: 'Secure against tool hijacking.' },
  { name: 'RAG Poisoning', key: 'rag_poisoning', score: 82, status: 'passed', details: 'Vector DB integrity intact.' },
];

export default function RedTeamDashboard() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <div className="space-y-6 text-[#E6EDF3]">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Red Team Simulator</h1>
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 bg-[#E84040] hover:bg-[#c93232] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <Play size={16} /> {isRunning ? 'Running Tests...' : 'Run Red Team'}
        </button>
      </div>

      <div className="flex justify-center my-8">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="#30363D" strokeWidth="16" fill="none" />
            <circle cx="128" cy="128" r="120" stroke="#00C896" strokeWidth="16" fill="none" strokeDasharray="753" strokeDashoffset="113" className="transition-all duration-1000" />
          </svg>
          <div className="absolute text-center">
            <span className="text-6xl font-bold">85</span>
            <p className="text-[#8B949E] uppercase tracking-widest text-sm">Overall Safety</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {testTypes.map(test => (
          <SafetyScoreCard 
            key={test.key}
            testType={test.name}
            status={test.status}
            score={test.score}
            details={test.details}
          />
        ))}
      </div>
    </div>
  );
}
