'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Zap, TrendingUp, Lock, Eye, LucideIcon } from 'lucide-react';
import { SectionHeading } from '@/components/landing/ui';
import { fadeUp, slideLeft, slideRight, stagger, inViewProps } from '@/components/landing/lib/motion';

/* ── Palette ───────────────────────────────
   #FFFFFF  White
   #5F01FB  Brand purple
   #514A85  Muted purple
   #0B0D1B  Background dark
─────────────────────────────────────────── */

const benefitsA = [
  { icon: Shield,     text: 'Complete supply chain visibility from SBOM to runtime' },
  { icon: Zap,        text: 'Autonomous PR generation in under 3 minutes' },
  { icon: TrendingUp, text: 'Predictive CVE forecasting before official disclosure' },
  { icon: Lock,       text: 'NIST CSF, MITRE ATT&CK, OWASP, EU AI Act alignment' },
];

const benefitsB = [
  { icon: Eye,         text: 'Real-time graph reachability for every dependency' },
  { icon: CheckCircle, text: '8-agent AI Council with business blast radius analysis' },
  { icon: Shield,      text: 'Adaptive trust scoring with 5-factor AADTG model' },
  { icon: Zap,         text: 'Zero-config integrations with GitHub, GitLab, Bitbucket' },
];

/* ── SBOM Graph Visual ─────────────────── */
function SBOMVisual() {
  const nodes = [
    { label: 'app-root',   x: 50, y: 10, trust: 82, critical: false },
    { label: 'express',    x: 20, y: 40, trust: 76, critical: false },
    { label: 'log4j-core', x: 72, y: 40, trust: 12, critical: true  },
    { label: 'lodash',     x: 10, y: 72, trust: 47, critical: false },
    { label: 'jackson',    x: 47, y: 72, trust: 29, critical: true  },
    { label: 'netty',      x: 82, y: 72, trust: 61, critical: false },
  ];

  // Palette-only node color: critical = #5F01FB at full, safe = rgba(255,255,255,0.5)
  const nodeColor = (t: number, critical: boolean) =>
    critical ? '#5F01FB' : t < 50 ? '#514A85' : 'rgba(255,255,255,0.55)';

  return (
    <div
      className="relative w-full rounded-[24px] overflow-hidden p-5"
      style={{ background: '#0B0D1B', border: '1px solid rgba(95,1,251,0.28)' }}
    >
      {/* Top line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px]"
        style={{ background: 'linear-gradient(90deg, transparent, #5F01FB 40%, rgba(255,255,255,0.6) 50%, #5F01FB 60%, transparent)' }} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <motion.div className="w-2 h-2 rounded-full" style={{ background: '#5F01FB' }}
          animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#514A85' }}>
          Dependency Knowledge Graph
        </span>
      </div>

      {/* SVG */}
      <svg className="w-full" viewBox="0 0 100 90" preserveAspectRatio="none" style={{ height: 200 }}>
        {/* Edges */}
        <line x1="50" y1="14" x2="22" y2="38" stroke="rgba(81,74,133,0.40)" strokeWidth="0.8" strokeDasharray="2 2"/>
        <line x1="50" y1="14" x2="70" y2="38" stroke="rgba(95,1,251,0.55)" strokeWidth="0.8" strokeDasharray="2 2"/>
        <line x1="22" y1="44" x2="12" y2="70" stroke="rgba(81,74,133,0.30)" strokeWidth="0.8" strokeDasharray="2 2"/>
        <line x1="70" y1="44" x2="47" y2="70" stroke="rgba(95,1,251,0.55)" strokeWidth="0.8" strokeDasharray="2 2"/>
        <line x1="70" y1="44" x2="80" y2="70" stroke="rgba(81,74,133,0.30)" strokeWidth="0.8" strokeDasharray="2 2"/>
        {/* Attack path */}
        <line x1="50" y1="14" x2="70" y2="38" stroke="#5F01FB" strokeWidth="1.5" opacity="0.8"/>
        <line x1="70" y1="44" x2="47" y2="70" stroke="#5F01FB" strokeWidth="1.5" opacity="0.8"/>
        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={n.label}>
            <motion.circle cx={n.x} cy={n.y} r="5"
              fill={nodeColor(n.trust, n.critical)} fillOpacity={n.critical ? 0.18 : 0.12}
              stroke={nodeColor(n.trust, n.critical)} strokeWidth="1"
              initial={{ scale: 0 }} whileInView={{ scale: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}/>
            {n.critical && (
              <motion.circle cx={n.x} cy={n.y} r="8"
                fill="none" stroke="#5F01FB" strokeWidth="0.6" opacity="0.4"
                animate={{ r: [8, 12, 8] }} transition={{ duration: 2.2, repeat: Infinity }}/>
            )}
            <text x={n.x} y={n.y + 12} textAnchor="middle" fontSize="3.5"
              fill="rgba(255,255,255,0.45)">{n.label}</text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex gap-5 mt-3">
        {[
          { c: 'rgba(255,255,255,0.50)', l: 'Safe'     },
          { c: '#514A85',                l: 'At Risk'  },
          { c: '#5F01FB',                l: 'Critical' },
        ].map(({ c, l }) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: c }} />
            <span className="text-[9px] font-semibold" style={{ color: '#514A85' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 8-Agent AI Council Visual ─────────── */
function AICouncilVisual() {
  const agents = [
    { name: 'Threat Analyst',    role: 'CVE triage & severity ranking',     status: 'done',    n: 1 },
    { name: 'Blast Radius',      role: 'Business impact assessment',         status: 'done',    n: 2 },
    { name: 'MITRE Mapper',      role: 'ATT&CK technique classification',    status: 'done',    n: 3 },
    { name: 'OWASP Classifier',  role: 'Top 10 vulnerability mapping',       status: 'done',    n: 4 },
    { name: 'Patch Recommender', role: 'Safe version bump computation',      status: 'active',  n: 5 },
    { name: 'PR Author',         role: 'Autonomous GitHub PR generation',    status: 'pending', n: 6 },
    { name: 'Compliance',        role: 'NIST · EU AI Act · ISO 27001',       status: 'pending', n: 7 },
    { name: 'Risk Forecaster',   role: 'Predictive CVE trend modeling',      status: 'pending', n: 8 },
  ];
  const doneCount = agents.filter(a => a.status === 'done').length;
  const pct = Math.round((doneCount / agents.length) * 100);

  return (
    <div
      className="relative w-full rounded-[24px] overflow-hidden"
      style={{ background: '#0B0D1B', border: '1px solid rgba(95,1,251,0.32)' }}
    >
      {/* Top shimmer */}
      <div className="absolute inset-x-0 top-0 h-[1.5px]"
        style={{ background: 'linear-gradient(90deg, transparent, #5F01FB 35%, #FFFFFF 50%, #5F01FB 65%, transparent)' }}/>

      {/* Header */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(95,1,251,0.14)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(95,1,251,0.18)', border: '1px solid rgba(95,1,251,0.38)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#5F01FB" strokeWidth="1.4"/>
                <circle cx="8" cy="8" r="2.8" fill="#5F01FB"/>
                <circle cx="8" cy="2" r="1.2" fill="rgba(95,1,251,0.5)"/>
                <circle cx="8" cy="14" r="1.2" fill="rgba(95,1,251,0.5)"/>
                <circle cx="2" cy="8" r="1.2" fill="rgba(95,1,251,0.5)"/>
                <circle cx="14" cy="8" r="1.2" fill="rgba(95,1,251,0.5)"/>
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-bold" style={{ color: '#FFFFFF' }}>8-Agent AI Council</p>
              <p className="text-[9px] font-semibold" style={{ color: '#514A85' }}>Autonomous Remediation Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(95,1,251,0.12)', border: '1px solid rgba(95,1,251,0.30)' }}>
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#5F01FB' }}
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}/>
            <span className="text-[9px] font-bold" style={{ color: '#5F01FB' }}>LIVE</span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-semibold" style={{ color: '#514A85' }}>Council Progress</span>
            <span className="text-[9px] font-bold" style={{ color: '#FFFFFF' }}>{doneCount}/{agents.length} agents done</span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(81,74,133,0.22)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #5F01FB, rgba(255,255,255,0.80))' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}/>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="px-4 py-3.5 flex flex-col gap-[5px]">
        {agents.map((a, i) => (
          <motion.div key={a.name}
            className="flex items-center gap-3 px-4 py-[9px] rounded-[10px]"
            style={{
              background: a.status === 'active'
                ? 'rgba(95,1,251,0.12)'
                : a.status === 'done'
                ? 'rgba(255,255,255,0.025)'
                : 'transparent',
              border: a.status === 'active'
                ? '1px solid rgba(95,1,251,0.45)'
                : a.status === 'done'
                ? '1px solid rgba(255,255,255,0.07)'
                : '1px solid rgba(81,74,133,0.14)',
              boxShadow: a.status === 'active' ? '0 0 16px rgba(95,1,251,0.14)' : 'none',
            }}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Number badge */}
            <div className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{
                background: a.status === 'done' ? 'rgba(95,1,251,0.30)' : a.status === 'active' ? '#5F01FB' : 'rgba(81,74,133,0.18)',
                color: a.status === 'pending' ? '#514A85' : '#FFFFFF',
              }}>
              {a.status === 'done' ? '✓' : a.n}
            </div>

            {/* Name & role */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold leading-tight"
                style={{ color: a.status === 'pending' ? '#514A85' : '#FFFFFF' }}>
                {a.name}
              </p>
              <p className="text-[9px] leading-tight mt-0.5 truncate"
                style={{ color: 'rgba(81,74,133,0.75)' }}>
                {a.role}
              </p>
            </div>

            {/* Status indicator */}
            {a.status === 'done' && (
              <span className="text-[9px] font-bold shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>Done</span>
            )}
            {a.status === 'active' && (
              <div className="flex items-end gap-[3px] shrink-0" style={{ height: 14 }}>
                {[0, 0.12, 0.24].map((d, k) => (
                  <motion.div key={k} className="w-[3px] rounded-full"
                    style={{ background: '#5F01FB', height: 14 }}
                    animate={{ scaleY: [0.35, 1, 0.35] }}
                    transition={{ duration: 0.65, repeat: Infinity, delay: d, ease: 'easeInOut' }}/>
                ))}
              </div>
            )}
            {a.status === 'pending' && (
              <span className="text-[9px] font-semibold shrink-0" style={{ color: 'rgba(81,74,133,0.50)' }}>Queue</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(81,74,133,0.14)' }}>
        <span className="text-[9px] font-semibold" style={{ color: '#514A85' }}>
          Synthesis ETA — ~2 min
        </span>
        <div className="flex gap-1">
          {[1, 0.5, 0.22].map((o, k) => (
            <div key={k} className="w-1 h-1 rounded-full" style={{ background: `rgba(95,1,251,${o})` }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BenefitItemProps {
  icon: LucideIcon;
  text: string;
  accent?: string;
}

/* ── Benefit list item ─────────────────── */
function BenefitItem({ icon: Icon, text }: BenefitItemProps) {
  return (
    <motion.li className="flex items-start gap-3" style={{ color: '#514A85' }} variants={fadeUp}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(95,1,251,0.12)', border: '1px solid rgba(95,1,251,0.28)' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: '#5F01FB' }} strokeWidth={2} />
      </div>
      <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</span>
    </motion.li>
  );
}

export default function Benefits() {
  return (
    <section className="relative z-content" style={{ padding: '120px 0 140px' }}>

      <div className="section-container flex flex-col gap-28">

        {/* ── Block 1: SBOM Visual left, Copy right ── */}
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          <motion.div variants={slideLeft} {...inViewProps}>
            <SBOMVisual />
          </motion.div>

          <motion.div className="flex flex-col gap-6" variants={slideRight} {...inViewProps}>
            <SectionHeading
              eyebrow="Supply Chain Intelligence"
              title={<>See Every Dependency.<br /><span className="gradient-text">Trust Nothing.</span></>}
              subtitle="ThreatMesh builds a living knowledge graph of your entire dependency tree — direct and transitive — giving you reachability analysis that no SAST tool can match."
              align="left"
            />
            <ul className="flex flex-col gap-4 mt-2">
              {benefitsA.map((b) => <BenefitItem key={b.text} {...b} />)}
            </ul>
          </motion.div>
        </div>

        {/* ── Block 2: Copy left, AI Council right ── */}
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          <motion.div className="flex flex-col gap-6 lg:order-first" variants={slideLeft} {...inViewProps}>
            <SectionHeading
              eyebrow="AI Governance"
              title={<>8 Agents Working<br /><span className="gradient-text-light">While You Sleep</span></>}
              subtitle="The AI Council synthesizes threat intelligence, maps to compliance frameworks, and writes the PR — all before your morning standup."
              align="left"
            />
            <ul className="flex flex-col gap-4 mt-2">
              {benefitsB.map((b) => <BenefitItem key={b.text} {...b} />)}
            </ul>
          </motion.div>

          <motion.div variants={slideRight} {...inViewProps}>
            <AICouncilVisual />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
