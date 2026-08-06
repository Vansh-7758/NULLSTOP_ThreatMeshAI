'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { SectionHeading } from '@/components/landing/ui';
import { fadeUp, stagger, inViewProps } from '@/components/landing/lib/motion';

type TestimonialType = {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  quote: string;
  tag: string;
  accentBg: string;
};

const testimonials: TestimonialType[] = [
  {
    name: 'Sarah Chen',
    role: 'VP of Security Engineering',
    company: 'Meridian Labs',
    avatar: 'SC',
    rating: 5,
    quote: "ThreatMesh caught a log4j-core exploit path that our entire legacy SAST stack missed for 6 months. The graph reachability analysis is unlike anything we have seen in the market.",
    tag: 'Supply Chain',
    accentBg: 'from-[#5F01FB] to-[#3D0099]',
  },
  {
    name: 'Marcus Webb',
    role: 'CISO',
    company: 'Vanta Systems',
    avatar: 'MW',
    rating: 5,
    quote: "The AI Council gave us a full business blast radius assessment within 4 minutes of uploading our SBOM. That used to take our team 3 days of manual triaging.",
    tag: 'AI Council',
    accentBg: 'from-[#7B2FFC] to-[#5F01FB]',
  },
  {
    name: 'Priya Nair',
    role: 'Head of DevSecOps',
    company: 'Cloudrise',
    avatar: 'PN',
    rating: 5,
    quote: "The autonomous PR generation is honestly magical. We have gone from a 72-hour remediation cycle to sub-10-minute patching on critical CVEs. Our board is impressed.",
    tag: 'Automation',
    accentBg: 'from-[#514A85] to-[#5F01FB]',
  },
  {
    name: 'James Okonkwo',
    role: 'Platform Security Lead',
    company: 'Helix Finance',
    avatar: 'JO',
    rating: 5,
    quote: 'MITRE ATT&CK mapping used to be a quarterly exercise for compliance. ThreatMesh does it continuously and maps every CVE to a real business control. Incredible value.',
    tag: 'Compliance',
    accentBg: 'from-[#9A5FFD] to-[#7B2FFC]',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
      ))}
    </div>
  );
}

interface TestimonialCardProps {
  t: TestimonialType;
  index: number;
}

function TestimonialCard({ t, index }: TestimonialCardProps) {
  return (
    <motion.div
      className="relative glass rounded-[24px] p-7 border border-[rgba(95,1,251,0.15)] flex flex-col gap-5
        hover:border-[rgba(95,1,251,0.35)] hover:shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_32px_rgba(95,1,251,0.12)]
        transition-all duration-400 hover:-translate-y-1"
      variants={fadeUp}
      style={{ marginTop: index % 2 === 1 ? '32px' : '0' }}
    >
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-[1px] rounded-t-[24px] bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.35)] to-transparent" />

      {/* Tag */}
      <span className="inline-flex self-start items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[rgba(95,1,251,0.10)] text-[#9A5FFD] border border-[rgba(95,1,251,0.20)]">
        {t.tag}
      </span>

      {/* Quote */}
      <blockquote className="text-[#C4BFEC] text-[15px] leading-relaxed flex-1">
        "{t.quote}"
      </blockquote>

      {/* Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${t.accentBg.replace('from-', '').replace('to-', ', ')})` }}
          >
            {t.avatar}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{t.name}</p>
            <p className="text-[11px] text-[#635D8C]">{t.role} · {t.company}</p>
          </div>
        </div>
        <StarRating count={t.rating} />
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  return (
    <section className="relative py-[120px] z-content">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      <div className="section-container">
        <SectionHeading
          eyebrow="Testimonials"
          title={<>Trusted by Security<br /><span className="gradient-text">Leaders Worldwide</span></>}
          subtitle="From Series A startups to Fortune 500 security teams — here's what they say about ThreatMesh."
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-16"
          variants={stagger}
          {...inViewProps}
        >
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
