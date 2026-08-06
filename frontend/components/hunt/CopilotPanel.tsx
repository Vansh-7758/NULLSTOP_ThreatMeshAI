// frontend/components/hunt/CopilotPanel.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { askCopilot } from '@/lib/api';
import { CopilotMessage } from '@/types';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface CopilotPanelProps {
  scanId: string;
}

const QUICK_QUESTIONS = [
  'Which suppliers are most at risk today?',
  'Are we exposed to any actively exploited CVEs?',
  'Which package should I patch first?',
  'What is our current compliance status?'
];

export default function CopilotPanel({ scanId }: CopilotPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am ThreatMesh AI Security Copilot. Ask me anything about your supply chain scan, active threat paths, or AI council recommendations.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuery.trim();
    if (!q || isLoading) return;

    const userMsg: CopilotMessage = {
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await askCopilot(scanId, q);
      const botMsg: CopilotMessage = {
        role: 'assistant',
        content: res.answer || 'Analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errorMsg: CopilotMessage = {
        role: 'assistant',
        content: `Error processing question: ${e.message || 'Server error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-[380px] h-[500px] glass-card border border-[rgba(163,64,84,0.30)] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3"
          >
            {/* Header */}
            <div className="p-4 bg-[rgba(11,13,27,0.90)] border-b border-[rgba(163,64,84,0.20)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-[rgba(237,158,88,0.15)] text-[#ED9E58] border border-[rgba(237,158,88,0.30)]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-['Plus_Jakarta_Sans']">AI Security Copilot</h4>
                  <span className="text-[10px] text-[#22c55e] block font-mono font-bold">Scan Context Connected</span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-[rgba(255,255,255,0.06)] text-[#A34054] hover:text-white hover:bg-[rgba(255,255,255,0.12)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-[rgba(237,158,88,0.15)] border border-[rgba(237,158,88,0.30)] text-[#ED9E58] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#ED9E58] to-[#A34054] text-[#1B1931] font-bold rounded-tr-none shadow-[0_0_20px_rgba(237,158,88,0.20)]'
                        : 'bg-[rgba(11,13,27,0.80)] border border-[rgba(163,64,84,0.20)] text-[#E9BCB9] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`text-[9px] block mt-1 text-right font-mono ${
                        msg.role === 'user' ? 'text-[#1B1931]/70' : 'text-[#A34054]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] text-[#E9BCB9] flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-[#ED9E58] text-xs p-2 font-mono">
                  <Loader2 size={14} className="animate-spin text-[#ED9E58]" />
                  <span>ThreatMesh Copilot reasoning...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Question Chips */}
            <div className="px-3 py-2 bg-[rgba(11,13,27,0.80)] border-t border-[rgba(163,64,84,0.15)] flex gap-1.5 overflow-x-auto custom-scrollbar">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 bg-[rgba(27,25,49,0.70)] hover:bg-[rgba(237,158,88,0.12)] text-[#A34054] hover:text-[#ED9E58] text-[10px] font-mono rounded-full border border-[rgba(163,64,84,0.20)] whitespace-nowrap transition-colors shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-3 bg-[rgba(11,13,27,0.90)] border-t border-[rgba(163,64,84,0.20)] flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about scan risks, CVEs..."
                className="flex-1 bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#A34054] focus:outline-none focus:border-[#ED9E58] transition-colors"
              />
              <button
                disabled={!inputQuery.trim() || isLoading}
                onClick={() => handleSend()}
                className="btn-primary-brand text-xs !py-2 !px-3 disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#ED9E58] to-[#A34054] text-[#1B1931] shadow-[0_0_32px_rgba(237,158,88,0.40)] flex items-center justify-center font-bold transition-all relative"
        >
          <MessageCircle size={26} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e]" />
          </span>
        </motion.button>
      )}
    </div>
  );
}
