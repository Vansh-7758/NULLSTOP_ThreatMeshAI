'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Eye, Activity, Map, Shield, Cpu } from 'lucide-react';
import { SectionHeading } from '@/components/landing/ui';
import { fadeUp, stagger, inViewProps } from '@/components/landing/lib/motion';

const capabilities = [
  {
    icon: Eye,
    title: 'Threat Detection',
    body: 'Multi-source intelligence aggregation from NVD, OSV.dev, and GitHub Security Advisories with sub-second Redis caching.',
    accent: '#5F01FB',
    stat: '3.2s',
    statLabel: 'avg detection',
  },
  {
    icon: Activity,
    title: 'Behavior Analysis',
    body: 'Heuristic signal processing analyzes commit frequency, maintainer churn, and release cadence anomalies in real time.',
    accent: '#7B2FFC',
    stat: '94%',
    statLabel: 'accuracy',
  },
  {
    icon: Brain,
    title: 'Anomaly Detection',
    body: 'ML-driven baseline modeling flags unusual dependency mutations, typosquatting attempts, and supply chain tampering.',
    accent: '#9A5FFD',
    stat: '0.2%',
    statLabel: 'false positive',
  },
  {
    icon: Map,
    title: 'MITRE ATT&CK Mapping',
    body: 'Every CVE automatically tagged to MITRE ATT&CK techniques, OWASP Top 10, and NIST CSF control domains.',
    accent: '#514A85',
    stat: '100%',
    statLabel: 'CVE coverage',
  },
  {
    icon: Shield,
    title: 'Zero Trust Enforcement',
    body: 'Continuous package-level trust verification. No dependency is trusted by default — every update re-scored on ingest.',
    accent: '#6B63A8',
    stat: '248K+',
    statLabel: 'packages scored',
  },
];

/* AI pipeline flow */
const pipelineSteps = [
  'SBOM Ingest', 'CVE Lookup', 'EPSS Score', 'Graph Trace', 'AI Council', 'PR Deploy'
];

function PipelineFlow() {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {pipelineSteps.map((step, i) => (
        <React.Fragment key={step}>
          <motion.div
            className="flex flex-col items-center gap-2 shrink-0"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
          >
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[10px] font-bold"
              style={{
                background: `linear-gradient(135deg, rgba(95,1,251,${0.3 - i * 0.03}), rgba(81,74,133,0.15))`,
                border: '1px solid rgba(95,1,251,0.30)',
                color: `hsl(${260 + i * 8}, 80%, ${70 + i * 3}%)`,
              }}
            >
              {i + 1}
            </div>
            <span className="text-[9px] font-semibold text-[#635D8C] whitespace-nowrap">{step}</span>
          </motion.div>
          {i < pipelineSteps.length - 1 && (
            <motion.div
              className="h-px w-8 md:w-12 shrink-0 mb-5"
              style={{ background: 'linear-gradient(90deg,rgba(95,1,251,0.5),rgba(81,74,133,0.25))' }}
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ResearchAI() {
  return (
    <section id="research" className="relative z-content" style={{ padding: '120px 0 140px' }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      {/* Background bloom */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(95,1,251,0.12)_0%,transparent_65%)] pointer-events-none" />

      <div className="section-container">
        <SectionHeading
          eyebrow="AI Engine"
          title={<>Five Layers of<br /><span className="gradient-text">Autonomous Intelligence</span></>}
          subtitle="ThreatMesh's AI pipeline operates continuously — ingesting signals, detecting anomalies, and mapping threats to business impact without human intervention."
        />

        {/* Pipeline flow */}
        <motion.div
          className="mt-14 glass rounded-[20px] p-8 border border-[rgba(95,1,251,0.15)] overflow-x-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-[10px] font-bold text-[#9B94C4] uppercase tracking-widest mb-5">AI Processing Pipeline</p>
          <PipelineFlow />
        </motion.div>

        {/* Capability cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
          variants={stagger}
          {...inViewProps}
        >
          {capabilities.map((cap) => (
            <motion.div
              key={cap.title}
              className="relative glass rounded-[20px] p-8 border border-[rgba(95,1,251,0.12)] group overflow-hidden
                hover:border-[rgba(95,1,251,0.35)] transition-all duration-400"
              variants={fadeUp}
              whileHover={{
                y: -5,
                boxShadow: `0 12px 48px rgba(0,0,0,0.5), 0 0 32px ${cap.accent}25`,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Hover glow orb */}
              <div
                className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${cap.accent}20 0%, transparent 70%)` }}
              />

              {/* Stat badge */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                  style={{ background: `${cap.accent}18`, border: `1px solid ${cap.accent}30` }}
                >
                  <cap.icon className="w-5 h-5" style={{ color: cap.accent }} strokeWidth={1.75} />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: cap.accent }}>{cap.stat}</p>
                  <p className="text-[9px] text-[#635D8C]">{cap.statLabel}</p>
                </div>
              </div>

              <h3 className="text-[16px] font-bold text-white mb-3">{cap.title}</h3>
              <p className="text-[#9B94C4] text-sm leading-relaxed">{cap.body}</p>

              {/* Animated accent line on hover */}
              <motion.div
                className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-[20px] origin-left"
                style={{ background: `linear-gradient(90deg, ${cap.accent}, ${cap.accent}40)` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          ))}

          {/* Large CTA card */}
          <motion.div
            className="md:col-span-2 relative glass rounded-[20px] p-10 border border-[rgba(95,1,251,0.20)] overflow-hidden
              bg-gradient-to-br from-[rgba(95,1,251,0.12)] to-[rgba(81,74,133,0.05)]"
            variants={fadeUp}
            whileHover={{ y: -5, boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 0 40px rgba(95,1,251,0.20)' }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#5F01FB] to-transparent" />
            <Cpu className="w-12 h-12 text-[#5F01FB] mb-5" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-white mb-4">AI Red Team Simulator</h3>
            <p className="text-[#9B94C4] text-[15px] leading-relaxed mb-7">
              Benchmark your AI model safety across 8 attack vectors — SQL injection, PII leakage, jailbreak, toxicity,
              prompt injection, SSRF, supply chain poisoning, and model inversion attacks.
            </p>
            <div className="grid grid-cols-4 gap-3">
              {['SQL Inject', 'Jailbreak', 'PII Leak', 'Toxic', 'SSRF', 'Injection', 'Poisoning', 'Inversion'].map((v) => (
                <div
                  key={v}
                  className="text-center text-[10px] font-semibold py-1.5 px-2 rounded-xl"
                  style={{ background: 'rgba(95,1,251,0.12)', color: '#9A5FFD', border: '1px solid rgba(95,1,251,0.20)' }}
                >
                  {v}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
