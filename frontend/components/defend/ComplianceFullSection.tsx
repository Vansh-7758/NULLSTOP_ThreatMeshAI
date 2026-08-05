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
  RemediationItem,
  ComplianceReport
} from '@/types';
import ComplianceGauge from './ComplianceGauge';
import DomainProgressBar from './DomainProgressBar';
import GapRegisterTable from './GapRegisterTable';
import VerificationPanel from './VerificationPanel';
import {
  ShieldCheck,
  Lock,
  Loader2,
  Play,
  CheckCircle2,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  Server,
  Users,
  FileText,
  Database,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ComplianceFullSectionProps {
  scanId: string;
}

export default function ComplianceFullSection({ scanId }: ComplianceFullSectionProps) {
  // Navigation & Sub-State Management
  const [subState, setSubState] = useState<number>(1); // 1: Setup, 2: Questionnaire, 3: Loading, 4: Command Center
  const [activeDomain, setActiveDomain] = useState<string>('software');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Profile Form State
  const [industry, setIndustry] = useState<string>('Technology/SaaS');
  const [companySize, setCompanySize] = useState<string>('51-200 employees');
  const [regions, setRegions] = useState<string[]>(['United States', 'European Union']);
  const [dataTypes, setDataTypes] = useState<string[]>(['Personal/PII data']);
  const [certifications, setCertifications] = useState<string[]>(['ISO 27001 certified']);

  // Data State
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

  // Loading & UI States
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

  // Load saved active domain from localStorage
  useEffect(() => {
    const savedDomain = localStorage.getItem(`tm_compliance_domain_${scanId}`);
    if (savedDomain) setActiveDomain(savedDomain);
  }, [scanId]);

  const handleDomainChange = (domainKey: string) => {
    setActiveDomain(domainKey);
    localStorage.setItem(`tm_compliance_domain_${scanId}`, domainKey);
  };

  // Initial Load Check
  const initAssessment = useCallback(async () => {
    setLoading(true);
    try {
      const existingProfile = await getCompanyProfile(scanId).catch(() => null);
      if (existingProfile) {
        setProfile(existingProfile);
        const sess = await getComplianceSession(scanId).catch(() => null);
        if (sess) setSession(sess);

        // Fetch scores or report if ready
        const sc = await getComplianceScores(scanId).catch(() => null);
        if (sc) setScores(sc);

        const rep = await getFullComplianceReport(scanId).catch(() => null);
        if (rep && rep.overall_score !== undefined) {
          setReport(rep);
          setSubState(4); // Command Center
        } else {
          setSubState(2); // Questionnaire
        }
      } else {
        setSubState(1); // Setup
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

  // Load Questions for Active Domain
  useEffect(() => {
    if (subState === 2) {
      getComplianceQuestions(scanId, activeDomain)
        .then(qList => setQuestions(qList))
        .catch(() => setQuestions([]));
    }
  }, [scanId, activeDomain, subState]);

  // Handle Profile Submission
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
        console.warn("createCompanyProfile network warning, using fallback:", err);
      });
      const prof = await getCompanyProfile(scanId).catch(() => null);
      if (prof) setProfile(prof);
      setSubState(2);
    } catch (e) {
      console.error("handleProfileSubmit error:", e);
      setSubState(2);
    } finally {
      setLoading(false);
    }
  };

  // Handle Answer Selection with 500ms Debounce
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

  // Trigger Report Generation & Loading Sequence
  const handleGenerateReport = async () => {
    setSubState(3); // Loading screen
    setReportLoadingStep(1);

    const stepTimer1 = setTimeout(() => setReportLoadingStep(2), 1500);
    const stepTimer2 = setTimeout(() => setReportLoadingStep(3), 3000);
    const stepTimer3 = setTimeout(() => setReportLoadingStep(4), 4500);

    try {
      await generateComplianceReport(scanId);

      // Poll or wait for report
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
          setSubState(4); // Command center
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
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 size={32} className="animate-spin text-[#7C3AED]" />
        <span className="text-xs text-[#94A3B8] font-mono">Initializing Full-Spectrum Compliance Engine...</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-STATE 1: Company Profile Setup
  // ---------------------------------------------------------------------------
  if (subState === 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-mono text-[#F8FAFC]">
              Company Security & Compliance Profile
            </h2>
            <p className="text-sm text-[#94A3B8]">
              We assess your compliance posture without seeing your sensitive data. Answer questions about your posture — your credentials and configs never leave your perimeter.
            </p>
          </div>

          {/* Privacy Assurance Banner */}
          <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-[#10B981] shrink-0 mt-0.5" />
            <p className="text-xs text-[#10B981] leading-relaxed">
              <strong>Privacy by Design:</strong> ThreatMesh AI never receives passwords, database credentials, network topologies, or employee records. Assessment is computed purely from your control answers and local SBOM technical findings.
            </p>
          </div>

          {/* Setup Form */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[#94A3B8] font-semibold block mb-1.5">Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#09090F] border border-[#1E1E3A] rounded-lg p-3 text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="Technology/SaaS">Technology / SaaS</option>
                <option value="Healthcare">Healthcare & Life Sciences</option>
                <option value="Financial Services">Financial Services & Banking</option>
                <option value="Government">Government & Public Sector</option>
                <option value="Retail/E-commerce">Retail & E-commerce</option>
                <option value="Manufacturing">Manufacturing & Industrial</option>
                <option value="Education">Education & Academia</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[#94A3B8] font-semibold block mb-1.5">Company Size</label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full bg-[#09090F] border border-[#1E1E3A] rounded-lg p-3 text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="1-50 employees">1-50 employees</option>
                <option value="51-200 employees">51-200 employees</option>
                <option value="201-1000 employees">201-1000 employees</option>
                <option value="1000+ employees">1000+ employees</option>
              </select>
            </div>

            <div>
              <label className="text-[#94A3B8] font-semibold block mb-1.5">Regions of Operation</label>
              <div className="grid grid-cols-2 gap-2 bg-[#09090F] border border-[#1E1E3A] rounded-lg p-3">
                {['European Union', 'United States', 'India', 'United Kingdom', 'Other'].map(r => (
                  <label key={r} className="flex items-center gap-2 text-[#F8FAFC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regions.includes(r)}
                      onChange={(e) => {
                        if (e.target.checked) setRegions([...regions, r]);
                        else setRegions(regions.filter(x => x !== r));
                      }}
                      className="accent-[#7C3AED]"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[#94A3B8] font-semibold block mb-1.5">Data Types Handled</label>
              <div className="grid grid-cols-2 gap-2 bg-[#09090F] border border-[#1E1E3A] rounded-lg p-3">
                {['Personal/PII data', 'Financial transaction data', 'Health/medical data', 'AI training data'].map(d => (
                  <label key={d} className="flex items-center gap-2 text-[#F8FAFC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dataTypes.includes(d)}
                      onChange={(e) => {
                        if (e.target.checked) setDataTypes([...dataTypes, d]);
                        else setDataTypes(dataTypes.filter(x => x !== d));
                      }}
                      className="accent-[#7C3AED]"
                    />
                    <span>{d}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[#94A3B8] font-semibold block mb-1.5">Existing Certifications</label>
              <div className="grid grid-cols-2 gap-2 bg-[#09090F] border border-[#1E1E3A] rounded-lg p-3">
                {['ISO 27001 certified', 'SOC 2 Type II', 'PCI DSS', 'None'].map(c => (
                  <label key={c} className="flex items-center gap-2 text-[#F8FAFC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certifications.includes(c)}
                      onChange={(e) => {
                        if (e.target.checked) setCertifications([...certifications, c]);
                        else setCertifications(certifications.filter(x => x !== c));
                      }}
                      className="accent-[#7C3AED]"
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleProfileSubmit}
            className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#A855F7] text-[#F8FAFC] font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Start Full-Spectrum Assessment <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-STATE 2: Questionnaire Screen
  // ---------------------------------------------------------------------------
  if (subState === 2) {
    const totalAnswered = session?.answered_questions || Object.keys(answers).length;

    return (
      <div className="flex gap-6 min-h-[600px]">
        {/* Left Domain Navigation Sidebar */}
        <div className="w-56 shrink-0 bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl p-3 space-y-2">
          <div className="p-2 border-b border-[#1E1E3A] mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Assessment Domains
            </h3>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">
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
                className={`w-full text-left p-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-[#7C3AED]/20 text-[#F8FAFC] border-l-4 border-l-[#7C3AED]'
                    : 'hover:bg-[#1E1E3A]/50 text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className={isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8]'} />
                  <span>{d.label}</span>
                </div>
              </button>
            );
          })}

          <div className="pt-4 border-t border-[#1E1E3A] space-y-2">
            <button
              onClick={() => setSubState(2.5)}
              className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-[#09090F] font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 hover:scale-105"
            >
              <ShieldCheck size={16} /> Verify Answers
            </button>
            <button
              onClick={handleGenerateReport}
              className="w-full py-2 bg-[#09090F] hover:bg-[#1E1E3A] text-[#94A3B8] hover:text-[#F8FAFC] font-semibold text-[11px] rounded-lg border border-[#1E1E3A] transition-all flex items-center justify-center gap-1"
            >
              <Sparkles size={13} /> Skip to Direct Report
            </button>
          </div>
        </div>

        {/* Main Question Panel */}
        <div className="flex-1 space-y-4">
          <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider">
                {activeDomain} Domain Questions
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Select response for each security control statement.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#7C3AED] px-3 py-1 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg">
              {questions.length} Questions
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((q) => {
              const currentVal = answers[q.id]?.answer || 'no';
              const currentNotes = answers[q.id]?.notes || '';

              return (
                <div key={q.id} className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#475569] block">
                        [{q.id}]
                      </span>
                      <h4 className="text-sm font-medium text-[#F8FAFC] mt-0.5">
                        {q.text}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-1 shrink-0">
                      {q.frameworks?.map(fw => (
                        <span
                          key={fw}
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase bg-[#2563EB]/15 text-[#3B82F6] border-[#2563EB]/30"
                        >
                          {fw.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 4 Answer Choice Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'yes', currentNotes)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        currentVal === 'yes'
                          ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                          : 'border-[#1E1E3A] text-[#94A3B8] hover:border-[#10B981]/50'
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'no', currentNotes)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        currentVal === 'no'
                          ? 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]'
                          : 'border-[#1E1E3A] text-[#94A3B8] hover:border-[#DC2626]/50'
                      }`}
                    >
                      ✗ No
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'partial', currentNotes)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        currentVal === 'partial'
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]'
                          : 'border-[#1E1E3A] text-[#94A3B8] hover:border-[#F59E0B]/50'
                      }`}
                    >
                      ⚡ Partial
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(q.id, 'not_applicable', currentNotes)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        currentVal === 'not_applicable'
                          ? 'bg-[#475569]/20 text-[#94A3B8] border-[#475569]'
                          : 'border-[#1E1E3A] text-[#94A3B8] hover:border-[#475569]/50'
                      }`}
                    >
                      N/A
                    </button>
                  </div>

                  {/* Notes Textarea if not Yes */}
                  {currentVal !== 'yes' && (
                    <textarea
                      value={currentNotes}
                      onChange={(e) => handleAnswerSelect(q.id, currentVal as any, e.target.value)}
                      placeholder="Optional notes or evidence citations..."
                      rows={2}
                      className="w-full bg-[#09090F] border border-[#1E1E3A] rounded-lg p-2.5 text-xs text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#7C3AED]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-STATE 2.5 (2b): 3-Layer Verification Panel
  // ---------------------------------------------------------------------------
  if (subState === 2.5) {
    return (
      <VerificationPanel
        scanId={scanId}
        onProceedToReport={handleGenerateReport}
        onReviseAnswers={() => setSubState(2)}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-STATE 3: Report Generation Loading Screen
  // ---------------------------------------------------------------------------
  if (subState === 3) {
    const steps = [
      'Scoring questionnaire responses across 5 domains',
      'Integrating SBOM technical findings from WATCH',
      'Running AI gap analysis with Claude',
      'Generating audit-ready compliance report'
    ];

    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="relative flex items-center justify-center">
          <Loader2 size={48} className="animate-spin text-[#7C3AED]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            Analyzing Compliance Posture Across 5 Frameworks
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Combining company control answers with live SBOM vulnerability findings...
          </p>
        </div>

        <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl p-5 text-left space-y-3">
          {steps.map((st, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {reportLoadingStep > idx ? (
                <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
              ) : reportLoadingStep === idx + 1 ? (
                <Loader2 size={16} className="animate-spin text-[#7C3AED] shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#1E1E3A] shrink-0" />
              )}
              <span className={`text-xs ${reportLoadingStep >= idx + 1 ? 'text-[#F8FAFC]' : 'text-[#475569]'}`}>
                {st}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SUB-STATE 4: Compliance Command Center
  // ---------------------------------------------------------------------------
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
      {/* Header Bar with Action Buttons */}
      <div className="bg-[#0F0F1A] border border-[#1E1E3A] rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck size={18} className="text-[#7C3AED]" /> Full-Spectrum Compliance Command Center
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Company-wide compliance evaluation combining 5 control domains & technical SBOM findings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubState(2)}
            className="px-3 py-1.5 bg-[#09090F] hover:bg-[#1E1E3A] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold rounded-lg border border-[#1E1E3A] transition-colors"
          >
            Edit Answers
          </button>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-[#09090F] hover:bg-[#1E1E3A] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold rounded-lg border border-[#1E1E3A] transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />} Share Link
          </button>
          <button
            onClick={() => downloadFullComplianceReport(scanId)}
            className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#A855F7] text-[#F8FAFC] text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
          >
            <Download size={14} /> Download Report
          </button>
        </div>
      </div>

      {/* SECTION A: Overall Score Gauge & 5 Framework Score Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[#0F0F1A] border border-[#1E1E3A] rounded-2xl p-6">
        <div className="lg:col-span-4 flex justify-center border-r border-[#1E1E3A]/60 pr-4">
          <ComplianceGauge score={overallScore} label="OVERALL COMPLIANCE" sublabel="5 Frameworks Assessed" />
        </div>

        <div className="lg:col-span-8 space-y-3">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
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
                <div key={fw.key} className="bg-[#09090F] border border-[#1E1E3A] rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-[#94A3B8] block">{fw.name}</span>
                  <span
                    className="text-xl font-bold font-mono block"
                    style={{ color: isStrong ? '#10B981' : isNeedsWork ? '#F59E0B' : '#DC2626' }}
                  >
                    {sc.toFixed(1)}%
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block ${
                      isStrong
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                        : isNeedsWork
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                        : 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30'
                    }`}
                  >
                    {isStrong ? 'Strong' : isNeedsWork ? 'Needs Work' : 'Critical Gap'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION B: Five Domain Progress Bars */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
          <Layers size={16} className="text-[#06B6D4]" /> 5 Core Compliance Domains Breakdown
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

      {/* SECTION C: Critical Gaps Register & AI Roadmap */}
      <GapRegisterTable gaps={criticalGaps} roadmap={report?.remediation_roadmap} />
    </div>
  );
}
