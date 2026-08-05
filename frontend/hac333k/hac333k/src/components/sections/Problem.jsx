import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, TrendingUp, Globe, Users, Shield } from 'lucide-react';
import { SectionHeading } from '../ui';
import { fadeUp, stagger, inViewProps } from '../../lib/motion';

const stats = [
  { value: '78%',   label: 'of enterprises experienced a supply chain attack in 2024',       color: '#ef4444' },
  { value: '4.2M',  label: 'average cost of a software supply chain breach (USD)',             color: '#f59e0b' },
  { value: '287',   label: 'average days to detect a supply chain compromise',                 color: '#9A5FFD' },
  { value: '94%',   label: 'of teams lack real-time dependency vulnerability visibility',       color: '#5F01FB' },
];

const problems = [
  {
    icon: Globe,
    number: '01',
    title: 'Invisible Attack Surfaces',
    body: 'Modern applications depend on thousands of transitive packages. A single compromised upstream library can silently propagate through your entire supply chain undetected for months.',
    tag: 'Discovery Gap',
  },
  {
    icon: Clock,
    number: '02',
    title: 'Reactive, Not Predictive',
    body: 'Traditional SAST and SCA tools generate CVE reports after the fact. Security teams spend 73% of their time triaging noise instead of responding to real threats with actual business impact.',
    tag: 'Response Lag',
  },
  {
    icon: Users,
    number: '03',
    title: 'No Governance Framework',
    body: 'Compliance mapping to NIST CSF, MITRE ATT&CK, OWASP, and EU AI Act is manual and inconsistent. There is no unified layer connecting technical risk to business and regulatory consequence.',
    tag: 'Compliance Debt',
  },
];

/* Animated stat counter */
function StatCard({ value, label, color, index }) {
  return (
    <motion.div
      className="relative overflow-hidden glass glow-ring p-6 rounded-[20px] group hover:shadow-[0_0_40px_rgba(95,1,251,0.20)] transition-shadow duration-400"
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-[20px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <p
        className="text-5xl font-bold mb-2 tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-[#9B94C4] text-sm leading-relaxed">{label}</p>
    </motion.div>
  );
}

/* Problem timeline card */
function ProblemCard({ item, index, isLeft }) {
  return (
    <motion.div
      className="relative grid md:grid-cols-2 gap-8 items-center"
      variants={fadeUp}
    >
      {/* Number + connector */}
      <div className={`flex flex-col items-center gap-4 ${!isLeft ? 'md:order-last' : ''}`}>
        <div className="relative">
          <div
            className="w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(95,1,251,0.20), rgba(81,74,133,0.10))',
              border: '1px solid rgba(95,1,251,0.30)',
              color: '#C4BFEC',
            }}
          >
            {item.number}
          </div>
          {index < problems.length - 1 && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-[rgba(95,1,251,0.40)] to-transparent" />
          )}
        </div>
        <item.icon className="w-8 h-8 text-[#514A85]" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className={`glass glow-ring rounded-[24px] p-8 group hover:shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_32px_rgba(95,1,251,0.15)] transition-all duration-400 hover:-translate-y-1 ${!isLeft ? 'md:order-first' : ''}`}>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[rgba(95,1,251,0.12)] text-[#9A5FFD] border border-[rgba(95,1,251,0.25)] mb-4">
          <AlertTriangle className="w-3 h-3" />
          {item.tag}
        </span>
        <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
        <p className="text-[#9B94C4] text-[15px] leading-relaxed">{item.body}</p>
      </div>
    </motion.div>
  );
}

export default function Problem() {
  return (
    <section id="solutions" className="relative py-[120px] z-content">

      {/* Background accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      <div className="section-container">

        <SectionHeading
          eyebrow="The Problem"
          title={<>The Supply Chain<br /><span className="gradient-text-light">Blind Spot</span></>}
          subtitle="Every dependency is a potential attack vector. Most enterprises don't know what they're running — until it's too late."
        />

        {/* Stat grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16"
          variants={stagger}
          {...inViewProps}
        >
          {stats.map((s, i) => (
            <StatCard key={s.value} {...s} index={i} />
          ))}
        </motion.div>

        {/* Timeline problems */}
        <motion.div
          className="flex flex-col gap-20 mt-24"
          variants={stagger}
          {...inViewProps}
        >
          {problems.map((item, i) => (
            <ProblemCard key={item.number} item={item} index={i} isLeft={i % 2 === 0} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
