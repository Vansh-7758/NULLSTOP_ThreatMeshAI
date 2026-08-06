'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { SectionHeading, GlowDot, Badge } from '@/components/landing/ui';
import { fadeUp, scaleIn, stagger, inViewProps } from '@/components/landing/lib/motion';

/* ── Threat Map (SVG) ──────────────────────────────────────── */
const threatPoints = [
  { x: '18%', y: '32%', severity: 'critical', label: 'Frankfurt' },
  { x: '42%', y: '28%', severity: 'high',     label: 'London' },
  { x: '75%', y: '22%', severity: 'critical', label: 'Seoul' },
  { x: '85%', y: '55%', severity: 'medium',   label: 'Singapore' },
  { x: '22%', y: '62%', severity: 'high',     label: 'São Paulo' },
  { x: '62%', y: '45%', severity: 'medium',   label: 'Mumbai' },
  { x: '30%', y: '40%', severity: 'critical', label: 'New York' },
];

const sevColor: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#9A5FFD' };

function ThreatMap() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="relative w-full aspect-[2/1] rounded-[16px] overflow-hidden bg-[rgba(255,255,255,0.02)] border border-[rgba(95,1,251,0.12)]">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5F01FB" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />
        {/* Longitude lines */}
        {[20,40,60,80].map(x => (
          <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#514A85" strokeWidth="0.3" strokeDasharray="4 8" opacity="0.5"/>
        ))}
        {/* Latitude lines */}
        {[30,50,70].map(y => (
          <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#514A85" strokeWidth="0.3" strokeDasharray="4 8" opacity="0.5"/>
        ))}
        {/* Attack path arcs */}
        <path d="M 18% 32% Q 25% 15% 42% 28%" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4 4"/>
        <path d="M 75% 22% Q 60% 35% 42% 28%" fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth="1" strokeDasharray="4 4"/>
        <path d="M 30% 40% Q 45% 30% 62% 45%" fill="none" stroke="rgba(154,95,253,0.3)" strokeWidth="1" strokeDasharray="4 4"/>
      </svg>

      {/* Header */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 bg-[rgba(11,13,27,0.6)] border-b border-[rgba(95,1,251,0.10)]">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-[#5F01FB]" />
          <span className="text-[10px] font-bold text-[#9B94C4] uppercase tracking-widest">Global Threat Map</span>
        </div>
        <div className="flex items-center gap-3">
          {Object.entries({ critical: '#ef4444', high: '#f59e0b', medium: '#9A5FFD' }).map(([k, c]) => (
            <div key={k} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              <span className="text-[9px] text-[#635D8C] capitalize">{k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Threat dots */}
      {threatPoints.map((pt, i) => (
        <motion.button
          key={pt.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pt.x, top: pt.y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          onClick={() => setActive(active === i ? null : i)}
        >
          <GlowDot color={sevColor[pt.severity]} size={8} />
          <AnimatePresence>
            {active === i && (
              <motion.div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap z-20"
                style={{ background: sevColor[pt.severity] + '22', border: `1px solid ${sevColor[pt.severity]}50`, color: sevColor[pt.severity] }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
              >
                {pt.label} — {pt.severity}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      ))}

      <div className="absolute bottom-2 right-3 text-[9px] text-[#635D8C] font-mono">
        {threatPoints.length} active threats · Updated 2s ago
      </div>
    </div>
  );
}

/* We need Globe for the map */
interface GlobeProps {
  className?: string;
}

function Globe({ className }: GlobeProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/></svg>;
}

/* ── Risk Score Arc ────────────────────────────────────────── */
interface RiskGaugeProps {
  score?: number;
}
function RiskGauge({ score = 68 }: RiskGaugeProps) {
  const r = 54;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-bold text-[#9B94C4] uppercase tracking-widest">Cyber Health Score</p>
      <div className="relative w-36 h-20 overflow-hidden">
        <svg viewBox="0 0 140 80" className="absolute inset-0 w-full h-full">
          {/* Track */}
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
          {/* Fill */}
          <motion.path
            d="M 10 70 A 60 60 0 0 1 130 70"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444"/>
              <stop offset="50%" stopColor="#f59e0b"/>
              <stop offset="100%" stopColor="#22c55e"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <motion.span
            className="text-2xl font-bold text-[#f59e0b]"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            {score}
          </motion.span>
          <span className="text-[9px] text-[#635D8C]">/ 100</span>
        </div>
      </div>
    </div>
  );
}

/* ── Live Alert Feed ───────────────────────────────────────── */
const alerts = [
  { time: '0:12s', pkg: 'log4j-core',   sev: 'CRITICAL', msg: 'Remote code execution path discovered' },
  { time: '1:45s', pkg: 'lodash',       sev: 'HIGH',     msg: 'Prototype pollution via merge()'       },
  { time: '3:02s', pkg: 'spring-core',  sev: 'CRITICAL', msg: 'Spring4Shell reachable from /upload'   },
  { time: '4:18s', pkg: 'axios',        sev: 'MEDIUM',   msg: 'SSRF vulnerability in redirect'        },
  { time: '5:31s', pkg: 'Pillow',       sev: 'HIGH',     msg: 'Buffer overflow in image parser'       },
];

function AlertFeed() {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-bold text-[#9B94C4] uppercase tracking-widest mb-2">Live Alert Feed</p>
      {alerts.map((a, i) => (
        <motion.div
          key={a.pkg}
          className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.04)] hover:bg-[rgba(95,1,251,0.06)] transition-colors duration-200"
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
        >
          <AlertTriangle
            className="w-3 h-3 mt-0.5 shrink-0"
            style={{ color: a.sev === 'CRITICAL' ? '#ef4444' : a.sev === 'HIGH' ? '#f59e0b' : '#9A5FFD' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold text-white">{a.pkg}</span>
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: a.sev === 'CRITICAL' ? '#ef444420' : a.sev === 'HIGH' ? '#f59e0b20' : '#9A5FFD20',
                  color: a.sev === 'CRITICAL' ? '#ef4444' : a.sev === 'HIGH' ? '#f59e0b' : '#9A5FFD',
                }}
              >
                {a.sev}
              </span>
            </div>
            <p className="text-[10px] text-[#635D8C] truncate">{a.msg}</p>
          </div>
          <span className="text-[9px] text-[#514A85] font-mono shrink-0">{a.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Attack Timeline ──────────────────────────────────────── */
const timelineSteps = [
  { label: 'SBOM Ingested',   icon: '📦', done: true },
  { label: 'CVE Matched',     icon: '🔍', done: true },
  { label: 'Path Traced',     icon: '🗺️', done: true },
  { label: 'AI Council',      icon: '🤖', done: true },
  { label: 'PR Generated',    icon: '✅', done: false },
];

function AttackTimeline() {
  return (
    <div>
      <p className="text-[10px] font-bold text-[#9B94C4] uppercase tracking-widest mb-4">Remediation Pipeline</p>
      <div className="flex items-center gap-0">
        {timelineSteps.map((s, i) => (
          <React.Fragment key={s.label}>
            <motion.div
              className="flex flex-col items-center gap-1.5 flex-1"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.12 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-all duration-300"
                style={{
                  background: s.done ? 'linear-gradient(135deg,#5F01FB,#7B2FFC)' : 'rgba(255,255,255,0.04)',
                  borderColor: s.done ? '#7B2FFC' : 'rgba(255,255,255,0.08)',
                  boxShadow: s.done ? '0 0 16px rgba(95,1,251,0.4)' : 'none',
                }}
              >
                {s.icon}
              </div>
              <span className="text-[8px] text-[#635D8C] text-center font-medium leading-tight max-w-[52px]">{s.label}</span>
            </motion.div>
            {i < timelineSteps.length - 1 && (
              <motion.div
                className="h-px flex-1 mb-4"
                style={{ background: 'linear-gradient(90deg,#5F01FB80,#514A8540)' }}
                initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── Trust Score Bars ─────────────────────────────────────── */
const pkgRows = [
  { name: 'log4j-core',  score: 12, cve: 'CVE-2021-44228', sev: 'critical' },
  { name: 'lodash',      score: 47, cve: 'CVE-2021-23337', sev: 'high'     },
  { name: 'spring-core', score: 18, cve: 'CVE-2022-22965', sev: 'critical' },
  { name: 'axios',       score: 71, cve: 'CVE-2023-45857', sev: 'medium'   },
];

function TrustTable() {
  return (
    <div>
      <p className="text-[10px] font-bold text-[#9B94C4] uppercase tracking-widest mb-3">Package Trust Scores</p>
      <div className="flex flex-col gap-2">
        {pkgRows.map((p, i) => (
          <motion.div
            key={p.name}
            className="group"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-white">{p.name}</span>
              <span className="text-[10px] font-mono" style={{ color: sevColor[p.sev] }}>{p.score}</span>
            </div>
            <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: p.score < 30
                    ? 'linear-gradient(90deg,#ef4444,#f97316)'
                    : p.score < 60
                    ? 'linear-gradient(90deg,#f59e0b,#eab308)'
                    : 'linear-gradient(90deg,#22c55e,#16a34a)',
                }}
                initial={{ width: 0 }}
                whileInView={{ width: `${p.score}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.08, duration: 1.0, ease: [0.22,1,0.36,1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard Preview Section ────────────────────────────── */
export default function DashboardPreview() {
  return (
    <section className="relative py-[120px] z-content overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      {/* Background bloom */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(95,1,251,0.10)_0%,transparent_65%)] pointer-events-none" />

      <div className="section-container">
        <SectionHeading
          eyebrow="Live Dashboard"
          title={<>Intelligence at a<br /><span className="gradient-text">Single Glance</span></>}
          subtitle="Real-time threat monitoring, trust scoring, and autonomous remediation pipelines — all in one unified command center."
        />

        {/* Dashboard panel */}
        <motion.div
          className="mt-16 relative rounded-[28px] overflow-hidden border border-[rgba(95,1,251,0.20)] shadow-[0_0_100px_rgba(95,1,251,0.15),0_0_200px_rgba(95,1,251,0.06)]"
          variants={scaleIn}
          {...inViewProps}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[rgba(11,13,27,0.90)] border-b border-[rgba(95,1,251,0.12)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ef4444] opacity-80" />
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] opacity-80" />
                <span className="w-3 h-3 rounded-full bg-[#22c55e] opacity-80" />
              </div>
              <span className="text-xs font-semibold text-[#9B94C4]">ThreatMesh AI — Executive Cyber Command Center</span>
            </div>
            <div className="flex items-center gap-2">
              <GlowDot color="#22c55e" size={8} />
              <span className="text-[10px] font-bold text-[#86efac]">LIVE</span>
              <span className="text-[10px] text-[#514A85] ml-2">248 packages · 14 CVEs active</span>
            </div>
          </div>

          {/* Panel body */}
          <div className="bg-[rgba(11,13,27,0.80)] backdrop-blur-xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: Map + Timeline */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <ThreatMap />
              <div className="glass border border-[rgba(95,1,251,0.10)] rounded-[16px] p-5">
                <AttackTimeline />
              </div>
            </div>

            {/* Right: Score + Feed + Table */}
            <div className="flex flex-col gap-5">
              <div className="glass border border-[rgba(95,1,251,0.10)] rounded-[16px] p-5">
                <RiskGauge score={68} />
              </div>
              <div className="glass border border-[rgba(95,1,251,0.10)] rounded-[16px] p-5">
                <TrustTable />
              </div>
              <div className="glass border border-[rgba(95,1,251,0.10)] rounded-[16px] p-5 flex-1">
                <AlertFeed />
              </div>
            </div>
          </div>

          {/* Scan line overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]">
            <div className="scan-line" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
