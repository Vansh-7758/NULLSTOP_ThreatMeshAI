'use client'

import React from 'react';
import { Severity } from '@/types';

interface Props {
  severity: Severity;
}

export default function SeverityBadge({ severity }: Props) {
  let bgClass = 'bg-gray-500';
  
  switch (severity) {
    case 'CRITICAL': bgClass = 'bg-danger text-white'; break;
    case 'HIGH': bgClass = 'bg-orange-500 text-white'; break;
    case 'MEDIUM': bgClass = 'bg-warning text-white'; break;
    case 'LOW': bgClass = 'bg-accent text-background'; break;
    case 'NONE': bgClass = 'bg-border text-text-secondary'; break;
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${bgClass}`}>
      {severity}
    </span>
  );
}
