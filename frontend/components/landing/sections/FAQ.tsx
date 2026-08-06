'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { SectionHeading } from '@/components/landing/ui';
import { fadeUp, stagger, inViewProps } from '@/components/landing/lib/motion';

type FAQType = {
  q: string;
  a: string;
};

const faqs: FAQType[] = [
  {
    q: 'What SBOM formats does ThreatMesh support?',
    a: 'ThreatMesh natively ingests CycloneDX v1.4+, SPDX v2.2+, and Syft-generated JSON manifests. Custom schema support is available on the Enterprise and Custom plans.',
  },
  {
    q: 'How does the AI Council work?',
    a: 'The AI Council is an 8-agent system powered by Claude. Each agent specializes in a domain: threat analysis, business blast radius, MITRE ATT&CK mapping, NIST CSF alignment, OWASP classification, EU AI Act compliance, patch recommendation, and PR authoring. Agents run in parallel and synthesize a unified remediation playbook.',
  },
  {
    q: 'How is the AADTG Trust Score calculated?',
    a: 'The Adaptive AI & Dependency Trust Graph (AADTG) uses a 5-factor weighted model: CVE severity (30%), EPSS probability score (25%), public exploit availability (20%), maintainer commit health (15%), and release cadence regularity (10%). Scores range from 0 (critical risk) to 100 (fully trusted).',
  },
  {
    q: 'Can ThreatMesh generate GitHub Pull Requests automatically?',
    a: 'Yes. On detection of a patchable vulnerability, the Autonomous Remediation engine computes the minimal safe version bump, validates it against your lockfile and dependency constraints, and opens a GitHub PR with a full AADTG-linked description — all without human intervention.',
  },
  {
    q: 'What threat intelligence sources does ThreatMesh aggregate?',
    a: 'ThreatMesh aggregates from NVD (NIST National Vulnerability Database), OSV.dev, GitHub Security Advisories, and EPSS scores. All sources are cached in Redis with sub-second access latency and refreshed every 15 minutes.',
  },
  {
    q: 'Is ThreatMesh available for air-gapped or on-premise deployment?',
    a: 'Yes, air-gapped and on-premise deployments are available on the Custom plan. ThreatMesh is distributed as a Docker Compose stack and supports private AI model hosting (Ollama, vLLM) as an alternative to cloud LLM APIs.',
  },
  {
    q: 'Which compliance frameworks does ThreatMesh map to?',
    a: 'ThreatMesh maps every CVE and threat signal to NIST CSF 2.0, MITRE ATT&CK v15, OWASP Top 10, EU AI Act Articles, and ISO 27001 control families. Compliance reports are generated automatically as part of every AI Council playbook.',
  },
  {
    q: 'How long does a full SBOM scan take?',
    a: 'For a typical SBOM with 200–500 packages, ThreatMesh completes CVE matching, AADTG scoring, graph reachability analysis, and AI Council playbook generation in under 90 seconds. Large enterprise SBOMs (5,000+ packages) typically complete within 4–6 minutes.',
  },
];

interface FAQItemProps {
  item: FAQType;
  index: number;
}

function FAQItem({ item, index }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="border border-[rgba(95,1,251,0.15)] rounded-[16px] overflow-hidden
        hover:border-[rgba(95,1,251,0.30)] transition-colors duration-300"
      style={{ background: open ? 'rgba(95,1,251,0.04)' : 'rgba(16,18,42,0.40)' }}
      variants={fadeUp}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 group"
      >
        <span className="font-semibold text-[15px] text-white leading-snug group-hover:text-[#C4BFEC] transition-colors duration-200">
          {item.q}
        </span>
        <motion.div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: open ? 'rgba(95,1,251,0.20)' : 'rgba(255,255,255,0.04)',
            border: open ? '1px solid rgba(95,1,251,0.40)' : '1px solid rgba(255,255,255,0.08)',
          }}
          animate={{ rotate: open ? 0 : 0 }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="minus" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Minus className="w-4 h-4 text-[#7B2FFC]" />
              </motion.div>
            ) : (
              <motion.div key="plus" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Plus className="w-4 h-4 text-[#9B94C4]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-5 border-t border-[rgba(95,1,251,0.10)]">
              <p className="text-[#9B94C4] text-sm leading-relaxed pt-4">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <section className="relative py-[120px] z-content">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      <div className="section-container max-w-[800px] mx-auto">
        <SectionHeading
          eyebrow="FAQ"
          title={<>Everything You<br /><span className="gradient-text-light">Need to Know</span></>}
          subtitle="Can't find your answer? Our security team is available at security@threatmesh.ai"
        />

        <motion.div
          className="flex flex-col gap-3 mt-14"
          variants={stagger}
          {...inViewProps}
        >
          {faqs.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
