// frontend/components/shared/Navbar.tsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Upload, Eye, Radar, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadSBOM } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (pathname === '/landing') return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const res = await uploadSBOM(file);
        localStorage.setItem('active_scan_id', res.scan_id);
        localStorage.setItem('scan_id', res.scan_id);
        router.push(`/scan/${res.scan_id}`);
      } catch (err) {
        console.error('Failed to upload SBOM', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navItems = [
    {
      href: '/landing',
      label: 'LANDING',
      icon: Sparkles,
      activeColor: 'text-[#ED9E58]',
      badgeColor: 'bg-[#ED9E58]',
      isMatch: (p: string) => p === '/landing'
    },
    {
      href: '/',
      label: 'WATCH',
      icon: Eye,
      activeColor: 'text-[#ED9E58]',
      badgeColor: 'bg-[#ED9E58]',
      isMatch: (p: string) => p === '/' || p.startsWith('/scan/')
    },
    {
      href: '/hunt',
      label: 'HUNT',
      icon: Radar,
      activeColor: 'text-[#9A5FFD]',
      badgeColor: 'bg-[#9A5FFD]',
      isMatch: (p: string) => p.startsWith('/hunt')
    },
    {
      href: '/defend',
      label: 'DEFEND',
      icon: ShieldAlert,
      activeColor: 'text-[#ef4444]',
      badgeColor: 'bg-[#ef4444]',
      isMatch: (p: string) => p.startsWith('/defend') || p.startsWith('/governance') || p.startsWith('/red-team')
    }
  ];

  return (
    <header className="sticky top-0 z-50 px-6 py-3 bg-[rgba(27,25,49,0.92)] backdrop-blur-2xl border-b border-[rgba(233,188,185,0.25)] flex items-center justify-between shadow-[0_4px_32px_rgba(27,25,49,0.8)]">
      {/* Top Left: Logo Wordmark */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ED9E58] to-[#9A5FFD] shadow-[0_0_20px_rgba(237,158,88,0.5)] group-hover:shadow-[0_0_28px_rgba(237,158,88,0.7)] transition-all duration-300" />
          <Shield className="relative z-10 w-5 h-5 text-[#1B1931]" strokeWidth={2.5} />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
        </div>
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-base tracking-tight text-white font-['Plus_Jakarta_Sans']">ThreatMesh</span>
            <span className="font-extrabold text-base tracking-tight text-[#ED9E58] font-['Plus_Jakarta_Sans']">AI</span>
          </div>
          <span className="text-[9px] font-bold text-[#ED9E58] tracking-[0.15em] uppercase">Autonomous Platform</span>
        </div>
      </Link>

      {/* Center Navigation Dock */}
      <nav className="flex items-center bg-[rgba(27,25,49,0.95)] rounded-full px-5 py-1.5 gap-2 border border-[rgba(233,188,185,0.30)] shadow-[0_0_24px_rgba(27,25,49,0.9)]">
        {navItems.map((item) => {
          const isActive = item.isMatch(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 group ${
                isActive ? 'bg-[rgba(237,158,88,0.18)] text-white border border-[rgba(237,158,88,0.40)]' : 'hover:bg-[rgba(255,255,255,0.10)] text-[#E9BCB9]'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? item.activeColor : 'text-[#ED9E58] group-hover:text-white'}`} />
              <span className={`font-mono text-xs font-bold tracking-wider ${isActive ? 'text-white font-extrabold' : 'text-[#E9BCB9] group-hover:text-white'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="hac333k-nav-indicator"
                  className={`absolute -bottom-1 left-3 right-3 h-0.5 rounded-full ${item.badgeColor}`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Top Right: System Status & Upload Button */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.35)] text-xs font-mono">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
          </div>
          <span className="text-[11px] font-bold text-[#22c55e] tracking-wider">SYSTEM OPERATIONAL</span>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json,.xml" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary-brand text-xs font-bold tracking-wide flex items-center gap-1.5"
        >
          <Upload size={14} />
          <span>UPLOAD SBOM</span>
        </button>
      </div>
    </header>
  );
}
