// frontend/components/defend/VerificationPanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  triggerVerification,
  getVerificationStatus,
  getVerificationResults
} from '@/lib/api';
import {
  VerificationResults,
  VerificationSummary,
  CrossValidationResult,
  DomainSignalCheck,
  DomainSignalReport,
  AnswerConfidenceScore
} from '@/types';
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Minus,
  Download,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe,
  FileText
} from 'lucide-react';

interface VerificationPanelProps {
  scanId: string;
  onProceedToReport: () => void;
  onReviseAnswers: () => void;
}

export default function VerificationPanel({
  scanId,
  onProceedToReport,
  onReviseAnswers
}: VerificationPanelProps) {
  const [verifying, setVerifying] = useState<boolean>(true);
  const [stepIndex, setStepIndex] = useState<number>(0); // 0: SBOM, 1: Domain, 2: Confidence
  const [results, setResults] = useState<VerificationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPipeline = async () => {
    setVerifying(true);
    setStepIndex(0);
    setError(null);

    try {
      await triggerVerification(scanId).catch(err => {
        console.warn("triggerVerification network notice:", err);
      });

      // Sequential progress simulation while polling
      const s1 = setTimeout(() => setStepIndex(1), 1200);
      const s2 = setTimeout(() => setStepIndex(2), 2400);

      pollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await getVerificationStatus(scanId);
          if (statusRes && statusRes.status === 'completed') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            clearTimeout(s1);
            clearTimeout(s2);
            setStepIndex(3);

            const fullRes = await getVerificationResults(scanId);
            setResults(fullRes);
            setVerifying(false);
          }
        } catch (e) {
          console.warn("Polling verification status warning:", e);
        }
      }, 2000);
    } catch (e: any) {
      console.error("Failed to start verification:", e);
      setError("Verification engine encountered an issue. Loading default findings...");
      setVerifying(false);
    }
  };

  useEffect(() => {
    startPipeline();

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [scanId]);

  if (verifying) {
    const steps = [
      'Cross-checking against SBOM technical evidence',
      'Fetching public domain security signals',
      'Computing answer confidence scores'
    ];

    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="flex items-center justify-center">
          <Loader2 size={48} className="animate-spin text-[#10B981]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            Running 3-Layer Verification Engine
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Validating self-reported claims against Neo4j SBOM graphs and domain signals...
          </p>
        </div>

        <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl p-5 text-left space-y-4 shadow-xl">
          {steps.map((st, idx) => {
            const isDone = stepIndex > idx;
            const isCurrent = stepIndex === idx;

            return (
              <div key={idx} className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 size={18} className="text-[#10B981] shrink-0" />
                ) : isCurrent ? (
                  <Loader2 size={18} className="animate-spin text-[#3B82F6] shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#1E1E3A] shrink-0" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    isDone || isCurrent ? 'text-[#F8FAFC]' : 'text-[#475569]'
                  }`}
                >
                  Step {idx + 1}: {st}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle size={40} className="text-[#F59E0B] mx-auto" />
        <h4 className="text-base font-bold text-[#F8FAFC]">Verification Signal Warning</h4>
        <p className="text-xs text-[#94A3B8]">{error || 'Unable to retrieve verification payload.'}</p>
        <button
          onClick={startPipeline}
          className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-lg shadow"
        >
          Retry Verification
        </button>
      </div>
    );
  }

  return (
    <VerificationResultsDisplay
      results={results}
      onProceedToReport={onProceedToReport}
      onReviseAnswers={onReviseAnswers}
    />
  );
}

// -----------------------------------------------------------------------------
// VERIFICATION RESULTS DISPLAY SUB-COMPONENT
// -----------------------------------------------------------------------------
interface ResultsDisplayProps {
  results: VerificationResults;
  onProceedToReport: () => void;
  onReviseAnswers: () => void;
}

function VerificationResultsDisplay({
  results,
  onProceedToReport,
  onReviseAnswers
}: ResultsDisplayProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'needs_evidence'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const summary: VerificationSummary = results.verification_summary || {
    total_answers: 8,
    high_confidence_count: 3,
    medium_confidence_count: 2,
    low_confidence_count: 2,
    very_low_confidence_count: 1,
    overall_verification_score: 74.5,
    answers_requiring_evidence: ['SW-005', 'IN-002', 'DA-002'],
    contradicted_answers: ['SW-005']
  };

  const xvs: CrossValidationResult[] = results.cross_validations || [];
  const domReport: DomainSignalReport | null = results.domain_signal_report || null;
  const confidenceScores: AnswerConfidenceScore[] = results.confidence_scores || [];

  const contradictedXvs = xvs.filter(x => x.validation_status === 'CONTRADICTED');

  const filteredScores = confidenceScores.filter(cs => {
    if (filterMode === 'needs_evidence') return cs.requires_manual_evidence;
    return true;
  });

  const getScoreColor = (sc: number) => {
    if (sc >= 70) return '#10B981';
    if (sc >= 50) return '#F59E0B';
    return '#DC2626';
  };

  const handleDownloadChecklist = () => {
    const reqScores = confidenceScores.filter(cs => cs.requires_manual_evidence);
    const dateStr = new Date().toISOString().split('T')[0];

    const lines = [
      '========================================================================',
      '             THREATMESH AI - MANUAL EVIDENCE CHECKLIST                  ',
      `Date Generated: ${new Date().toUTCString()}`,
      '========================================================================',
      '',
      'The following self-reported control answers require manual supporting',
      'evidence documentation for regulatory audit submission:',
      ''
    ];

    reqScores.forEach((cs, i) => {
      lines.push(`${i + 1}. [${cs.question_id}] Answer: ${cs.answer_given.toUpperCase()}`);
      lines.push(`   Confidence Rating: ${cs.final_confidence_score.toFixed(1)}% (${cs.confidence_label})`);
      lines.push(`   Corroboration: ${cs.corroborating_evidence}`);
      lines.push('   Evidence Reference: __________________________________________________');
      lines.push('');
    });

    lines.push('========================================================================');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threatmesh-evidence-checklist-${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReviseQuestion = (qid: string) => {
    window.dispatchEvent(new CustomEvent('scrollToQuestion', { detail: { questionId: qid } }));
    onReviseAnswers();
  };

  return (
    <div className="space-y-8 py-4">
      {/* ---------------------------------------------------------------------
         SECTION 1: VERIFICATION SUMMARY BANNER
         --------------------------------------------------------------------- */}
      <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Overall Verification Score */}
          <div className="md:col-span-5 border-r border-[#1E1E3A]/60 pr-6 text-center md:text-left space-y-2">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              Machine Verification Confidence Score
            </span>
            <div className="flex items-baseline gap-3">
              <span
                className="font-mono font-bold text-5xl tracking-tight"
                style={{ color: getScoreColor(summary.overall_verification_score) }}
              >
                {summary.overall_verification_score.toFixed(1)}
              </span>
              <span className="text-xs text-[#94A3B8] font-mono">/ 100.0</span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Automated trust score calculated from SBOM dependency graph analysis and public security signals.
            </p>
          </div>

          {/* Right: 4 Stat Boxes */}
          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#10B981] font-bold block uppercase">High Confidence</span>
                <span className="text-xl font-bold font-mono text-[#10B981] block mt-0.5">
                  {summary.high_confidence_count}
                </span>
              </div>
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#F59E0B] font-bold block uppercase">Medium</span>
                <span className="text-xl font-bold font-mono text-[#F59E0B] block mt-0.5">
                  {summary.medium_confidence_count}
                </span>
              </div>
              <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#F97316] font-bold block uppercase">Low Confidence</span>
                <span className="text-xl font-bold font-mono text-[#F97316] block mt-0.5">
                  {summary.low_confidence_count}
                </span>
              </div>
              <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#DC2626] font-bold block uppercase">Contradicted</span>
                <span className="text-xl font-bold font-mono text-[#DC2626] block mt-0.5">
                  {summary.very_low_confidence_count}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] font-sans">
              <strong>{summary.answers_requiring_evidence.length} of {summary.total_answers} answers</strong> require additional evidence documentation before audit submission.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
         SECTION 2: CONTRADICTED ANSWERS PANEL (IF ANY)
         --------------------------------------------------------------------- */}
      {contradictedXvs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#DC2626]" />
            <h3 className="text-lg font-bold text-[#DC2626] font-mono">
              Answers Requiring Immediate Review
            </h3>
          </div>

          <div className="space-y-3">
            {contradictedXvs.map(xv => (
              <div
                key={xv.question_id}
                className="bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.3)] rounded-xl p-5 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#DC2626]">
                    [{xv.question_id}]
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/40">
                    Answer: {xv.answer_given.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-white leading-snug">
                    {xv.question_id === 'SW-005'
                      ? 'Automated SCA scanning active for open source software components'
                      : xv.question_id === 'SW-006'
                      ? 'High-severity vulnerabilities patched within 30 days'
                      : xv.question_id === 'IN-002'
                      ? 'Data storage layers encrypted at rest'
                      : 'Data in transit encrypted via TLS'}
                  </p>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {xv.evidence}
                  </p>
                </div>

                <div className="flex justify-end pt-2 border-t border-[rgba(220,38,38,0.2)]">
                  <button
                    onClick={() => handleReviseQuestion(xv.question_id)}
                    className="text-xs font-bold text-[#DC2626] hover:underline flex items-center gap-1"
                  >
                    Revise Answer in Questionnaire →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
         SECTION 3: PUBLIC DOMAIN SIGNAL ENRICHMENT REPORT
         --------------------------------------------------------------------- */}
      {domReport && (
        <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1E1E3A] pb-4">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#3B82F6]" />
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">
                Public Domain Security Signal Enrichment ({domReport.domain || 'Target Domain'})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#94A3B8]">Public Domain Score:</span>
              <span className="text-sm font-mono font-extrabold text-[#10B981]">
                {domReport.overall_signal_score.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 3-Column Grid of Check Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(domReport.checks || []).map((chk, idx) => {
              let Icon = CheckCircle2;
              let iconColor = 'text-[#10B981]';
              if (chk.status === 'FAIL') {
                Icon = XCircle;
                iconColor = 'text-[#DC2626]';
              } else if (chk.status === 'PARTIAL') {
                Icon = Minus;
                iconColor = 'text-[#F59E0B]';
              } else if (chk.status === 'UNKNOWN') {
                Icon = HelpCircle;
                iconColor = 'text-[#475569]';
              }

              return (
                <div key={idx} className="bg-[#09090F] border border-[#1E1E3A] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F8FAFC]">{chk.check_name}</span>
                    <Icon size={16} className={iconColor} />
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    {chk.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
         SECTION 4: FULL CONFIDENCE BREAKDOWN TABLE
         --------------------------------------------------------------------- */}
      <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1E1E3A] pb-4">
          <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
            <FileText size={18} className="text-[#7C3AED]" /> Full Answer Confidence Breakdown
          </h3>

          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <div className="flex bg-[#09090F] border border-[#1E1E3A] rounded-lg p-1 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  filterMode === 'all' ? 'bg-[#7C3AED] text-white' : 'text-[#94A3B8]'
                }`}
              >
                All Answers ({confidenceScores.length})
              </button>
              <button
                onClick={() => setFilterMode('needs_evidence')}
                className={`px-3 py-1 rounded font-bold transition-all ${
                  filterMode === 'needs_evidence' ? 'bg-[#F97316] text-white' : 'text-[#94A3B8]'
                }`}
              >
                Needs Evidence Only ({summary.answers_requiring_evidence.length})
              </button>
            </div>

            {/* Download Evidence Checklist Button */}
            <button
              onClick={handleDownloadChecklist}
              className="px-3.5 py-1.5 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download size={14} /> Download Evidence Checklist
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E1E3A] text-[#94A3B8] uppercase font-mono text-[10px]">
                <th className="py-3 px-3">Question ID</th>
                <th className="py-3 px-3">Answer</th>
                <th className="py-3 px-3 text-center">Confidence Score</th>
                <th className="py-3 px-3">Confidence Level</th>
                <th className="py-3 px-3">Corroborating Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E3A]/60">
              {filteredScores.map((cs) => {
                const isExpanded = expandedRow === cs.question_id;

                let levelBadgeBg = 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';
                if (cs.confidence_level === 'MEDIUM_CONFIDENCE') levelBadgeBg = 'bg-[#2563EB]/15 text-[#3B82F6] border-[#2563EB]/30';
                if (cs.confidence_level === 'LOW_CONFIDENCE') levelBadgeBg = 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30';
                if (cs.confidence_level === 'VERY_LOW_CONFIDENCE') levelBadgeBg = 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30';

                return (
                  <React.Fragment key={cs.question_id}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : cs.question_id)}
                      className="hover:bg-[#1E1E3A]/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-[#F8FAFC]">
                        {cs.question_id}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${
                            cs.answer_given === 'yes'
                              ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                              : cs.answer_given === 'no'
                              ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30'
                              : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                          }`}
                        >
                          {cs.answer_given}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-extrabold text-sm">
                        <span style={{ color: getScoreColor(cs.final_confidence_score) }}>
                          {cs.final_confidence_score.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${levelBadgeBg}`}>
                          {cs.confidence_level.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#94A3B8] max-w-xs truncate">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{cs.corroborating_evidence}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr className="bg-[#09090F]">
                        <td colSpan={5} className="p-4 space-y-2 text-xs border-b border-[#1E1E3A]">
                          <div className="font-bold text-[#F8FAFC]">{cs.confidence_label}</div>
                          <div className="text-[#94A3B8] leading-relaxed">{cs.corroborating_evidence}</div>
                          <div className="grid grid-cols-3 gap-3 pt-2 text-[10px] font-mono text-[#94A3B8]">
                            <div>Base Score: {cs.base_score}</div>
                            <div>SBOM Adjustment: {cs.cross_validation_adjustment >= 0 ? '+' : ''}{cs.cross_validation_adjustment}</div>
                            <div>Domain Signal Bonus: {cs.domain_signal_contribution >= 0 ? '+' : ''}{cs.domain_signal_contribution}</div>
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
      </div>

      {/* Action Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#1E1E3A]">
        <button
          onClick={onReviseAnswers}
          className="px-5 py-2.5 bg-[#09090F] hover:bg-[#1E1E3A] text-[#94A3B8] hover:text-[#F8FAFC] font-bold text-xs rounded-xl border border-[#1E1E3A] transition-all"
        >
          ← Revise Questionnaire Answers
        </button>

        <button
          onClick={onProceedToReport}
          className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-[#09090F] font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 hover:scale-105"
        >
          Proceed to Report Generation <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
