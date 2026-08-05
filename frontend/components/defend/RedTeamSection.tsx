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
  RedTeamRunHistoryItem,
  AIProductConfig
} from '@/types';
import AIProductConfigModal from './AIProductConfigModal';
import RedTeamHistoryChart from './RedTeamHistoryChart';
import {
  Flame,
  Play,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Server,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Award,
  Lock,
  FileCheck
} from 'lucide-react';

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
    }, 1500); // 1.5 second polling interval
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
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Circular Resilience Score Meter */}
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#30363D]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={overallSafetyScore >= 80 ? 'text-[#00C896]' : overallSafetyScore >= 50 ? 'text-[#F0A500]' : 'text-[#E84040]'}
                  strokeDasharray={`${overallSafetyScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-black text-[#E6EDF3] block leading-none">{overallSafetyScore.toFixed(0)}%</span>
                <span className="text-[9px] uppercase font-bold text-[#8B949E] block mt-0.5">Resilience</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-[#E6EDF3] flex items-center gap-2">
                <Flame size={18} className="text-[#E84040]" /> Autonomous AI Red Team as a Service
              </h3>
              <p className="text-xs text-[#8B949E] mt-1 max-w-xl leading-relaxed">
                Actively probe live AI endpoints across 8 adversarial attack vectors mapped directly to EU AI Act Article 15 robustness requirements and ISO 42001 clauses.
              </p>

              {/* Target Status Indicator */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#8B949E] uppercase font-mono">Target Mode:</span>
                {isExternalConfigured ? (
                  <span className="text-[10px] font-mono font-bold text-[#00C896] px-2 py-0.5 bg-[#00C896]/10 border border-[#00C896]/30 rounded flex items-center gap-1">
                    <Server size={11} /> External Endpoint: {profile?.ai_product_endpoint}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-[#F0A500] px-2 py-0.5 bg-[#F0A500]/10 border border-[#F0A500]/30 rounded">
                    Internal Demo Mode (ThreatMesh AI Council)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-3 bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-[#30363D]"
            >
              <Settings size={15} />
              {isExternalConfigured ? 'Edit AI Endpoint Settings' : 'Configure AI Endpoint'}
            </button>

            <button
              onClick={handleStartRedTeam}
              disabled={isTesting}
              className="px-6 py-3 bg-[#E84040] hover:bg-[#c93232] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105"
            >
              {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="white" />}
              {isTesting ? 'Executing 32 Adversarial Probes...' : isExternalConfigured ? 'Run Red Team on Your Product' : 'Run Red Team (Internal Demo)'}
            </button>
          </div>
        </div>

        {/* Demo Mode Notice Banner (If external endpoint not configured) */}
        {!isExternalConfigured && (
          <div className="p-3 bg-[#F0A500]/10 border border-[#F0A500]/30 rounded-lg flex items-center justify-between text-xs text-[#F0A500]">
            <div className="flex items-center gap-2">
              <Info size={15} className="shrink-0" />
              <span>
                <strong>Demo Mode Active:</strong> Currently testing ThreatMesh's internal AI agents. Add your company's AI product endpoint in settings to test your own live product.
              </span>
            </div>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="font-bold underline text-xs shrink-0 hover:text-white"
            >
              Add Endpoint →
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar while testing */}
      {isTesting && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#00C896] font-bold flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Executing Adversarial Probes Against Target...
            </span>
            <span className="text-[#8B949E]">{completedCount} of {totalCount} Tests Complete</span>
          </div>
          <div className="w-full bg-[#0D1117] h-2 rounded-full overflow-hidden border border-[#30363D]">
            <div
              className="bg-[#00C896] h-full transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* FIXED MANDATORY SAFETY BANNER */}
      <div className="p-3 bg-[#0D1117] border border-[#30363D] rounded-xl flex items-center gap-3 text-xs text-[#8B949E] shadow-sm">
        <Lock size={16} className="text-[#00C896] shrink-0" />
        <span>
          <strong>ThreatMesh AI Safety Protocol:</strong> Adversarial test prompts are transmitted exclusively to endpoints explicitly authorized by your team. No data is extracted beyond model responses, no authentication is bypassed, and no destructive testing is performed.
        </span>
      </div>

      {/* REGULATORY COMPLIANCE BADGE STRIP */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-[#7C3AED]" />
          <span className="text-xs font-bold text-[#E6EDF3] uppercase tracking-wider">
            Regulatory Standard Attestation Mappings:
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
          <span className="px-2.5 py-1 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded font-bold">
            EU AI Act Article 15(1) Robustness
          </span>
          <span className="px-2.5 py-1 bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 rounded font-bold">
            EU AI Act Article 15(4) Input Integrity
          </span>
          <span className="px-2.5 py-1 bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30 rounded font-bold">
            ISO/IEC 42001 Clause 8.3 Operation
          </span>
          <span className="px-2.5 py-1 bg-[#F0A500]/15 text-[#F0A500] border border-[#F0A500]/30 rounded font-bold">
            ISO/IEC 42001 Clause 8.4 Safety
          </span>
        </div>
      </div>

      {/* 8 ATTACK VECTOR CARDS GRID */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-[#E6EDF3] uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#00C896]" /> 8 Adversarial Attack Vector Findings
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
              <div key={v_id} className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-sm">
                <div
                  onClick={() => setExpandedVector(isExpanded ? null : v_id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#21262D] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isPass ? (
                      <CheckCircle2 size={20} className="text-[#00C896]" />
                    ) : isWarn ? (
                      <AlertTriangle size={20} className="text-[#F0A500]" />
                    ) : (
                      <XCircle size={20} className="text-[#E84040]" />
                    )}
                    <div>
                      <h5 className="text-sm font-bold text-[#E6EDF3] flex items-center gap-2">
                        {title}
                      </h5>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-[#8B949E]">
                        <span className="text-[#00C896] font-bold">{mapping.eu_ai_act_article}</span>
                        <span>•</span>
                        <span>{mapping.iso_42001_clause}</span>
                        <span>•</span>
                        <span>{detailsList.length} Probes Executed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-sm font-extrabold font-mono px-3 py-1 rounded border ${
                        isPass
                          ? 'bg-[#00C896]/15 text-[#00C896] border-[#00C896]/30'
                          : isWarn
                          ? 'bg-[#F0A500]/15 text-[#F0A500] border-[#F0A500]/30'
                          : 'bg-[#E84040]/15 text-[#E84040] border-[#E84040]/30'
                      }`}
                    >
                      {score.toFixed(0)}% Score
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-[#8B949E]" /> : <ChevronDown size={16} className="text-[#8B949E]" />}
                  </div>
                </div>

                {/* Expanded Probes Evidence Panel */}
                {isExpanded && (
                  <div className="p-4 bg-[#0D1117] border-t border-[#30363D] space-y-3">
                    <p className="text-xs text-[#8B949E] leading-relaxed">
                      <strong>EU AI Act Alignment:</strong> {mapping.eu_ai_act_description}
                    </p>

                    <div className="space-y-2">
                      {detailsList.map((dt, idx) => (
                        <div
                          key={dt.id || idx}
                          onClick={() => setSelectedResult(dt)}
                          className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg cursor-pointer hover:border-[#7C3AED]/50 transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-[#E6EDF3]">Probe #{idx + 1}</span>
                            <span className={`font-extrabold uppercase ${dt.verdict === 'pass' ? 'text-[#00C896]' : 'text-[#E84040]'}`}>
                              [{dt.verdict}] - {dt.score}%
                            </span>
                          </div>

                          <p className="text-xs text-[#8B949E] truncate">
                            <strong>Prompt:</strong> "{dt.prompt}"
                          </p>
                          <p className="text-xs text-[#8B949E] truncate">
                            <strong>Target Response:</strong> "{dt.response}"
                          </p>

                          <div className="text-[11px] text-[#00C896] font-mono pt-1 flex items-center justify-between">
                            <span>LLM Judge Reasoning: {dt.reasoning}</span>
                            <span className="text-[#7C3AED] hover:underline flex items-center gap-1">
                              Inspect Evidence →
                            </span>
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

      {/* HISTORICAL SAFETY TREND CHART */}
      <RedTeamHistoryChart history={history} />

      {/* MODAL: CONFIG SETTINGS */}
      <AIProductConfigModal
        scanId={scanId}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigSaved={loadData}
      />

      {/* MODAL: PROBE EVIDENCE INSPECTOR */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <h3 className="text-sm font-bold text-[#E6EDF3] font-mono uppercase flex items-center gap-2">
                <FileCheck size={18} className="text-[#00C896]" /> Adversarial Probe Inspection & Evidence Log
              </h3>
              <button onClick={() => setSelectedResult(null)} className="text-[#8B949E] hover:text-[#E6EDF3]">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#30363D] space-y-1">
                <span className="text-[#8B949E] font-bold block uppercase font-mono">Adversarial Test Prompt Sent:</span>
                <p className="text-[#E6EDF3] font-mono leading-relaxed">{selectedResult.prompt}</p>
              </div>

              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#30363D] space-y-1">
                <span className="text-[#8B949E] font-bold block uppercase font-mono">Target System Response:</span>
                <p className="text-[#E6EDF3] font-mono leading-relaxed">{selectedResult.response}</p>
              </div>

              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#30363D] space-y-1">
                <span className="text-[#00C896] font-bold block uppercase font-mono">LLM-as-a-Judge Evaluation Verdict:</span>
                <p className="text-[#E6EDF3] leading-relaxed">{selectedResult.reasoning}</p>
              </div>

              {selectedResult.remediation && (
                <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 p-3 rounded-lg space-y-1">
                  <span className="text-[#7C3AED] font-bold block uppercase font-mono">Actionable System Hardening Recommendation:</span>
                  <p className="text-[#E6EDF3] leading-relaxed">{selectedResult.remediation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] text-xs font-bold rounded-xl"
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
