'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Cpu, GitPullRequest } from 'lucide-react';
import { SectionHeading } from '@/components/landing/ui';
import { fadeUp, stagger, inViewProps } from '@/components/landing/lib/motion';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Ingest Your SBOM',
    body: 'Drag and drop your CycloneDX or SPDX manifest. ThreatMesh instantly maps every direct and transitive dependency across your entire supply chain.',
    accent: '#5F01FB',
    detail: ['CycloneDX v1.4+', 'SPDX v2.2+', '< 3s ingestion time'],
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Analyzes & Scores',
    body: 'Our 5-factor AADTG engine cross-references NVD, OSV.dev, and GitHub Security Advisories in real time, computing trust scores and tracing attack paths.',
    accent: '#7B2FFC',
    detail: ['5-factor scoring', 'Graph reachability', 'EPSS risk signals'],
  },
  {
    number: '03',
    icon: GitPullRequest,
    title: 'Autonomous Remediation',
    body: 'An 8-agent AI Council synthesizes a remediation playbook and generates a GitHub PR with non-breaking version bumps — ready to merge.',
    accent: '#9A5FFD',
    detail: ['One-click PR', 'Zero breaking changes', 'NIST · MITRE mapped'],
  },
];

export default function HowItWorks() {
  return (
    <section id="about" className="relative z-content" style={{ padding: '120px 0 140px' }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      <div className="section-container">
        <SectionHeading
          eyebrow="How It Works"
          title={<>From Upload to<br /><span className="gradient-text-light">Remediated</span> in Minutes</>}
          subtitle="Three phases. Fully autonomous. No manual triaging required."
        />

        {/* Steps */}
        <motion.div
          className="relative mt-20"
          variants={stagger}
          {...inViewProps}
        >
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px">
            <div className="h-full bg-gradient-to-r from-[#5F01FB] via-[#7B2FFC] to-[#9A5FFD] opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#5F01FB] via-[#7B2FFC] to-[#9A5FFD] opacity-50"
              style={{ maskImage: 'linear-gradient(90deg,transparent,white 20%,white 80%,transparent)' }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="flex flex-col items-center lg:items-start text-center lg:text-left"
                variants={fadeUp}
              >
                {/* Step icon circle */}
                <motion.div
                  className="relative mb-8"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.35 }}
                >
                  <div
                    className="w-16 h-16 rounded-[18px] flex items-center justify-center relative"
                    style={{
                      background: `linear-gradient(135deg, ${step.accent}30, ${step.accent}10)`,
                      border: `1px solid ${step.accent}40`,
                      boxShadow: `0 0 40px ${step.accent}20`,
                    }}
                  >
                    <step.icon className="w-7 h-7" style={{ color: step.accent }} strokeWidth={1.75} />
                    {/* Number badge */}
                    <span
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: step.accent, color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                  </div>
                </motion.div>

                {/* Content card */}
                <motion.div
                  className="glass rounded-[20px] p-8 w-full border border-[rgba(95,1,251,0.12)] hover:border-[rgba(95,1,251,0.30)] transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_30px_rgba(95,1,251,0.12)]"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="text-[10px] font-bold text-[#514A85] uppercase tracking-widest">Step {step.number}</span>
                  <h3 className="text-xl font-bold text-white mt-2.5 mb-4">{step.title}</h3>
                  <p className="text-[#9B94C4] text-sm leading-relaxed mb-7">{step.body}</p>

                  {/* Detail chips */}
                  <div className="flex flex-wrap gap-2">
                    {step.detail.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: `${step.accent}12`, color: step.accent, border: `1px solid ${step.accent}25` }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
