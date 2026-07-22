'use client';
import { motion } from 'framer-motion';
import { GitCommit, FileSearch, Download, TrendingDown, Network, Brain, Shield, GitPullRequest, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AttackReplayTimelineProps {
  active: boolean;
  onReplay: () => void;
}

const steps = [
  { id: 1, icon: GitCommit, title: 'Developer commits code', desc: 'Code changes pushed to repository.' },
  { id: 2, icon: FileSearch, title: 'SBOM diffed', desc: 'New dependency detected in manifest.' },
  { id: 3, icon: Download, title: 'ThreatMesh fetches data', desc: 'Live CVE and threat intel gathered.' },
  { id: 4, icon: TrendingDown, title: 'Trust score drops', desc: 'Score plummets from 85 to 23.' },
  { id: 5, icon: Network, title: 'Graph reachability', desc: 'Attack path identified in dependency tree.' },
  { id: 6, icon: Brain, title: 'AI Council analyzes', desc: 'Severity and exploitability assessed.' },
  { id: 7, icon: Shield, title: 'Patch Agent', desc: 'Safe version recommended for update.' },
  { id: 8, icon: GitPullRequest, title: 'GitHub PR generated', desc: 'Auto-remediation PR created.' },
];

export default function AttackReplayTimeline({ active, onReplay }: AttackReplayTimelineProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setCurrentStep(0);
      return;
    }
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step > steps.length) {
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6 text-[#E6EDF3]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Attack Replay Timeline</h2>
        <button 
          onClick={() => { setCurrentStep(0); onReplay(); }}
          className="flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
        >
          <RotateCcw size={16} /> Replay
        </button>
      </div>

      <div className="relative border-l-2 border-[#30363D] ml-4 space-y-8">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > idx;
          const isActive = currentStep === idx + 1;
          const isPending = currentStep < idx + 1;
          const Icon = step.icon;

          return (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
              className={`relative pl-8 ${isPending ? 'grayscale' : ''}`}
            >
              <motion.div 
                className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-[#161B22] flex items-center justify-center
                  ${isCompleted ? 'bg-[#00C896]' : isActive ? 'bg-[#F0A500]' : 'bg-[#30363D]'}`}
                animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
              />
              
              <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4 flex items-start gap-4">
                <div className={`p-2 rounded-md ${isCompleted ? 'bg-[#00C896] text-[#0D1117]' : isActive ? 'bg-[#F0A500] text-[#0D1117]' : 'bg-[#30363D] text-[#8B949E]'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-[#8B949E] mt-1">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
