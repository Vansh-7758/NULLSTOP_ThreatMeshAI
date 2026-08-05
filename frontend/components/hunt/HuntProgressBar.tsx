// frontend/components/hunt/HuntProgressBar.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { getHuntStatus } from '@/lib/api';
import { HuntStatus } from '@/types';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface HuntProgressBarProps {
  scanId: string;
  onCompleted?: () => void;
}

export default function HuntProgressBar({ scanId, onCompleted }: HuntProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [status, setStatus] = useState<HuntStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!scanId) return;
    try {
      const data = await getHuntStatus(scanId);
      setStatus(data);
      if (data.status === 'completed' && onCompleted) {
        onCompleted();
      }
    } catch (e) {
      console.error('Error fetching hunt status:', e);
    }
  }, [scanId, onCompleted]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const total = status?.total_packages || 1;
  const analyzed = status?.packages_analyzed || 0;
  const isCompleted = status?.status === 'completed' || (total > 0 && analyzed >= total);
  const percentage = isCompleted ? 100 : Math.min(100, Math.round((analyzed / total) * 100));

  const currentPkg = status?.current_package || '';
  const currentAgent = status?.current_agent || 'AI Council';

  return (
    <div className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="text-[#00C896]" size={16} />
          ) : (
            <Loader2 className="animate-spin text-[#F0A500]" size={16} />
          )}
          <span className="font-bold text-[#E6EDF3]">
            {isCompleted ? (
              `Hunt complete — ${status?.playbooks_generated || analyzed} playbooks generated`
            ) : (
              `Analyzing ${currentPkg || 'packages'} (${analyzed + 1} of ${total}) — ${currentAgent}`
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-[#00C896] font-bold">{percentage}%</span>
          <span className="text-[#8B949E]">({analyzed}/{total} Packages)</span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2.5 bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]/60 relative">
        <motion.div
          className="h-full bg-[#00C896] rounded-full"
          initial={shouldReduceMotion ? false : { width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
