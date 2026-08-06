'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield, ArrowRight, Play, AlertTriangle,
  CheckCircle, TrendingUp, Activity, Lock, Zap
} from 'lucide-react';
import { Button, Badge, GlowDot } from '@/components/landing/ui';

interface MetricChipProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  className?: string;
}

/* ── Floating metric chip ─────────────────────────────────── */
function MetricChip({ icon: Icon, label, value, color, className = '' }: MetricChipProps) {
  return (
    <motion.div
      className={`glass glow-ring px-4 py-3 flex items-center gap-3 min-w-[170px] ${className}`}
      whileHover={{ scale: 1.05, y: -3 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-[#9B94C4] leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-white leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

/* ── Live dashboard mockup card ──────────────────────────── */
function HeroDashboard() {
  const alerts = [
    { pkg: 'log4j-core',  cve: 'CVE-2021-44228', sev: 'CRITICAL', score: 12  },
    { pkg: 'lodash',      cve: 'CVE-2021-23337', sev: 'HIGH',     score: 47  },
    { pkg: 'spring-core', cve: 'CVE-2022-22965', sev: 'CRITICAL', score: 18  },
    { pkg: 'axios',       cve: 'CVE-2023-45857', sev: 'MEDIUM',   score: 71  },
  ];
  const sevColor: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#9A5FFD' };

  return (
    <motion.div
      className="relative w-full max-w-[540px]"
      initial={{ opacity: 0, scale: 0.90, y: 32 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute -inset-3 rounded-[32px] opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(95,1,251,0.25) 0%, transparent 70%)', filter: 'blur(20px)' }}
      />

      {/* Light refraction highlight at top */}
      <div className="absolute -top-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[rgba(196,181,253,0.6)] to-transparent rounded-full" />

      <div
        className="relative rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(28,32,80,0.90) 0%, rgba(16,18,42,0.95) 50%, rgba(11,13,27,0.98) 100%)',
          border: '1px solid rgba(95,1,251,0.28)',
          boxShadow: '0 0 60px rgba(95,1,251,0.20), 0 24px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(196,181,253,0.12)',
        }}
      >
        {/* Animated scan line */}
        <div className="scan-line" />

        {/* Inner top light strip */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(196,181,253,0.4)] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(95,1,251,0.12)]"
          style={{ background: 'rgba(11,13,27,0.50)' }}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" style={{ boxShadow: '0 0 6px rgba(245,158,11,0.6)' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
            </div>
            <span className="text-[11px] font-semibold text-[#9B94C4]">ThreatMesh — WATCH Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GlowDot color="#22c55e" size={7} />
            <span className="text-[10px] font-bold text-[#86efac] tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-[rgba(95,1,251,0.08)]">
          {[
            { label: 'Cyber Health',  value: '68',   unit: '/100', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
            { label: 'Packages',      value: '248',  unit: ' pkgs', color: '#9A5FFD', glow: 'rgba(154,95,253,0.4)' },
            { label: 'Critical CVEs', value: '14',   unit: ' live', color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <p className="text-[9px] font-semibold text-[#9B94C4] mb-1 uppercase tracking-wider">{s.label}</p>
              <p
                className="font-bold text-lg leading-none"
                style={{ color: s.color, textShadow: `0 0 20px ${s.glow}` }}
              >
                {s.value}
                <span className="text-[9px] font-normal text-[#635D8C]">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Alert table */}
        <div className="px-5 py-4">
          <p className="text-[9px] font-bold text-[#9B94C4] uppercase tracking-[0.18em] mb-3">
            Critical Packages — Ranked by Trust Score
          </p>
          <div className="flex flex-col gap-2">
            {alerts.map((a, i) => (
              <motion.div
                key={a.pkg}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 group cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{
                  background: 'rgba(95,1,251,0.08)',
                  borderColor: 'rgba(95,1,251,0.25)',
                }}
              >
                <AlertTriangle
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: sevColor[a.sev], filter: `drop-shadow(0 0 4px ${sevColor[a.sev]})` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{a.pkg}</p>
                  <p className="text-[9px] text-[#635D8C] font-mono">{a.cve}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: `${sevColor[a.sev]}18`,
                      color: sevColor[a.sev],
                      border: `1px solid ${sevColor[a.sev]}30`,
                    }}
                  >
                    {a.sev}
                  </span>
                  <p className="text-[9px] text-[#635D8C] mt-0.5 font-mono">Trust {a.score}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust gauge bar */}
        <div className="mx-5 mb-5 rounded-xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] font-bold text-[#9B94C4] uppercase tracking-widest">AADTG Composite Score</p>
            <span className="text-sm font-bold text-[#f59e0b]" style={{ textShadow: '0 0 20px rgba(245,158,11,0.5)' }}>68 / 100</span>
          </div>
          <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #22c55e 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: '68%' }}
              transition={{ delay: 1.0, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[8px] text-[#635D8C]">Critical</span>
            <span className="text-[8px] text-[#635D8C]">Moderate</span>
            <span className="text-[8px] text-[#635D8C]">Trusted</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Hero Section ─────────────────────────────────────────── */
export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yText    = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const yPanel   = useTransform(scrollYProgress, [0, 1], [0,  50]);
  const opacity  = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const yChips   = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <section id="home" ref={ref} className="relative min-h-screen flex items-center pt-[72px] overflow-hidden">

      {/* Dramatic hero radial bloom */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 65% 45%, rgba(95,1,251,0.22) 0%, rgba(61,0,153,0.10) 40%, transparent 70%)',
        }}
      />

      {/* Top-right light flare */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(196,181,253,0.12) 0%, transparent 60%)' }}
      />

      {/* Bottom-left secondary bloom */}
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(81,74,133,0.18) 0%, transparent 60%)' }}
      />

      <div className="section-container z-content w-full">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center py-16 lg:py-24">

          {/* ── Left: Text ── */}
          <motion.div className="flex flex-col gap-7" style={{ y: yText, opacity }}>

            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, rgba(95,1,251,0.18), rgba(81,74,133,0.10))',
                  border: '1px solid rgba(95,1,251,0.35)',
                  color: '#C4B5FD',
                  boxShadow: '0 0 20px rgba(95,1,251,0.20), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#7B2FFC] animate-pulse" />
                MODULE 1 — WATCH · Now Live
                <span className="text-[#9A5FFD] font-bold">→</span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl md:text-6xl xl:text-[4.5rem] font-bold leading-[1.04] tracking-[-0.03em]">
                <motion.span
                  className="block text-shimmer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  AI-Powered
                </motion.span>
                <motion.span
                  className="block text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  Cyber Threat
                </motion.span>
                <motion.span
                  className="block gradient-text-light"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  Intelligence
                </motion.span>
              </h1>
            </motion.div>

            <motion.p
              className="text-[#9B94C4] text-lg leading-relaxed max-w-[480px]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              Autonomous supply chain defense with real-time vulnerability monitoring,
              adaptive trust scoring, and AI Council remediation — deployed in minutes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button variant="primary" className="gap-2.5 text-[15px] !px-7 !py-4">
                Start Free Scan
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="gap-3 text-[15px] !px-6 !py-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(95,1,251,0.25)', boxShadow: '0 0 12px rgba(95,1,251,0.4)' }}
                >
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </div>
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              className="flex flex-wrap items-center gap-5 pt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              {[
                { icon: CheckCircle, text: 'SOC 2 Type II'    },
                { icon: Shield,      text: 'NIST CSF Aligned' },
                { icon: Lock,        text: 'Zero Trust Ready' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#7B2FFC]" strokeWidth={2} />
                  <span className="text-xs font-semibold text-[#9B94C4]">{text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Dashboard + Chips ── */}
          <motion.div
            className="relative flex justify-center lg:justify-end"
            style={{ y: yPanel }}
          >
            <HeroDashboard />

            {/* Floating metric chips */}
            <motion.div
              className="absolute -left-6 top-12 float"
              style={{ y: yChips }}
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <MetricChip icon={Activity} label="Threats Detected" value="1,482 / day" color="#ef4444" />
            </motion.div>

            <motion.div
              className="absolute -right-4 md:right-0 bottom-32 float2"
              style={{ y: yChips }}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <MetricChip icon={TrendingUp} label="Packages Scanned" value="248,000+" color="#9A5FFD" />
            </motion.div>

            <motion.div
              className="absolute -left-4 bottom-10 float3"
              style={{ y: yChips }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <MetricChip icon={Zap} label="Avg Response Time" value="< 3.2s" color="#22c55e" />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.8 }}
        >
          <span className="text-[9px] font-bold text-[#635D8C] uppercase tracking-[0.2em]">Explore</span>
          <div
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: 'rgba(95,1,251,0.35)', background: 'rgba(95,1,251,0.06)' }}
          >
            <motion.div
              className="w-1 h-2 rounded-full"
              style={{ background: 'linear-gradient(180deg, #9A5FFD, #5F01FB)' }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
