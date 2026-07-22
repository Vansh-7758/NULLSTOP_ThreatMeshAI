'use client'

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadSBOM } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/governance', label: 'Governance' },
    { href: '/red-team', label: 'Red Team' },
    { href: '/demo', label: 'Demo' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const res = await uploadSBOM(file);
        router.push(`/scan/${res.scan_id}`);
      } catch (err) {
        console.error('Failed to upload SBOM', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-text-primary hover:text-accent transition-colors">
          <Shield className="w-8 h-8 text-accent" />
          <span className="text-xl font-bold">ThreatMesh X</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          {links.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className="relative px-2 py-1">
                <span className={`text-sm font-medium ${isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json,.xml" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-card hover:bg-border text-text-primary border border-border rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload SBOM</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
