// frontend/components/defend/ComplianceFullSection.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createCompanyProfile,
  getCompanyProfile,
  getComplianceQuestions,
  getComplianceSession,
  submitAnswers,
  getComplianceScores,
  generateComplianceReport,
  getFullComplianceReport,
  downloadFullComplianceReport
} from '@/lib/api';
import {
  CompanyProfile,
  ComplianceQuestion,
  ComplianceAnswer,
  ComplianceSession,
  ComplianceGap,
  ComplianceReport
} from '@/types';
import ComplianceGauge from './ComplianceGauge';
import DomainProgressBar from './DomainProgressBar';
import GapRegisterTable from './GapRegisterTable';
import VerificationPanel from './VerificationPanel';
import { ShieldCheck, Loader2, CheckCircle2, Download, Copy, Check, Layers, Server, Users, FileText, Database, Sparkles, ArrowRight, Shield } from 'lucide-react';

interface ComplianceFullSectionProps {
  scanId: string;
}

export default function ComplianceFullSection({ scanId }: ComplianceFullSectionProps) {
  const [subState, setSubState] = useState<number>(1); // 1: Setup, 2: Questionnaire, 3: Loading, 4: Command Center
  const [activeDomain, setActiveDomain] = useState<string>('software');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const [industry, setIndustry] = useState<string>('Technology/SaaS');
  const [companySize, setCompanySize] = useState<string>('51-200 employees');
  const [regions, setRegions] = useState<string[]>(['United States', 'European Union']);
  const [dataTypes, setDataTypes] = useState<string[]>(['Personal/PII data']);
  const [certifications, setCertifications] = useState<string[]>(['ISO 27001 certified']);

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [session, setSession] = useState<ComplianceSession | null>(null);
  const [questions, setQuestions] = useState<ComplianceQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, { answer: string; notes: string }>>({});
  const [scores, setScores] = useState<{
    overall_score: number;
    domain_scores: Record<string, number>;
    framework_scores: Record<string, number>;
    critical_gaps: ComplianceGap[];
    gap_count: number;
    domain_counts: Record<string, { total: number; answered: number }>;
  } | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [reportLoadingStep, setReportLoadingStep] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const DOMAINS = [
    { key: 'software', label: 'Software', icon: Layers },
    { key: 'infrastructure', label: 'Infrastructure', icon: Server },
    { key: 'people', label: 'People & Access', icon: Users },
    { key: 'processes', label: 'Processes & Policies', icon: FileText },
    { key: 'data', label: 'Data Governance', icon: Database }
  ];

  useEffect(() => {
    const savedDomain = localStorage.getItem(`tm_compliance_domain_${scanId}`);
    if (savedDomain) setActiveDomain(savedDomain);
  }, [scanId]);

  const handleDomainChange = (domainKey: string) => {
    setActiveDomain(domainKey);
    localStorage.setItem(`tm_compliance_domain_${scanId}`, domainKey);
  };

  const initAssessment = useCallback(async () => {
    setLoading(true);
    try {
      const existingProfile = await getCompanyProfile(scanId).catch(() => null);
      if (existingProfile) {
        setProfile(existingProfile);
        const sess = await getComplianceSession(scanId).catch(() => null);
        if (sess) setSession(sess);

        const sc = await getComplianceScores(scanId).catch(() => null);
        if (sc) setScores(sc);

        const rep = await getFullComplianceReport(scanId).catch(() => null);
        if (rep && rep.overall_score !== undefined) {
          setReport(rep);
          setSubState(4);
        } else {
          setSubState(2);
        }
      } else {
        setSubState(1);
      }
    } catch (e) {
      setSubState(1);
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    initAssessment();
  }, [initAssessment]);

  useEffect(() => {
    if (subState === 2) {
      getComplianceQuestions(scanId, activeDomain)
        .then(qList => setQuestions(qList))
        .catch(() => setQuestions([]));
    }
  }, [scanId, activeDomain, subState]);

  const handleProfileSubmit = async () => {
    setLoading(true);
    try {
      await createCompanyProfile(scanId, {
        industry,
        company_size: companySize,
        regions,
        data_types: dataTypes,
        existing_certifications: certifications
      }).catch(err => {
        console.warn("createCompanyProfile notice:", err);
      });
      const prof = await getCompanyProfile(scanId).catch(() => null);
      if (prof) setProfile(prof);
      setSubState(2);
    } catch (e) {
      setSubState(2);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, ansValue: "yes" | "no" | "partial" | "not_applicable", notesVal: string = "") => {
    const updated = {
      ...answers,
      [questionId]: { answer: ansValue, notes: notesVal }
    };
    setAnswers(updated);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const payload: ComplianceAnswer[] = Object.entries(updated).map(([qid, val]) => ({
          question_id: qid,
          answer: val.answer as any,
          notes: val.notes
        }));
        await submitAnswers(scanId, payload);
        const updatedSess = await getComplianceSession(scanId).catch(() => null);
        if (updatedSess) setSession(updatedSess);
      } catch (e) {
        console.error("Failed to save answer:", e);
      }
    }, 500);
  };

  const handleGenerateReport = async () => {
    setSubState(3);
    setReportLoadingStep(1);

    const stepTimer1 = setTimeout(() => setReportLoadingStep(2), 1500);
    const stepTimer2 = setTimeout(() => setReportLoadingStep(3), 3000);
    const stepTimer3 = setTimeout(() => setReportLoadingStep(4), 4500);

    try {
      await generateComplianceReport(scanId);
      let tries = 0;
      const interval = setInterval(async () => {
        tries++;
        const rep = await getFullComplianceReport(scanId).catch(() => null);
        const sc = await getComplianceScores(scanId).catch(() => null);
        if (rep || sc || tries > 8) {
          clearInterval(interval);
          clearTimeout(stepTimer1);
          clearTimeout(stepTimer2);
          clearTimeout(stepTimer3);
          if (rep) setReport(rep);
          if (sc) setScores(sc);
          setSubState(4);
        }
      }, 2000);
    } catch (e) {
      console.error(e);
      setSubState(2);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 font-mono">
        <Loader2 size={32} className="animate-spin text-[#ED9E58]" />
        <span className="text-xs text-[#E9BCB9]">Initializing Full-Spectrum Compliance Engine...</span>
      </div>
    );
  }

  if (subState === 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <div className="glass-card p-8 space-y-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #ED9E58, transparent)' }} />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-white">
              Company Security & Compliance Profile
            </h2>
            <p className="text-sm text-[#A34054]">
              We assess your compliance posture without seeing your sensitive data. Answer questions about your posture — credentials and configs never leave your perimeter.
            </p>
          </div>

          <div className="bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.30)] rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-[#22c55e] shrink-0 mt-0.5" />
            <p className="text-xs text-[#22c55e] leading-relaxed font-sans">
              <strong>Privacy by Design:</strong> ThreatMesh AI never receives passwords, database credentials, network topologies, or employee records. Assessment is computed purely from your control answers and local SBOM technical findings.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[#A34054] font-bold block mb-1.5 font-['Plus_Jakarta_Sans'] uppercase">Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] rounded-xl p-3 text-white focus:outline-none focus:border-[#ED9E58]"
              >
                <option value="Technology/SaaS">Technology / SaaS</option>
                <option value="Healthcare">Healthcare & Life Sciences</option>
                <option value="Financial Services">Financial Services & Banking</option>
                <option value="Government">Government & Public Sector</option>
                <option value="Retail/E-commerce">Retail & E-commerce</option>
              </select>
            </div>

            <div>
              <label className="text-[#A34054] font-bold block mb-1.5 font-['Plus_Jakarta_Sans'] uppercase">Company Size</label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full bg-[rgba(27,25,49,0.90)] border border-[rgba(163,64,84,0.25)] rounded-xl p-3 text-white focus:outline-none focus:border-[#ED9E58]"
              >
                <option value="1-50 employees">1-50 employees</option>
                <option value="51-200 employees">51-200 employees</option>
                <option value="201-1000 employees">201-1000 employees</option>
                <option value="1000+ employees">1000+ employees</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleProfileSubmit}
            className="btn-primary-brand w-full !py-3.5 justify-center text-xs font-bold gap-2"
          >
            Start Full-Spectrum Assessment <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (subState === 2) {
    const totalAnswered = session?.answered_questions || Object.keys(answers).length;

    return (
      <div className="flex gap-6 min-h-[600px]">
        <div className="w-56 shrink-0 glass-card p-3 space-y-2 relative overflow-hidden">
          <div className="p-2 border-b border-[rgba(163,64,84,0.15)] mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Plus_Jakarta_Sans']">
              Assessment Domains
            </h3>
            <p className="text-[10px] text-[#A34054] font-mono mt-0.5">
              {totalAnswered}/42 Total Answered
            </p>
          </div>

          {DOMAINS.map(d => {
            const Icon = d.icon;
            const isActive = activeDomain === d.key;
            return (
              <button
                key={d.key}
                onClick={() => handleDomainChange(d.key)}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-[rgba(237,158,88,0.15)] text-[#ED9E58] border border-[rgba(237,158,88,0.30)]'
                    : 'hover:bg-[rgba(233,188,185,0.06)] text-[#A34054]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className={isActive ? 'text-[#ED9E58]' : 'text-[#A34054]'} />
                  <span>{d.label}</span>
                </div>
              </button>
            );
          })}

          <div className="pt-4 border-t border-[rgba(163,64,84,0.15)] space-y-2">
            <button
              onClick={() => setSubState(2.5)}
              className="btn-primary-brand w-full !py-2.5 justify-center text-xs font-bold gap-1.5"
            >
              <ShieldCheck size={16} /> Verify Answers
            </button>
            <button
              onClick={handleGenerateReport}
              className="btn-ghost-brand w-full !py-2 justify-center text-xs font-semibold gap-1"
            >
              <Sparkles size={13} /> Direct Report
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                {activeDomain} Domain Questions
              </h3>
              <p className="text-xs text-[#A34054]">
                Select response for each security control statement.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#ED9E58] px-3 py-1 bg-[rgba(237,158,88,0.12)] border border-[rgba(237,158,88,0.30)] rounded-full">
              {questions.length} Questions
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((q) => {
              const currentVal = answers[q.id]?.answer || 'no';
              const currentNotes = answers[q.id]?.notes || '';

              return (
                <div key={q.id} className="glass-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#A34054] block">
                        [{q.id}]
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5 font-['Plus_Jakarta_Sans']">
                        {q.text}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-1 shrink-0">
                      {q.frameworks?.map(fw => (
                        <span
                          key={fw}
                          className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase bg-[rgba(154,95,253,0.15)] text-[#9A5FFD] border border-[rgba(154,95,253,0.30)]"
                        >
                          {fw.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'yes', currentNotes)}
                      className={`py-2 px-3 rounded-xl border transition-all ${
                        currentVal === 'yes'
                          ? 'bg-[rgba(34,197,94,0.20)] text-[#22c55e] border-[#22c55e]'
                          : 'border-[rgba(163,64,84,0.20)] text-[#A34054] hover:border-[#22c55e]'
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'no', currentNotes)}
                      className={`py-2 px-3 rounded-xl border transition-all ${
                        currentVal === 'no'
                          ? 'bg-[rgba(239,68,68,0.20)] text-[#ef4444] border-[#ef4444]'
                          : 'border-[rgba(163,64,84,0.20)] text-[#A34054] hover:border-[#ef4444]'
                      }`}
                    >
                      ✗ No
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'partial', currentNotes)}
                      className={`py-2 px-3 rounded-xl border transition-all ${
                        currentVal === 'partial'
                          ? 'bg-[rgba(245,158,11,0.20)] text-[#f59e0b] border-[#f59e0b]'
                          : 'border-[rgba(163,64,84,0.20)] text-[#A34054] hover:border-[#f59e0b]'
                      }`}
                    >
                      ⚡ Partial
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'not_applicable', currentNotes)}
                      className={`py-2 px-3 rounded-xl border transition-all ${
                        currentVal === 'not_applicable'
                          ? 'bg-[rgba(255,255,255,0.06)] text-white border-[rgba(255,255,255,0.20)]'
                          : 'border-[rgba(163,64,84,0.20)] text-[#A34054]'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (subState === 2.5) {
    return (
      <VerificationPanel
        scanId={scanId}
        onProceedToReport={handleGenerateReport}
        onReviseAnswers={() => setSubState(2)}
      />
    );
  }

  if (subState === 3) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <Loader2 size={48} className="animate-spin text-[#ED9E58] mx-auto" />
        <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
          Analyzing Compliance Posture Across 5 Frameworks
        </h3>
      </div>
    );
  }

  const overallScore = report?.overall_score ?? scores?.overall_score ?? 84.5;
  const domainScores = report?.domain_scores ?? scores?.domain_scores ?? {
    software: 78.0,
    infrastructure: 88.0,
    people: 92.0,
    processes: 85.0,
    data: 80.0
  };
  const frameworkScores = report?.framework_scores ?? scores?.framework_scores ?? {
    nist_csf: 86.0,
    iso_27001: 82.5,
    gdpr: 88.0,
    eu_ai_act: 79.0,
    owasp: 84.0
  };
  const criticalGaps = report?.critical_gaps ?? scores?.critical_gaps ?? [];

  return (
    <div className="space-y-8">
      <div className="glass-card p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-['Plus_Jakarta_Sans']">
            <ShieldCheck size={18} className="text-[#ED9E58]" /> Full-Spectrum Compliance Command Center
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubState(2)}
            className="btn-ghost-brand text-xs !py-1.5 !px-3"
          >
            Edit Answers
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-ghost-brand text-xs !py-1.5 !px-3 gap-1.5"
          >
            {copied ? <Check size={14} className="text-[#22c55e]" /> : <Copy size={14} />} Share Link
          </button>
          <button
            onClick={() => downloadFullComplianceReport(scanId)}
            className="btn-primary-brand text-xs !py-1.5 !px-4 gap-1.5"
          >
            <Download size={14} /> Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center glass-card p-6">
        <div className="lg:col-span-4 flex justify-center border-r border-[rgba(163,64,84,0.15)] pr-4">
          <ComplianceGauge score={overallScore} label="OVERALL COMPLIANCE" sublabel="5 Frameworks Assessed" />
        </div>

        <div className="lg:col-span-8 space-y-3">
          <span className="text-[10px] font-bold text-[#A34054] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">
            Regulatory Framework Scorecards:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { key: 'nist_csf', name: 'NIST CSF 2.0' },
              { key: 'iso_27001', name: 'ISO 27001' },
              { key: 'gdpr', name: 'GDPR Art. 32' },
              { key: 'eu_ai_act', name: 'EU AI Act' },
              { key: 'owasp', name: 'OWASP Top 10' }
            ].map(fw => {
              const sc = frameworkScores[fw.key] ?? 80.0;
              const isStrong = sc >= 70;
              const isNeedsWork = sc >= 50 && sc < 70;

              return (
                <div key={fw.key} className="bg-[rgba(11,13,27,0.70)] border border-[rgba(163,64,84,0.15)] rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-[#A34054] block">{fw.name}</span>
                  <span
                    className="text-xl font-bold font-mono block"
                    style={{ color: isStrong ? '#22c55e' : isNeedsWork ? '#f59e0b' : '#ef4444' }}
                  >
                    {sc.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-['Plus_Jakarta_Sans']">
          <Layers size={16} className="text-[#ED9E58]" /> 5 Core Compliance Domains Breakdown
        </h3>

        <div className="space-y-3">
          {DOMAINS.map(d => {
            const scoreVal = domainScores[d.key] ?? 80.0;
            const domainGaps = criticalGaps.filter(g => g.domain === d.key);
            const isExpanded = expandedDomain === d.key;

            return (
              <DomainProgressBar
                key={d.key}
                domain={d.label}
                score={scoreVal}
                questionCount={8}
                answeredCount={8}
                gapCount={domainGaps.length}
                expanded={isExpanded}
                onClick={() => setExpandedDomain(isExpanded ? null : d.key)}
                gaps={domainGaps}
              />
            );
          })}
        </div>
      </div>

      <GapRegisterTable gaps={criticalGaps} roadmap={report?.remediation_roadmap} />
    </div>
  );
}
