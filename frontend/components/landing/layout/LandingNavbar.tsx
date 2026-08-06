'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/landing/ui';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Home',      href: '#home' },
  { label: 'Features',  href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Research',  href: '#research' },
  { label: 'Pricing',   href: '#pricing' },
  { label: 'About',     href: '#about' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[rgba(11,13,27,0.80)] backdrop-blur-[24px] border-b border-[rgba(95,1,251,0.12)] shadow-[0_4px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <motion.a
              href="#home"
              className="flex items-center gap-2.5 z-content"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#5F01FB] to-[#3D0099] shadow-[0_0_20px_rgba(95,1,251,0.5)]" />
                <Shield className="relative z-10 w-5 h-5 text-white" strokeWidth={2} />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#9A5FFD] animate-pulse" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-[15px] text-white tracking-tight">ThreatMesh</span>
                <span className="text-[10px] font-semibold text-[#9B94C4] tracking-[0.15em] uppercase">AI Platform</span>
              </div>
            </motion.a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium text-[#9B94C4] hover:text-white transition-colors duration-200 rounded-xl group"
                  whileHover={{ backgroundColor: 'rgba(95,1,251,0.08)' }}
                  onClick={() => setActiveLink(link.href)}
                >
                  {link.label}
                  <span className="absolute bottom-1 left-4 right-4 h-[1px] bg-gradient-to-r from-[#5F01FB] to-[#9A5FFD] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                </motion.a>
              ))}
            </nav>

            {/* CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <motion.a
                href="#login"
                className="text-sm font-semibold text-[#9B94C4] hover:text-white transition-colors duration-200 px-4 py-2"
                whileHover={{ color: '#fff' }}
              >
                Login
              </motion.a>
              <Button variant="primary" className="!py-2.5 !px-5 !text-sm gap-1.5" href="/">
                Get Started
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <motion.button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(95,1,251,0.25)] bg-[rgba(95,1,251,0.08)] text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              whileTap={{ scale: 0.92 }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-x-0 top-[72px] z-40 bg-[rgba(11,13,27,0.97)] backdrop-blur-[32px] border-b border-[rgba(95,1,251,0.15)] shadow-xl lg:hidden"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="section-container py-6 flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-[#9B94C4] hover:text-white hover:bg-[rgba(95,1,251,0.10)] transition-all duration-200 font-medium"
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </motion.a>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Button variant="ghost" className="w-full justify-center">Login</Button>
                <Button variant="primary" className="w-full justify-center" href="/">Get Started</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
