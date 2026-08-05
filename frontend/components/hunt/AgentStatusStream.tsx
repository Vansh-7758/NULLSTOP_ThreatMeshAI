// frontend/components/hunt/AgentStatusStream.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { wsClient } from '@/lib/websocket';
import {
  Shield,
  TrendingDown,
  Star,
  Wrench,
  Scale,
  Eye,
  FileCheck,
  Brain,
  ChevronUp,
  ChevronDown,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface StreamEvent {
  id: string;
  agent_name: string;
  package_name: string;
  verdict: string;
  timestamp: string;
  is_consensus?: boolean;
  confidence_score?: number;
}

interface AgentStatusStreamProps {
  scanId: string;
}

const AGENT_ICONS: Record<string, any> = {
  'Threat Agent': Shield,
  'Risk Agent': TrendingDown,
  'Trust Agent': Star,
  'Patch Agent': Wrench,
  'Compliance Agent': Scale,
  'Safety Agent': Eye,
  'Governance Agent': FileCheck,
  'Consensus Engine': Brain,
  'Consensus Node': Brain
};

export default function AgentStatusStream({ scanId }: AgentStatusStreamProps) {
  const shouldReduceMotion = useReducedMotion();
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = wsClient.onMessage((data: unknown) => {
      const msg = data as Record<string, any>;
      if (msg && (msg.event_type === 'agent_completed' || msg.event_type === 'council_completed')) {
        const isConsensus = msg.event_type === 'council_completed';
        const newEvt: StreamEvent = {
          id: msg.id || 'evt-' + Math.random(),
          agent_name: isConsensus ? 'Consensus Engine' : msg.agent_name || 'AI Agent',
          package_name: msg.package_name || '',
          verdict: isConsensus
            ? `Final consensus generated (${msg.playbooks_generated || 1} playbooks ready)`
            : msg.verdict || 'Analysis completed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          is_consensus: isConsensus,
          confidence_score: msg.confidence_score
        };

        setEvents((prev) => [newEvt, ...prev.slice(0, 49)]);
      }
    });

    return () => unsubscribe();
  }, [scanId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="p-3.5 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C896] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00C896]"></span>
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3] flex items-center gap-2">
            Live AI Agent Execution Stream ({events.length})
          </h4>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#8B949E] hover:text-[#E6EDF3] p-1 rounded transition-colors"
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Stream List */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 bg-[#0D1117] max-h-48 overflow-y-auto space-y-2 custom-scrollbar"
            ref={scrollRef}
          >
            {events.length === 0 ? (
              <p className="text-xs text-[#8B949E] italic text-center py-4">
                Awaiting agent execution events... Trigger a threat hunt to watch 8 AI agents in action.
              </p>
            ) : (
              events.map((evt) => {
                const IconComponent: any = AGENT_ICONS[evt.agent_name] || Brain;
                return (
                  <motion.div
                    key={evt.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                      evt.is_consensus
                        ? 'bg-[#00C896]/10 border-[#00C896]/40 text-[#E6EDF3]'
                        : 'bg-[#161B22] border-[#30363D]/70 text-[#E6EDF3]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-md ${
                          evt.is_consensus ? 'bg-[#00C896] text-[#0D1117]' : 'bg-[#0D1117] text-[#00C896]'
                        }`}
                      >
                        <IconComponent size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#E6EDF3]">{evt.agent_name}</span>
                          {evt.package_name && (
                            <span className="font-mono text-[10px] text-[#8B949E]">[{evt.package_name}]</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8B949E] leading-snug mt-0.5">{evt.verdict}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-[10px] text-[#8B949E] block">{evt.timestamp}</span>
                      {evt.is_consensus && (
                        <span className="text-[9px] font-mono text-[#00C896] font-bold block">CONSENSUS</span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
