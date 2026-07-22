'use client'

import React, { useState } from 'react';
import { Playbook } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BookOpen, Link as LinkIcon } from 'lucide-react';

export default function PlaybookCard({ playbook }: { playbook: Playbook }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-border/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-accent" />
          <h4 className="font-bold text-lg">{playbook.package_name}</h4>
          <span className="bg-background text-text-secondary border border-border px-2 py-0.5 rounded text-xs">
            Confidence: {Math.round(playbook.confidence_score * 100)}%
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4 text-sm">
              <div>
                <strong className="block text-text-secondary mb-1">Threat Summary</strong>
                <p>{playbook.threat_summary}</p>
              </div>
              <div>
                <strong className="block text-text-secondary mb-1">Business Impact</strong>
                <p>{playbook.business_impact}</p>
              </div>
              <div>
                <strong className="block text-text-secondary mb-1">Trust Explanation</strong>
                <p>{playbook.trust_explanation}</p>
              </div>
              <div>
                <strong className="block text-text-secondary mb-1">Recommended Action</strong>
                <p>{playbook.recommended_action}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.entries(playbook.compliance_mapping).map(([key, val]) => (
                  <span key={key} className="bg-background border border-border px-2 py-1 rounded-md text-xs">
                    <strong className="text-accent">{key}:</strong> {val}
                  </span>
                ))}
              </div>
              
              {playbook.evidence_citations.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <strong className="block text-text-secondary mb-2">Evidence</strong>
                  <ul className="space-y-1">
                    {playbook.evidence_citations.map((cite, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-xs">
                        <LinkIcon className="w-3 h-3 text-text-secondary" />
                        <a href={cite} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate">
                          {cite}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
