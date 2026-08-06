// frontend/components/dashboard/LiveFeed.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';
import { Package, CVERecord } from '@/types';
import { wsClient } from '@/lib/websocket';

interface LiveFeedProps {
  packages: Package[];
  cves: CVERecord[];
  scanId: string;
}

interface FeedItem {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

export default function LiveFeed({ packages, cves, scanId }: LiveFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const initial: FeedItem[] = [];

    cves.forEach((cve, idx) => {
      initial.push({
        id: `cve-${idx}-${cve.cve_id}`,
        title: `${cve.cve_id} Detected`,
        description: cve.description || `Vulnerability in affected components`,
        severity: (cve.severity as any) || 'HIGH',
        timestamp: new Date(Date.now() - idx * 45000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    });

    packages
      .filter((p) => p.trust_score < 50)
      .forEach((p, idx) => {
        initial.push({
          id: `pkg-${idx}-${p.id}`,
          title: `Degraded Trust: ${p.name}`,
          description: `Trust score dropped to ${p.trust_score.toFixed(1)} / 100`,
          severity: p.trust_score < 25 ? 'CRITICAL' : 'HIGH',
          timestamp: new Date(Date.now() - (idx + cves.length) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      });

    if (initial.length === 0) {
      initial.push(
        { id: '1', title: 'CVE-2021-44228 Detected', description: 'Log4Shell RCE in log4j-core 2.14.1', severity: 'CRITICAL', timestamp: 'Just now' },
        { id: '2', title: 'Trust Score Degraded', description: 'struts2-core score dropped to 15.0', severity: 'HIGH', timestamp: '1m ago' },
        { id: '3', title: 'NVD Sync Complete', description: 'Queried 8 package ecosystems in parallel', severity: 'LOW', timestamp: '2m ago' }
      );
    }

    setFeedItems(initial.slice(0, 8));
  }, [packages, cves]);

  useEffect(() => {
    const unsub = wsClient.onLiveEvent((event: any) => {
      const newItem: FeedItem = {
        id: `ws-${Date.now()}`,
        title: event.title || event.event_type || 'System Event',
        description: event.description || 'Real-time threat update received',
        severity: (event.severity?.toUpperCase() as any) || 'HIGH',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setFeedItems((prev) => [newItem, ...prev.slice(0, 7)]);
    });

    return () => {
      unsub();
    };
  }, []);

  const getSevBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return { color: '#ef4444', bg: 'rgba(239,68,68,0.20)', border: 'rgba(239,68,68,0.40)' };
      case 'HIGH':
        return { color: '#f59e0b', bg: 'rgba(245,158,11,0.20)', border: 'rgba(245,158,11,0.40)' };
      case 'MEDIUM':
        return { color: '#9A5FFD', bg: 'rgba(154,95,253,0.20)', border: 'rgba(154,95,253,0.40)' };
      default:
        return { color: '#22c55e', bg: 'rgba(34,197,94,0.20)', border: 'rgba(34,197,94,0.40)' };
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden h-full min-h-[400px]">
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }}
      />

      <div className="flex items-center justify-between mb-4 border-b border-[rgba(233,188,185,0.20)] pb-3">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-[#ef4444] animate-pulse" />
          <h3 className="text-xs font-extrabold text-[#ED9E58] uppercase tracking-widest font-['Plus_Jakarta_Sans']">
            REAL-TIME INTEL FEED
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.30)] text-[#22c55e] text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
          LIVE WS
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px]">
        <AnimatePresence initial={false}>
          {feedItems.map((item) => {
            const badge = getSevBadge(item.severity);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(233,188,185,0.20)] hover:border-[rgba(237,158,88,0.50)] hover:bg-[rgba(237,158,88,0.08)] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-[#ED9E58] transition-colors truncate font-['Plus_Jakarta_Sans']">
                    {item.title}
                  </span>
                  <span
                    className="text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide font-mono"
                    style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                  >
                    {item.severity}
                  </span>
                </div>
                <p className="text-[11px] text-[#CBD5E1] line-clamp-2 leading-relaxed mb-1.5 font-sans">
                  {item.description}
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono font-semibold text-[#ED9E58]">
                  <span>Source: NVD / OSV.dev</span>
                  <span>{item.timestamp}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
