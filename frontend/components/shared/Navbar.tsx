// frontend/components/shared/Navbar.tsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Upload, Eye, Radar, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadSBOM } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      href: '/',
      label: 'WATCH',
      icon: Eye,
      activeColor: 'text-[#7C3AED]',
      badgeColor: 'bg-[#7C3AED]',
      isMatch: (p: string) => p === '/' || p.startsWith('/scan/')
    },
    {
      href: '/hunt',
      label: 'HUNT',
      icon: Radar,
      activeColor: 'text-[#0053DB]',
      badgeColor: 'bg-[#0053DB]',
      isMatch: (p: string) => p.startsWith('/hunt')
    },
    {
      href: '/defend',
      label: 'DEFEND',
      icon: ShieldAlert,
      activeColor: 'text-[#E84040]',
      badgeColor: 'bg-[#E84040]',
      isMatch: (p: string) => p.startsWith('/defend') || p.startsWith('/governance') || p.startsWith('/red-team')
    }
  ];

  return (
    <header className="sticky top-0 z-50 px-6 py-3 bg-[#09090F]/80 backdrop-blur-xl border-b border-[#1E1E3A] flex items-center justify-between shadow-2xl">
      {/* Top Left: Wordmark */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="p-1.5 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/30 group-hover:border-[#7C3AED] transition-all">
          <Shield className="w-5 h-5 text-[#7C3AED]" />
        </div>
        <div className="flex items-baseline">
          <span className="font-extrabold text-lg tracking-tighter text-white font-['Space_Grotesk']">THREAT</span>
          <span className="font-extrabold text-lg tracking-tighter text-[#7C3AED] font-['Space_Grotesk']">MESH</span>
          <span className="text-[9px] font-mono text-[#00C896] ml-1.5 px-1.5 py-0.5 rounded bg-[#00C896]/10 border border-[#00C896]/30 font-bold">AI</span>
        </div>
      </Link>

      {/* Center Navigation Dock (Stitch Glass Dock) */}
      <nav className="flex items-center glass-panel rounded-full px-5 py-1.5 gap-6 border border-[#1E1E3A] shadow-inner">
        {navItems.map((item) => {
          const isActive = item.isMatch(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-2 px-3 py-1 rounded-full transition-all group"
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? item.activeColor : 'text-[#8B949E]'}`} />
              <span className={`font-mono text-xs font-bold tracking-wider ${isActive ? 'text-white' : 'text-[#8B949E] group-hover:text-white'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="stitch-nav-indicator"
                  className={`absolute -bottom-1 left-2 right-2 h-0.5 rounded-full ${item.badgeColor}`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Top Right: System Status & Upload Button */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#141428] border border-[#1E1E3A] text-xs font-mono">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C896] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C896]"></span>
          </div>
          <span className="text-[#8B949E]">SYSTEMS OPERATIONAL</span>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json,.xml" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6d28d9] text-white text-xs font-bold font-mono rounded-lg shadow-lg shadow-[#7C3AED]/20 border border-[#7C3AED]/50 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
        >
          <Upload size={14} />
          <span>UPLOAD SBOM</span>
        </button>
      </div>
    </header>
  );
}
