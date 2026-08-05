import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { SectionHeading, Button, Badge } from '../ui';
import { fadeUp, stagger, inViewProps } from '../../lib/motion';

const plans = [
  {
    name: 'Professional',
    icon: Zap,
    price: { monthly: 499, annual: 399 },
    desc: 'For fast-moving security teams that need real-time intelligence without the complexity.',
    accent: '#514A85',
    popular: false,
    features: [
      'Up to 5,000 packages / scan',
      'CycloneDX + SPDX ingestion',
      'NVD, OSV, GitHub Advisories',
      'AADTG trust scoring',
      'Graph reachability analysis',
      '5-agent AI Council',
      'GitHub PR automation',
      'NIST CSF mapping',
      'Slack + Jira integrations',
      'Email support (48h SLA)',
    ],
  },
  {
    name: 'Enterprise',
    icon: Building2,
    price: { monthly: 1499, annual: 1199 },
    desc: 'For organizations that require full governance, compliance, and autonomous remediation at scale.',
    accent: '#5F01FB',
    popular: true,
    features: [
      'Unlimited packages / scan',
      'All ingestion formats',
      'All threat intelligence sources',
      'Full 8-agent AI Council',
      'Attack Vector Replay Timeline',
      'AI Red Team Simulator',
      'Predictive Risk Engine',
      'EU AI Act + MITRE ATT&CK',
      'SSO + SAML + RBAC',
      'Dedicated CSM (4h SLA)',
    ],
  },
  {
    name: 'Custom',
    icon: Sparkles,
    price: null,
    desc: 'Air-gapped deployments, custom integrations, dedicated infrastructure, and tailored SLAs.',
    accent: '#7B2FFC',
    popular: false,
    features: [
      'Air-gapped / on-prem deployment',
      'Custom SBOM schema support',
      'Private AI model hosting',
      'Custom AI Council agents',
      'White-label option',
      'Dedicated infrastructure',
      'SLA up to 15 min response',
      'Quarterly security reviews',
      'Named engineering contacts',
      'Bespoke compliance reports',
    ],
  },
];

function PricingCard({ plan, isAnnual }) {
  return (
    <motion.div
      className={`relative flex flex-col rounded-[24px] overflow-hidden transition-all duration-400
        ${plan.popular
          ? 'border-2 border-[rgba(95,1,251,0.50)] shadow-[0_0_60px_rgba(95,1,251,0.20),0_24px_64px_rgba(0,0,0,0.5)]'
          : 'border border-[rgba(95,1,251,0.15)] hover:border-[rgba(95,1,251,0.35)]'
        }
      `}
      style={{
        background: plan.popular
          ? 'linear-gradient(160deg, rgba(95,1,251,0.12) 0%, rgba(16,18,42,0.95) 40%)'
          : 'rgba(16,18,42,0.70)',
        backdropFilter: 'blur(16px)',
        marginTop: plan.popular ? 0 : 28,
      }}
      variants={fadeUp}
      whileHover={{
        y: plan.popular ? -6 : -4,
        boxShadow: plan.popular
          ? '0 0 80px rgba(95,1,251,0.30), 0 32px 80px rgba(0,0,0,0.6)'
          : '0 16px 48px rgba(0,0,0,0.5), 0 0 32px rgba(95,1,251,0.15)',
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${plan.accent}, transparent)` }}
      />

      {plan.popular && (
        <div className="absolute top-6 right-6">
          <Badge variant="brand" className="!text-[10px] !font-bold gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B2FFC] animate-pulse" />
            Most Popular
          </Badge>
        </div>
      )}

      {/* ── Header ── */}
      <div className="p-10 pb-8">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-6"
          style={{ background: `${plan.accent}20`, border: `1px solid ${plan.accent}35` }}
        >
          <plan.icon className="w-6 h-6" style={{ color: plan.accent }} strokeWidth={1.75} />
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">{plan.name}</h3>
        <p className="text-[#9B94C4] text-sm leading-relaxed mb-8">{plan.desc}</p>

        {/* Price */}
        {plan.price ? (
          <div className="flex items-end gap-1.5 mb-2">
            <span className="text-5xl font-bold text-white tracking-tight">
              ${isAnnual ? plan.price.annual : plan.price.monthly}
            </span>
            <span className="text-[#9B94C4] text-sm mb-1.5">/mo</span>
            {isAnnual && (
              <Badge variant="green" className="ml-2 !text-[10px] !py-0.5 mb-1.5">Save 20%</Badge>
            )}
          </div>
        ) : (
          <div className="text-4xl font-bold gradient-text mb-2">Talk to Us</div>
        )}
        {plan.price && (
          <p className="text-[11px] text-[#635D8C]">
            Billed {isAnnual ? 'annually' : 'monthly'} · Cancel anytime
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-10 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      {/* ── Features ── */}
      <div className="p-10 pt-8 flex-1">
        <p className="text-[10px] font-bold text-[#635D8C] uppercase tracking-[0.18em] mb-5">
          What's included
        </p>
        <ul className="flex flex-col gap-3.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-[#9B94C4] leading-snug">
              <Check className="w-4 h-4 text-[#7B2FFC] shrink-0 mt-0.5" strokeWidth={2.5} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* ── CTA ── */}
      <div className="px-10 pb-10 pt-6">
        <Button
          variant={plan.popular ? 'primary' : 'ghost'}
          className="w-full justify-center gap-2 !py-4"
        >
          {plan.price ? 'Start Free Trial' : 'Contact Sales'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="relative z-content" style={{ padding: '120px 0 140px' }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      <div className="section-container">
        <SectionHeading
          eyebrow="Pricing"
          title={<>Transparent Plans for<br /><span className="gradient-text">Every Team Size</span></>}
          subtitle="No hidden fees. No lock-in. Start free — upgrade when you're ready to scale."
        />

        {/* Toggle */}
        <motion.div
          className="flex items-center justify-center gap-4 mt-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className={`text-sm font-semibold ${!isAnnual ? 'text-white' : 'text-[#635D8C]'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full border transition-all duration-300 ${
              isAnnual ? 'bg-[#5F01FB] border-[#7B2FFC]' : 'bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <motion.div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ left: isAnnual ? '26px' : '2px' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </button>
          <span className={`text-sm font-semibold ${isAnnual ? 'text-white' : 'text-[#635D8C]'}`}>
            Annual <span className="text-[#22c55e] text-xs">−20%</span>
          </span>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 items-start"
          variants={stagger}
          {...inViewProps}
        >
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} isAnnual={isAnnual} />
          ))}
        </motion.div>

        {/* Trust bar */}
        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {['SOC 2 Type II', 'GDPR Compliant', 'ISO 27001', '99.9% SLA', 'EU AI Act Ready'].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-[#635D8C] text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-[#5F01FB]" strokeWidth={2.5} />
              {t}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
