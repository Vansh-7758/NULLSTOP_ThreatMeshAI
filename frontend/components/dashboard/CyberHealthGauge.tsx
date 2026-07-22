'use client'

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function CyberHealthGauge({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const controls = useAnimation();
  
  useEffect(() => {
    let start = displayScore;
    const end = score;
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.floor(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
    controls.start({ strokeDashoffset: 283 - (283 * score) / 100 });
  }, [score, controls]);

  let color = '#E84040';
  if (score >= 80) color = '#00C896';
  else if (score >= 50) color = '#F0A500';

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card border border-border rounded-xl">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#30363D" strokeWidth="10" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray="283"
            initial={{ strokeDashoffset: 283 }}
            animate={controls}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{displayScore}</span>
        </div>
      </div>
      <span className="mt-4 text-text-secondary font-medium">Cyber Health Score</span>
    </div>
  );
}
