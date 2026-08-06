'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface SectionDividerProps {
  variant?: 'full' | 'double' | 'glow' | 'fade' | 'chapter';
  chapter?: React.ReactNode;
  className?: string;
}

/*
 * SectionDivider — animated glowing separator using new palette
 * Palette: #1B1931 bg | #44174E | #662249 | #A34054 | #ED9E58 | #E9BCB9
 *
 * Variants: 'full' | 'double' | 'glow' | 'fade' | 'chapter'
 */
export default function SectionDivider({ variant = 'glow', chapter = null, className = '' }: SectionDividerProps) {

  /* ── Full ── */
  if (variant === 'full') {
    return (
      <div className={`relative z-content overflow-hidden ${className}`} style={{ padding: '24px 0' }}>
        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(68,23,78,0.08) 0%, transparent 100%)' }} />
        <motion.div className="relative mx-auto h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(163,64,84,0.25) 10%, rgba(237,158,88,0.60) 30%, rgba(233,188,185,0.85) 50%, rgba(237,158,88,0.60) 70%, rgba(163,64,84,0.25) 90%, transparent 100%)' }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(102,34,73,0.05) 0%, transparent 100%)' }} />
      </div>
    );
  }

  /* ── Double ── */
  if (variant === 'double') {
    return (
      <div className={`relative z-content overflow-hidden ${className}`} style={{ padding: '28px 0' }}>
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(68,23,78,0.07) 0%, transparent 100%)' }} />
        <motion.div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(237,158,88,0.55) 25%, rgba(233,188,185,0.75) 50%, rgba(237,158,88,0.55) 75%, transparent)' }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="h-[5px]" />
        <motion.div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(163,64,84,0.22) 25%, rgba(233,188,185,0.28) 50%, rgba(163,64,84,0.22) 75%, transparent)' }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(102,34,73,0.04) 0%, transparent 100%)' }} />
      </div>
    );
  }

  /* ── Glow ── */
  if (variant === 'glow') {
    return (
      <div className={`relative z-content flex items-center justify-center overflow-hidden ${className}`} style={{ padding: '32px 0' }}>
        <div className="absolute inset-x-0 top-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(68,23,78,0.06) 0%, transparent 100%)' }} />

        <motion.div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(163,64,84,0.40) 20%, rgba(237,158,88,0.65) 50%, rgba(163,64,84,0.40) 80%, transparent 100%)' }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Tick marks */}
        {['left-[15%]', 'right-[15%]'].map((pos) => (
          <motion.div key={pos} className={`absolute ${pos} top-1/2 -translate-y-1/2`}
            initial={{ opacity: 0, scaleY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.3 }}>
            <div className="w-px h-3 bg-gradient-to-b from-transparent via-[rgba(237,158,88,0.60)] to-transparent" />
          </motion.div>
        ))}
        {/* Side dots */}
        {['left-[25%]', 'right-[25%]'].map((pos) => (
          <motion.div key={pos} className={`absolute ${pos} top-1/2 -translate-y-1/2 w-1 h-1 rounded-full`}
            style={{ background: 'rgba(237,158,88,0.65)' }}
            initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.7 }}
          />
        ))}
        {/* Center orb */}
        <motion.div className="relative z-10 w-2.5 h-2.5 rounded-full"
          style={{ background: 'linear-gradient(135deg, #E9BCB9, #ED9E58)', boxShadow: '0 0 0 3px rgba(237,158,88,0.15), 0 0 20px rgba(237,158,88,0.65), 0 0 40px rgba(237,158,88,0.30)' }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          animate={{ boxShadow: ['0 0 0 3px rgba(237,158,88,0.15), 0 0 20px rgba(237,158,88,0.65)', '0 0 0 5px rgba(237,158,88,0.08), 0 0 32px rgba(233,188,185,0.90)', '0 0 0 3px rgba(237,158,88,0.15), 0 0 20px rgba(237,158,88,0.65)'] }}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(102,34,73,0.04) 0%, transparent 100%)' }} />
      </div>
    );
  }

  /* ── Fade ── */
  if (variant === 'fade') {
    return (
      <motion.div className={`relative z-content h-px w-full ${className}`}
        style={{ background: 'linear-gradient(90deg, transparent, rgba(237,158,88,0.25) 50%, transparent)' }}
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.8 }}
      />
    );
  }

  /* ── Chapter ── */
  if (variant === 'chapter') {
    return (
      <div className={`relative z-content flex items-center gap-5 overflow-hidden px-6 ${className}`}
        style={{ padding: '48px 24px' }}>
        <motion.div className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(237,158,88,0.50))' }}
          initial={{ scaleX: 0, opacity: 0 }} whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div className="shrink-0 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{ background: 'rgba(237,158,88,0.10)', border: '1px solid rgba(237,158,88,0.32)', color: '#ED9E58', boxShadow: '0 0 16px rgba(237,158,88,0.18)' }}
          initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }}
        >
          {chapter || '✦'}
        </motion.div>
        <motion.div className="flex-1 h-px"
          style={{ background: 'linear-gradient(270deg, transparent, rgba(237,158,88,0.50))' }}
          initial={{ scaleX: 0, opacity: 0 }} whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    );
  }

  return null;
}
