'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function TrustScoreBadge({ score, size = 'md' }: Props) {
  let colorClass = 'text-danger border-danger';
  let isPulse = false;
  if (score >= 80) colorClass = 'text-accent border-accent';
  else if (score >= 50) colorClass = 'text-warning border-warning';
  else {
    isPulse = true;
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <motion.div
      key={score}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`rounded-full border-2 flex items-center justify-center font-bold ${colorClass} ${sizeClasses[size]} ${isPulse ? 'pulse-red' : ''}`}
    >
      {score}
    </motion.div>
  );
}
