// frontend/components/defend/AuditLogTable.tsx
'use client';

import React, { useState } from 'react';
import { GovernanceEvent } from '@/types';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface AuditLogTableProps {
  events: GovernanceEvent[];
}

export default function AuditLogTable({ events }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const paginatedEvents = events.slice(0, page * pageSize);

  const getRiskBadge = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL': return <span className="text-[#ef4444] bg-[rgba(239,68,68,0.20)] border border-[rgba(239,68,68,0.40)] px-2 py-0.5 rounded text-[10px] font-mono font-extrabold">CRITICAL</span>;
      case 'HIGH': return <span className="text-[#f59e0b] bg-[rgba(245,158,11,0.20)] border border-[rgba(245,158,11,0.40)] px-2 py-0.5 rounded text-[10px] font-mono font-extrabold">HIGH</span>;
      case 'MEDIUM': return <span className="text-[#ED9E58] bg-[rgba(237,158,88,0.20)] border border-[rgba(237,158,88,0.40)] px-2 py-0.5 rounded text-[10px] font-mono font-extrabold">MEDIUM</span>;
      case 'LOW': return <span className="text-[#22c55e] bg-[rgba(34,197,94,0.20)] border border-[rgba(34,197,94,0.40)] px-2 py-0.5 rounded text-[10px] font-mono font-extrabold">LOW</span>;
      default: return <span className="text-[#22c55e] bg-[rgba(34,197,94,0.20)] border border-[rgba(34,197,94,0.40)] px-2 py-0.5 rounded text-[10px] font-mono font-extrabold">SAFE</span>;
    }
  };

  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-[rgba(233,188,185,0.20)] pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
          <Clock size={14} className="text-[#22c55e]" /> Governance Audit Log Stream
        </h4>
        <span className="text-[10px] font-mono text-[#CBD5E1] font-bold">
          Showing {paginatedEvents.length} of {events.length} Events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#CBD5E1] font-sans">
          No governance events recorded yet. Run AI agents in HUNT or test policies above.
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(233,188,185,0.20)] text-[#ED9E58] uppercase text-[9px] font-mono font-extrabold">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Risk Level</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Policy Triggered</th>
                <th className="py-2 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(233,188,185,0.12)]">
              {paginatedEvents.map((evt) => {
                const isExpanded = expandedId === evt.id;
                const isBlocked = evt.policy_result === 'BLOCKED';

                return (
                  <React.Fragment key={evt.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                      className="hover:bg-[rgba(237,158,88,0.08)] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[10px] text-[#CBD5E1] whitespace-nowrap font-bold">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-white font-bold">
                        {evt.event_type}
                      </td>
                      <td className="py-2.5 px-3">{getRiskBadge(evt.risk_level)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono text-[10px] font-extrabold ${isBlocked ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                          {evt.policy_result}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-white">
                        {(evt.details as { policy?: string })?.policy || (isBlocked ? 'GOV-P Check' : 'None')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#CBD5E1]">
                        {isExpanded ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[rgba(11,13,27,0.80)] border-b border-[rgba(233,188,185,0.15)]">
                        <td colSpan={6} className="p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <strong className="block text-[10px] font-mono text-[#ED9E58] uppercase mb-1">Prompt Stream</strong>
                              <pre className="p-2.5 bg-[rgba(27,25,49,0.90)] border border-[rgba(233,188,185,0.20)] rounded-xl text-[11px] font-mono text-white whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar">
                                {evt.prompt || 'No prompt payload stored'}
                              </pre>
                            </div>
                            <div>
                              <strong className="block text-[10px] font-mono text-[#ED9E58] uppercase mb-1">Response Stream</strong>
                              <pre className="p-2.5 bg-[rgba(27,25,49,0.90)] border border-[rgba(233,188,185,0.20)] rounded-xl text-[11px] font-mono text-white whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar">
                                {evt.response || 'No response payload stored'}
                              </pre>
                            </div>
                          </div>

                          <div>
                            <strong className="block text-[10px] font-mono text-[#ED9E58] uppercase mb-1">Policy Context Details</strong>
                            <pre className="p-2.5 bg-[rgba(27,25,49,0.90)] border border-[rgba(233,188,185,0.20)] rounded-xl text-[11px] font-mono text-[#22c55e]">
                              {JSON.stringify(evt.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
