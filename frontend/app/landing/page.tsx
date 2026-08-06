'use client';

import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/landing/layout/LandingNavbar';
import Footer from '@/components/landing/layout/Footer';
import Hero from '@/components/landing/sections/Hero';
import TrustedBy from '@/components/landing/sections/TrustedBy';
import Problem from '@/components/landing/sections/Problem';
import Features from '@/components/landing/sections/Features';
import DashboardPreview from '@/components/landing/sections/DashboardPreview';
import HowItWorks from '@/components/landing/sections/HowItWorks';
import Benefits from '@/components/landing/sections/Benefits';
import ResearchAI from '@/components/landing/sections/ResearchAI';
import Pricing from '@/components/landing/sections/Pricing';
import Testimonials from '@/components/landing/sections/Testimonials';
import FAQ from '@/components/landing/sections/FAQ';
import CTABanner from '@/components/landing/sections/CTABanner';
import SectionDivider from '@/components/landing/ui/SectionDivider';

export default function LandingPage() {
  return (
    <motion.div
      className="min-h-screen bg-[#1B1931] text-[#E9BCB9] overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Ambient blobs */}
      <div className="blob-1" aria-hidden="true" />
      <div className="blob-2" aria-hidden="true" />
      <div className="blob-3" aria-hidden="true" />

      {/* Page light sweep */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'linear-gradient(135deg, rgba(237,158,88,0.04) 0%, transparent 50%, rgba(102,34,73,0.04) 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        aria-hidden="true"
      />

      <LandingNavbar />

      <main>
        {/* 1 — Hero */}
        <Hero />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="full" />

        {/* 2 — Trusted By */}
        <TrustedBy />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="chapter" chapter="The Challenge" />

        {/* 3 — Problem */}
        <Problem />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="glow" />

        {/* 4 — Features */}
        <Features />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="double" />

        {/* 5 — Dashboard Preview */}
        <DashboardPreview />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="chapter" chapter="How It Works" />

        {/* 6 — How It Works */}
        <HowItWorks />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="full" />

        {/* 7 — Benefits */}
        <Benefits />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="glow" />

        {/* 8 — Research & AI */}
        <ResearchAI />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="chapter" chapter="Plans & Pricing" />

        {/* 9 — Pricing */}
        <Pricing />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="double" />

        {/* 10 — Testimonials */}
        <Testimonials />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="glow" />

        {/* 11 — FAQ */}
        <FAQ />

        {/* ════ DIVIDER ════ */}
        <SectionDivider variant="full" />

        {/* 12 — CTA Banner */}
        <CTABanner />
      </main>

      {/* ════ FOOTER DIVIDER ════ */}
      <SectionDivider variant="double" />

      <Footer />
    </motion.div>
  );
}
