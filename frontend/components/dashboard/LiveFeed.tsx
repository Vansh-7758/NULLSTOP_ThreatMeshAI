'use client'

import React, { useRef, useEffect } from 'react';
import { LiveFeedEvent } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function LiveFeed({ events }: { events: LiveFeedEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events]);

  const getDotColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-danger';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-warning';
      case 'LOW': return 'bg-accent';
      default: return 'bg-text-secondary';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-[400px]">
      <div className="p-4 border-b border-border flex items-center space-x-2">
        <Activity className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-bold">Live Activity</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={containerRef}>
        {events.length === 0 ? (
          <div className="text-center text-text-secondary pt-10">No recent events</div>
        ) : (
          <AnimatePresence>
            {events.slice(0, 20).map((event, idx) => (
              <motion.div
                key={`${event.timestamp}-${idx}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-3 items-start"
              >
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${getDotColor(event.severity)}`} />
                <div>
                  <div className="text-sm font-medium">{event.title}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{event.description}</div>
                  <div className="text-xs text-text-secondary opacity-70 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
