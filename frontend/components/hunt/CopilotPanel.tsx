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
            className="w-[380px] h-[500px] bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3"
          >
            {/* Header */}
            <div className="p-3.5 bg-[#0D1117] border-b border-[#30363D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00C896]/10 text-[#00C896]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#E6EDF3]">AI Security Copilot</h4>
                  <span className="text-[10px] text-[#00C896] block font-mono">Scan Context Connected</span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg bg-[#30363D]/40 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-[#00C896]/15 border border-[#00C896]/30 text-[#00C896] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={13} />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-xl p-3 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#00C896] text-[#0D1117] font-semibold rounded-tr-none'
                        : 'bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`text-[9px] block mt-1 text-right font-mono ${
                        msg.role === 'user' ? 'text-[#0D1117]/70' : 'text-[#8B949E]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[#30363D] text-[#E6EDF3] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={13} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-[#00C896] text-xs p-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>ThreatMesh Copilot reasoning...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Question Chips */}
            <div className="px-3 py-1.5 bg-[#0D1117]/60 border-t border-[#30363D]/40 flex gap-1.5 overflow-x-auto custom-scrollbar">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-2 py-0.5 bg-[#161B22] hover:bg-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-[10px] rounded-full border border-[#30363D] whitespace-nowrap transition-colors flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-3 bg-[#0D1117] border-t border-[#30363D] flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about scan risks, CVEs..."
                className="flex-1 bg-[#161B22] border border-[#30363D] rounded-xl px-3 py-2 text-xs text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#00C896]"
              />
              <button
                disabled={!inputQuery.trim() || isLoading}
                onClick={() => handleSend()}
                className="p-2 bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] font-bold rounded-xl transition-colors disabled:opacity-50"
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
          className="w-14 h-14 rounded-full bg-[#00C896] hover:bg-[#00a87d] text-[#0D1117] shadow-2xl flex items-center justify-center font-bold transition-all relative"
        >
          <MessageCircle size={26} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
        </motion.button>
      )}
    </div>
  );
}
