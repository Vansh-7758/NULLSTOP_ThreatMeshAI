// frontend/components/defend/RedTeamSection.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  startRedTeamServiceRun,
  getRedTeamServiceStatus,
  getLatestRedTeamServiceReport,
  getRedTeamServiceHistory,
  getCompanyProfile
} from '@/lib/api';
import {
  RedTeamServiceReport,
  RedTeamTestResultDetail,
  RedTeamRunHistoryItem
} from '@/types';
import AIProductConfigModal from './AIProductConfigModal';
import RedTeamHistoryChart from './RedTeamHistoryChart';
import { Flame, Play, Loader2, ShieldCheck, AlertTriangle, Info, Server, Settings, ChevronDown, ChevronUp, CheckCircle2, XCircle, Award, Lock, FileCheck, Terminal, X } from 'lucide-react';

interface RedTeamSectionProps {
  scanId: string;
}

export default function RedTeamSection({ scanId }: RedTeamSectionProps) {
  const [report, setReport] = useState<RedTeamServiceReport | null>(null);
  const [history, setHistory] = useState<RedTeamRunHistoryItem[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(32);
  const [selectedResult, setSelectedResult] = useState<RedTeamTestResultDetail | null>(null);
  const [expandedVector, setExpandedVector] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    try {
      const prof = await getCompanyProfile(scanId).catch(() => null);
      if (prof) setProfile(prof);

      const rep = await getLatestRedTeamServiceReport(scanId).catch(() => null);
      if (rep) setReport(rep);

      const histRes = await getRedTeamServiceHistory(scanId).catch(() => null);
      if (histRes && histRes.history) setHistory(histRes.history);

      const statusRes = await getRedTeamServiceStatus(scanId).catch(() => null);
      if (statusRes && statusRes.status === 'running') {
        setIsTesting(true);
        setCompletedCount(statusRes.completed_tests || 0);
        setTotalCount(statusRes.total_tests || 32);
        startPolling();
      }
    } catch (e) {
      console.error("Error loading red team data:", e);
    }
  };

  useEffect(() => {
    loadData();

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [scanId]);

  const startPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const st = await getRedTeamServiceStatus(scanId);
        if (st) {
          setCompletedCount(st.completed_tests || 0);
          setTotalCount(st.total_tests || 32);

          if (st.status === 'completed' || st.status === 'failed') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setIsTesting(false);
            const rep = await getLatestRedTeamServiceReport(scanId);
            if (rep) setReport(rep);
            const hist = await getRedTeamServiceHistory(scanId);
            if (hist && hist.history) setHistory(hist.history);
          }
        }
      } catch (e) {
        console.warn("Polling red team status error:", e);
      }
    }, 1500);
  };

  const handleStartRedTeam = async () => {
    setIsTesting(true);
    setCompletedCount(0);
    try {
      await startRedTeamServiceRun(scanId);
      startPolling();
    } catch (e: any) {
      console.error("Failed to start red team run:", e);
      setIsTesting(false);
      alert(e.message || "Failed to trigger AI Red Team run. Ensure consent is verified.");
    }
  };

  const isExternalConfigured = Boolean(profile?.ai_product_endpoint && profile?.testing_consent);
  const overallSafetyScore = report?.overall_safety_score ?? 100.0;
  const vectorScores = report?.vector_scores ?? {};
  const vectorDetails = report?.vector_details ?? {};
  const complianceMappings = report?.compliance_mappings ?? {};

  const VECTOR_TITLES: Record<string, string> = {
    prompt_injection: "Prompt Injection Resistance",
    jailbreak: "Jailbreak Resistance",
    hallucination: "Hallucination Susceptibility",
    data_leakage: "System Prompt & Data Leakage",
    system_prompt_override: "System Prompt Immutability",
    agent_hijacking: "Agent & Pipeline Hijacking",
    toxicity_and_bias: "Toxicity & Disguised Harm",
    rag_poisoning: "RAG Context Poisoning"
  };

  return (
    <div className="space-y-6">
      {/* Target Endpoint & Mode Control Banner */}
      <div className="glass-card p-6 space-y-4 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #ef4444, #ED9E58, transparent)' }} />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Circular Resilience Score Meter */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[rgba(255,255,255,0.06)]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={overallSafetyScore >= 80 ? 'text-[#22c55e]' : overallSafetyScore >= 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}
                  strokeDasharray={`${overallSafetyScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-extrabold text-white block leading-none font-mono">{overallSafetyScore.toFixed(0)}%</span>
                <span className="text-[9px] uppercase font-bold text-[#A34054] block mt-0.5 font-['Plus_Jakarta_Sans']">Resilience</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                <Flame size={18} className="text-[#ef4444]" /> AUTONOMOUS AI RED TEAM AS A SERVICE
              </h3>
              <p className="text-xs text-[#A34054] mt-1 max-w-xl leading-relaxed">
                Actively probe live AI endpoints across 8 adversarial attack vectors mapped directly to EU AI Act Article 15 robustness requirements and ISO 42001 clauses.
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#A34054] uppercase font-mono">Target Mode:</span>
                {isExternalConfigured ? (
                  <span className="text-[10px] font-mono font-bold text-[#22c55e] px-2.5 py-0.5 bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.30)] rounded-full flex items-center gap-1">
                    <Server size={11} /> External Endpoint: {profile?.ai_product_endpoint}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-[#ED9E58] px-2.5 py-0.5 bg-[rgba(237,158,88,0.12)] border border-[rgba(237,158,88,0.30)] rounded-full">
                    Internal Demo Mode (ThreatMesh AI Council)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="btn-ghost-brand text-xs !py-3 !px-4 gap-2"
            >
              <Settings size={15} />
              {isExternalConfigured ? 'Edit Settings' : 'Configure Endpoint'}
            </button>

            <button
              onClick={handleStartRedTeam}
              disabled={isTesting}
              className="btn-primary-brand text-xs !py-3 !px-6 gap-2 disabled:opacity-50"
            >
              {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
              {isTesting ? 'Executing 32 Probes...' : 'Run Red Team Attack'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isTesting && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#22c55e] font-bold flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Executing Adversarial Probes Against Target...
            </span>
            <span className="text-[#A34054]">{completedCount} of {totalCount} Tests Complete</span>
          </div>
          <div className="w-full bg-[rgba(27,25,49,0.90)] h-2 rounded-full overflow-hidden border border-[rgba(163,64,84,0.20)]">
            <div
              className="bg-[#22c55e] h-full transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* MANDATORY SAFETY BANNER */}
      <div className="p-3.5 bg-[rgba(11,13,27,0.70)] border border-[rgba(163,64,84,0.15)] rounded-xl flex items-center gap-3 text-xs text-[#A34054]">
        <Lock size={16} className="text-[#22c55e] shrink-0" />
        <span>
          <strong>ThreatMesh AI Safety Protocol:</strong> Adversarial test prompts are transmitted exclusively to endpoints explicitly authorized by your team. No data is extracted beyond model responses, no authentication is bypassed, and no destructive testing is performed.
        </span>
      </div>

      {/* REGULATORY COMPLIANCE BADGE STRIP */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-[#9A5FFD]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans']">
            Regulatory Standard Attestation Mappings:
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
          <span className="px-2.5 py-1 bg-[rgba(154,95,253,0.15)] text-[#9A5FFD] border border-[rgba(154,95,253,0.30)] rounded-full font-bold">
            EU AI Act Article 15(1) Robustness
          </span>
          <span className="px-2.5 py-1 bg-[rgba(237,158,88,0.15)] text-[#ED9E58] border border-[rgba(237,158,88,0.30)] rounded-full font-bold">
            EU AI Act Article 15(4) Input Integrity
          </span>
          <span className="px-2.5 py-1 bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.30)] rounded-full font-bold">
            ISO/IEC 42001 Clause 8.3 Operation
          </span>
        </div>
      </div>

      {/* 8 ATTACK VECTOR CARDS GRID */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-['Plus_Jakarta_Sans']">
          <ShieldCheck size={16} className="text-[#22c55e]" /> 8 Adversarial Attack Vector Findings
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {Object.entries(VECTOR_TITLES).map(([v_id, title]) => {
            const score = vectorScores[v_id] ?? 100.0;
            const detailsList: RedTeamTestResultDetail[] = vectorDetails[v_id] || [];
            const mapping = complianceMappings[v_id] || {
              eu_ai_act_article: "Article 15(4)",
              iso_42001_clause: "Clause 8.3"
            };

            const isPass = score >= 80;
            const isWarn = score >= 50 && score < 80;
            const isExpanded = expandedVector === v_id;

            return (
              <div key={v_id} className="glass-card rounded-2xl overflow-hidden">
                <div
                  onClick={() => setExpandedVector(isExpanded ? null : v_id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[rgba(237,158,88,0.04)] transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    {isPass ? (
                      <CheckCircle2 size={20} className="text-[#22c55e]" />
                    ) : isWarn ? (
                      <AlertTriangle size={20} className="text-[#f59e0b]" />
                    ) : (
                      <XCircle size={20} className="text-[#ef4444]" />
                    )}
                    <div>
                      <h5 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                        {title}
                      </h5>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-[#A34054]">
                        <span className="text-[#22c55e] font-bold">{mapping.eu_ai_act_article}</span>
                        <span>•</span>
                        <span>{mapping.iso_42001_clause}</span>
                        <span>•</span>
                        <span>{detailsList.length} Probes Executed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-sm font-extrabold font-mono px-3 py-1 rounded-full border ${
                        isPass
                          ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e] border-[rgba(34,197,94,0.30)]'
                          : isWarn
                          ? 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border-[rgba(245,158,11,0.30)]'
                          : 'bg-[rgba(239,68,68,0.15)] text-[#ef4444] border-[rgba(239,68,68,0.30)]'
                      }`}
                    >
                      {score.toFixed(0)}% Score
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-[#A34054]" /> : <ChevronDown size={16} className="text-[#A34054]" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 bg-[rgba(11,13,27,0.80)] border-t border-[rgba(163,64,84,0.15)] space-y-3">
                    <div className="space-y-3">
                      {detailsList.map((dt, idx) => (
                        <div
                          key={dt.id || idx}
                          onClick={() => setSelectedResult(dt)}
                          className="p-4 bg-[rgba(27,25,49,0.75)] border border-[rgba(163,64,84,0.20)] rounded-xl cursor-pointer hover:border-[#ED9E58] transition-all space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Terminal size={14} className="text-[#ED9E58]" /> Probe #{idx + 1}
                            </span>
                            <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                              dt.verdict === 'pass' 
                                ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.30)]' 
                                : 'bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.30)]'
                            }`}>
                              [{dt.verdict.toUpperCase()}] • {dt.score}%
                            </span>
                          </div>

                          <div className="space-y-2 font-mono text-xs">
                            <div className="bg-[rgba(11,13,27,0.85)] p-3 rounded-lg border border-[rgba(163,64,84,0.15)]">
                              <span className="text-[#A34054] font-bold block mb-1">Adversarial Input Prompt:</span>
                              <p className="text-[#E9BCB9] whitespace-pre-wrap">{dt.prompt}</p>
                            </div>

                            <div className="bg-[rgba(11,13,27,0.85)] p-3 rounded-lg border border-[rgba(34,197,94,0.25)]">
                              <span className="text-[#22c55e] font-bold block mb-1">Actual Target Raw Endpoint Response:</span>
                              <pre className="text-[#22c55e] whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-40 overflow-y-auto">
                                {dt.response || "[No response returned]"}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <RedTeamHistoryChart history={history} />

      <AIProductConfigModal
        scanId={scanId}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigSaved={loadData}
      />

      {/* Probe Detail Inspector Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                <Terminal size={18} className="text-[#ED9E58]" /> Full Probe Response Inspector
              </h3>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-1.5 text-[#8B949E] hover:text-white hover:bg-[#30363D] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 font-mono text-xs">
              <div>
                <span className="text-xs font-bold text-[#A34054] block mb-1">Adversarial Input Prompt</span>
                <div className="p-3 bg-[#0D1117] border border-[#30363D] rounded-xl text-[#E6EDF3] whitespace-pre-wrap">
                  {selectedResult.prompt}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#22c55e] block mb-1">Actual Target Raw Endpoint Response</span>
                <div className="p-3.5 bg-[#0D1117] border border-[#22c55e]/40 rounded-xl text-[#22c55e] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedResult.response || "[No response returned]"}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#9A5FFD] block mb-1">AI Safety Evaluator Assessment</span>
                <div className="p-3.5 bg-[#0D1117] border border-[#9A5FFD]/40 rounded-xl text-[#E6EDF3] space-y-1">
                  <p><strong>Verdict:</strong> <span className={selectedResult.verdict === 'pass' ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{selectedResult.verdict.toUpperCase()} ({selectedResult.score}%)</span></p>
                  <p><strong>Reasoning:</strong> {selectedResult.reasoning}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#30363D]">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-5 py-2.5 bg-[#30363D] hover:bg-[#8B949E]/20 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
