// frontend/components/ui/DitherBackground.tsx
'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { DitherProps } from './Dither';
import { ErrorBoundary } from './ErrorBoundary';

const Dither = dynamic(() => import('./Dither'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#09090F]" />
});

export default function DitherBackground(props: DitherProps) {
  return (
    <ErrorBoundary fallback={<div className="w-full h-full bg-[#09090F]" />}>
      <Dither {...props} />
    </ErrorBoundary>
  );
}
