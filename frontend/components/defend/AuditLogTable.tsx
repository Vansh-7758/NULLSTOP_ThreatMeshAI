// frontend/components/defend/AuditLogTable.tsx
'use client';

import React, { useState } from 'react';
import { GovernanceEvent } from '@/types';
import { ChevronDown, ChevronUp, ShieldAlert, ShieldCheck, Clock, FileCode } from 'lucide-react';

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
      case 'CRITICAL': return <span className="text-[#E84040] bg-[#E84040]/10 border border-[#E84040]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">CRITICAL</span>;
      case 'HIGH': return <span className="text-[#F0A500] bg-[#F0A500]/10 border border-[#F0A500]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">HIGH</span>;
      case 'MEDIUM': return <span className="text-[#F0A500]/70 bg-[#F0A500]/10 border border-[#F0A500]/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">MEDIUM</span>;
      case 'LOW': return <span className="text-[#00C896]/70 bg-[#00C896]/10 border border-[#00C896]/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">LOW</span>;
      default: return <span className="text-[#00C896] bg-[#00C896]/10 border border-[#00C896]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">SAFE</span>;
    }
  };

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3] flex items-center gap-2">
          <Clock size={14} className="text-[#00C896]" /> Governance Audit Log Stream
        </h4>
        <span className="text-[10px] font-mono text-[#8B949E]">
          Showing {paginatedEvents.length} of {events.length} Events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-xs text-[#8B949E]">
          No governance events recorded yet. Run AI agents in HUNT or test policies above.
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#30363D] text-[#8B949E] uppercase text-[9px] font-mono">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Risk Level</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Policy Triggered</th>
                <th className="py-2 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]/40">
              {paginatedEvents.map((evt) => {
                const isExpanded = expandedId === evt.id;
                const isBlocked = evt.policy_result === 'BLOCKED';

                return (
                  <React.Fragment key={evt.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                      className="hover:bg-[#0D1117]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[10px] text-[#8B949E] whitespace-nowrap">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-[#E6EDF3]">
                        {evt.event_type}
                      </td>
                      <td className="py-2.5 px-3">{getRiskBadge(evt.risk_level)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono text-[10px] font-bold ${isBlocked ? 'text-[#E84040]' : 'text-[#00C896]'}`}>
                          {evt.policy_result}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#E6EDF3]">
                        {(evt.details as { policy?: string })?.policy || (isBlocked ? 'GOV-P Check' : 'None')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8B949E]">
                        {isExpanded ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#0D1117] border-b border-[#30363D]">
                        <td colSpan={6} className="p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <strong className="block text-[10px] font-mono text-[#8B949E] uppercase mb-1">Prompt Stream</strong>
                              <pre className="p-2 bg-[#161B22] border border-[#30363D] rounded text-[11px] font-mono text-[#E6EDF3] whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar">
                                {evt.prompt || 'No prompt payload stored'}
                              </pre>
                            </div>
                            <div>
                              <strong className="block text-[10px] font-mono text-[#8B949E] uppercase mb-1">Response Stream</strong>
                              <pre className="p-2 bg-[#161B22] border border-[#30363D] rounded text-[11px] font-mono text-[#E6EDF3] whitespace-pre-wrap max-h-24 overflow-y-auto custom-scrollbar">
                                {evt.response || 'No response payload stored'}
                              </pre>
                            </div>
                          </div>

                          <div>
                            <strong className="block text-[10px] font-mono text-[#8B949E] uppercase mb-1">Policy Context Details</strong>
                            <pre className="p-2 bg-[#161B22] border border-[#30363D] rounded text-[11px] font-mono text-[#00C896]">
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
