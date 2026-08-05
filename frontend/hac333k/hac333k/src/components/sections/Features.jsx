import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, Zap, Network, Shield, Brain, FileText,
  TrendingUp, Lock, ChevronRight,
} from 'lucide-react';
import { SectionHeading, Badge } from '../ui';
import { fadeUp, stagger, staggerFast, inViewProps } from '../../lib/motion';

const features = [
  {
    icon: GitBranch,
    title: 'Multi-Format SBOM Ingestion',
    body: 'Drag-and-drop ingest of CycloneDX v1.4+ and SPDX v2.2+ JSON manifests. Instantly maps 248,000+ transitive dependencies.',
    tag: 'Core',
    size: 'lg', // spans 2 cols
    gradient: 'from-[rgba(95,1,251,0.15)] to-[rgba(81,74,133,0.05)]',
    accent: '#5F01FB',
  },
  {
    icon: Brain,
    title: 'AI Council Playbooks',
    body: '8-agent synthesis of threat assessments, compliance mappings (NIST, MITRE, OWASP), and safe patch recommendations via Claude.',
    tag: 'Intelligence',
    size: 'sm',
    gradient: 'from-[rgba(122,63,255,0.12)] to-[rgba(61,0,153,0.05)]',
    accent: '#7B2FFC',
  },
  {
    icon: Network,
    title: 'Graph Reachability Analysis',
    body: 'Traces shortest execution paths from app root to vulnerable components via Cypher queries in Neo4j knowledge graph.',
    tag: 'Graph',
    size: 'sm',
    gradient: 'from-[rgba(81,74,133,0.15)] to-[rgba(95,1,251,0.05)]',
    accent: '#514A85',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Risk Engine',
    body: 'Heuristic signal-based forecasting identifies emerging package vulnerabilities before official CVE disclosures.',
    tag: 'AI',
    size: 'sm',
    gradient: 'from-[rgba(61,0,153,0.12)] to-[rgba(95,1,251,0.04)]',
    accent: '#9A5FFD',
  },
  {
    icon: Shield,
    title: 'Adaptive Trust Scoring (AADTG)',
    body: '5-factor weighted trust score: CVE severity (30%), EPSS risk (25%), exploit availability (20%), commit health (15%), release cadence (10%).',
    tag: 'Trust',
    size: 'lg',
    gradient: 'from-[rgba(95,1,251,0.12)] to-[rgba(154,95,253,0.05)]',
    accent: '#5F01FB',
  },
  {
    icon: Zap,
    title: 'Autonomous Remediation',
    body: 'One-click GitHub PR generation with non-breaking manifest updates. Zero human intervention required for routine patches.',
    tag: 'Auto',
    size: 'sm',
    gradient: 'from-[rgba(81,74,133,0.12)] to-[rgba(61,0,153,0.04)]',
    accent: '#7B2FFC',
  },
];

function FeatureCard({ feature, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-[24px] p-8 cursor-pointer group
        ${feature.size === 'lg' ? 'md:col-span-2' : 'col-span-1'}
        glass border border-[rgba(95,1,251,0.15)] transition-all duration-400
      `}
      style={{ background: `linear-gradient(135deg, ${feature.gradient.replace('from-', '').replace('to-', ', ')})` }}
      variants={fadeUp}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{
        y: -6,
        boxShadow: `0 12px 48px rgba(0,0,0,0.5), 0 0 40px ${feature.accent}30, inset 0 1px 0 rgba(255,255,255,0.08)`,
        borderColor: `${feature.accent}50`,
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top gradient bar */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}80, transparent)` }}
        animate={{ opacity: hovered ? 1 : 0.4 }}
        transition={{ duration: 0.3 }}
      />

      {/* Glow orb on hover */}
      <motion.div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full"
        style={{ background: `radial-gradient(circle, ${feature.accent}18 0%, transparent 70%)` }}
        animate={{ scale: hovered ? 1.3 : 1, opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.5 }}
      />

      <div className="relative z-10">
        {/* Tag */}
        <Badge variant="brand" className="mb-5 !text-[10px] !py-0.5 !px-2.5" style={{ color: feature.accent, borderColor: `${feature.accent}35`, background: `${feature.accent}12` }}>
          {feature.tag}
        </Badge>

        {/* Icon */}
        <motion.div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5"
          style={{ background: `${feature.accent}20`, border: `1px solid ${feature.accent}35` }}
          animate={{ rotate: hovered ? 5 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <feature.icon className="w-6 h-6" style={{ color: feature.accent }} strokeWidth={1.75} />
        </motion.div>

        <h3 className="text-[17px] font-bold text-white mb-3 leading-snug">{feature.title}</h3>
        <p className="text-[#9B94C4] text-sm leading-relaxed">{feature.body}</p>

        {/* Read more */}
        <motion.div
          className="flex items-center gap-1 mt-5 text-xs font-semibold"
          style={{ color: feature.accent }}
          animate={{ x: hovered ? 4 : 0 }}
          transition={{ duration: 0.3 }}
        >
          Learn more <ChevronRight className="w-3.5 h-3.5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-[120px] z-content">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      <div className="section-container">
        <SectionHeading
          eyebrow="Platform Features"
          title={<>Everything You Need to<br /><span className="gradient-text">Defend at Scale</span></>}
          subtitle="Six intelligent capabilities that work together to give your security team an unfair advantage."
        />

        {/* Broken grid: 3-col with lg/sm alternation */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16"
          variants={staggerFast}
          {...inViewProps}
        >
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
