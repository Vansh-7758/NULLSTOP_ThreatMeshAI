// frontend/components/defend/GapRegisterTable.tsx
'use client';

import React, { useState } from 'react';
import { ComplianceGap, RemediationItem } from '@/types';
import { ShieldAlert, ArrowUpDown, ChevronDown, ChevronUp, Clock, User, Award } from 'lucide-react';

interface GapRegisterTableProps {
  gaps: ComplianceGap[];
  roadmap?: RemediationItem[];
}

export default function GapRegisterTable({ gaps, roadmap = [] }: GapRegisterTableProps) {
  const [sortField, setSortField] = useState<string>('priority');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [showFullRoadmap, setShowFullRoadmap] = useState<boolean>(false);

  // Combine gaps with roadmap info
  const tableData = gaps.map((gap, index) => {
    const matchedRoadmap = roadmap.find(r => r.action.includes(gap.question_id) || r.priority === index + 1);
    return {
      ...gap,
      priority: matchedRoadmap?.priority || index + 1,
      timeline: matchedRoadmap?.timeline || (gap.risk_if_no === 'Critical' ? 'within 7 days' : 'within 30 days'),
      effort: matchedRoadmap?.effort || (gap.risk_if_no === 'Critical' ? 'High' : 'Medium'),
      owner: matchedRoadmap?.owner || 'Security'
    };
  });

  // Sorting logic
  const sortedData = [...tableData].sort((a, b) => {
    let aVal: any = a[sortField as keyof typeof a];
    let bVal: any = b[sortField as keyof typeof b];

    if (sortField === 'frameworks') {
      aVal = a.frameworks?.length || 0;
      bVal = b.frameworks?.length || 0;
    }

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getEffortBadgeClass = (effort: string) => {
    switch (effort.toLowerCase()) {
      case 'low': return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
      case 'medium': return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'high': return 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30';
      default: return 'bg-[#475569]/15 text-[#94A3B8] border-[#475569]/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1E1E3A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#DC2626]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Critical Gaps Register & Audit Findings
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8]">
            {gaps.length} Total Findings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#09090F] border-b border-[#1E1E3A] text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                <th onClick={() => handleSort('priority')} className="py-3 px-4 cursor-pointer hover:text-[#F8FAFC]">
                  <div className="flex items-center gap-1">Priority <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-3 px-4">Gap Finding</th>
                <th onClick={() => handleSort('domain')} className="py-3 px-4 cursor-pointer hover:text-[#F8FAFC]">
                  <div className="flex items-center gap-1">Domain <ArrowUpDown size={11} /></div>
                </th>
                <th onClick={() => handleSort('frameworks')} className="py-3 px-4 cursor-pointer hover:text-[#F8FAFC]">
                  <div className="flex items-center gap-1">Frameworks <ArrowUpDown size={11} /></div>
                </th>
                <th onClick={() => handleSort('risk_if_no')} className="py-3 px-4 cursor-pointer hover:text-[#F8FAFC]">
                  <div className="flex items-center gap-1">Risk Rating <ArrowUpDown size={11} /></div>
                </th>
                <th className="py-3 px-4">AI Target Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E3A] text-xs">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#94A3B8]">
                    No critical compliance gaps detected.
                  </td>
                </tr>
              ) : (
                sortedData.map((row, idx) => (
                  <tr
                    key={row.question_id + idx}
                    className={`hover:bg-[#1E1E3A]/30 transition-colors ${
                      row.risk_if_no === 'Critical' ? 'border-l-4 border-l-[#DC2626]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#7C3AED]">
                      #{row.priority}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-lg">
                        <span className="font-mono text-[10px] text-[#475569] block">
                          [{row.question_id}]
                        </span>
                        <p className="text-xs font-medium text-[#F8FAFC] line-clamp-2">
                          {row.question_text}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] text-[#94A3B8] font-mono">
                      {row.domain}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#2563EB]/15 text-[#3B82F6] border border-[#2563EB]/30 rounded text-[10px] font-mono font-bold">
                        {row.frameworks?.length || 0} Frameworks
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          row.risk_if_no === 'Critical'
                            ? 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                        }`}
                      >
                        {row.risk_if_no}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8] text-[11px]">
                      <span className="flex items-center gap-1 text-[#F8FAFC] font-medium">
                        <Clock size={12} className="text-[#06B6D4]" /> {row.timeline}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Toggle Full Roadmap Button */}
        {roadmap.length > 0 && (
          <div className="p-3 bg-[#09090F] border-t border-[#1E1E3A] flex justify-center">
            <button
              onClick={() => setShowFullRoadmap(!showFullRoadmap)}
              className="px-4 py-2 bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 text-[#A855F7] border border-[#7C3AED]/40 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
            >
              {showFullRoadmap ? (
                <>Hide Full AI Remediation Roadmap <ChevronUp size={14} /></>
              ) : (
                <>View Full AI Remediation Roadmap ({roadmap.length} Actions) <ChevronDown size={14} /></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Full Roadmap Cards Grid */}
      {showFullRoadmap && roadmap.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Award size={16} className="text-[#7C3AED]" /> Prioritized AI Remediation Execution Roadmap
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roadmap.map((item) => (
              <div
                key={item.priority}
                className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#7C3AED] text-[#F8FAFC] text-xs font-bold flex items-center justify-center font-mono">
                      #{item.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getEffortBadgeClass(item.effort)}`}>
                      {item.effort} Effort
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#06B6D4] flex items-center gap-1">
                    <Clock size={11} /> {item.timeline}
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#F8FAFC] leading-relaxed">
                  {item.action}
                </p>

                <div className="border-t border-[#1E1E3A] pt-2 flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1 text-[#F8FAFC]">
                    <User size={12} className="text-[#7C3AED]" /> Owner: {item.owner}
                  </span>
                  <span className="text-[10px] italic text-[#94A3B8]">
                    {item.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
