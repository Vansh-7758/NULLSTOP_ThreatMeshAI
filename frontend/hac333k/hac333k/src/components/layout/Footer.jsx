import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Globe, Code, Users, Mail, ArrowRight } from 'lucide-react';
import { Button } from '../ui';

const footerLinks = {
  Product: ['Features', 'Dashboard', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'],
  Company:  ['About', 'Blog', 'Careers', 'Press Kit', 'Security', 'Contact'],
  Resources:['Documentation', 'Research', 'SBOM Guide', 'CVE Database', 'Status', 'Community'],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="relative z-content border-t border-[rgba(95,1,251,0.12)]">
      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(95,1,251,0.25)] to-transparent" />

      <div className="section-container py-16">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-[rgba(95,1,251,0.08)]">

          {/* Brand column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5F01FB] to-[#3D0099] flex items-center justify-center shadow-[0_0_20px_rgba(95,1,251,0.4)]">
                <Shield className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-[15px] text-white tracking-tight">ThreatMesh AI</p>
                <p className="text-[9px] font-semibold text-[#9B94C4] tracking-[0.15em] uppercase">Autonomous Defense</p>
              </div>
            </div>

            <p className="text-[#9B94C4] text-sm leading-relaxed mb-6 max-w-[280px]">
              The world's first autonomous AI Governance & Software Supply Chain Defense Platform.
              Predict. Protect. Govern. Trust.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-bold text-white mb-3 uppercase tracking-widest">Security Newsletter</p>
              {subscribed ? (
                <motion.p
                  className="text-sm text-[#22c55e] font-semibold"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ✓ You're subscribed — threat intel incoming.
                </motion.p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@company.com"
                    className="flex-1 px-4 py-2.5 rounded-[12px] text-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(95,1,251,0.20)] text-white placeholder:text-[#635D8C] focus:outline-none focus:border-[rgba(95,1,251,0.50)] transition-colors duration-200"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-[12px] bg-[#5F01FB] flex items-center justify-center shrink-0 hover:bg-[#7B2FFC] transition-colors duration-200"
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </form>
              )}
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-5">
              {[
                { icon: Globe,  label: 'Twitter' },
                { icon: Code,   label: 'GitHub' },
                { icon: Users,  label: 'LinkedIn' },
                { icon: Mail,   label: 'Email' },
              ].map(({ icon: Icon, label }) => (
                <motion.a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#635D8C] hover:text-white transition-colors duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  whileHover={{ background: 'rgba(95,1,251,0.15)', borderColor: 'rgba(95,1,251,0.35)', scale: 1.05 }}
                  transition={{ duration: 0.25 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-5">{section}</p>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#635D8C] hover:text-[#C4BFEC] transition-colors duration-200 font-medium"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#635D8C] text-xs">
            © 2025 ThreatMesh AI, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map((l) => (
              <a key={l} href="#" className="text-[#635D8C] text-xs hover:text-[#9B94C4] transition-colors duration-200">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[10px] text-[#635D8C] font-semibold">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
