'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/landing/ui';

export default function CTABanner() {
  return (
    <section className="relative py-[120px] z-content overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.20)] to-transparent" />

      <div className="section-container">
        <motion.div
          className="relative rounded-[28px] overflow-hidden p-12 md:p-16 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(95,1,251,0.20) 0%, rgba(81,74,133,0.10) 50%, rgba(61,0,153,0.15) 100%)',
            border: '1px solid rgba(95,1,251,0.30)',
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Decorative blobs inside card */}
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(95,1,251,0.25)_0%,transparent_70%)] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(81,74,133,0.20)_0%,transparent_70%)] translate-x-1/2 translate-y-1/2 pointer-events-none" />

          {/* Scan line */}
          <div className="scan-line opacity-30" />

          <div className="relative z-10">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{ background: 'rgba(95,1,251,0.15)', border: '1px solid rgba(95,1,251,0.30)', color: '#C4B5FD' }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7B2FFC] animate-pulse" />
              Now in Early Access
            </motion.div>

            <motion.h2
              className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="text-white">Your Supply Chain</span>
              <br />
              <span className="gradient-text">Deserves Better</span>
            </motion.h2>

            <motion.p
              className="text-[#9B94C4] text-lg leading-relaxed max-w-xl mx-auto mb-10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Upload your first SBOM in under 60 seconds. No credit card required.
              No agents to install. Just answers.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button variant="primary" className="gap-2.5 text-[15px] !px-8 !py-4">
                Start Free Scan
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="glass" className="gap-2.5 text-[15px] !px-8 !py-4">
                Book a Demo
              </Button>
            </motion.div>

            <p className="text-[#635D8C] text-xs mt-6">
              SOC 2 Type II · GDPR · ISO 27001 · No credit card required
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
