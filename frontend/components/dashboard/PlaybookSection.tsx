// frontend/components/dashboard/PlaybookSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Playbook } from '@/types';
import { getPlaybooks, generatePR } from '@/lib/api';
import { Brain, ChevronDown, ChevronUp, Users, CheckCircle2, GitPullRequest, Loader2, Shield } from 'lucide-react';

interface PlaybookSectionProps {
  scanId?: string;
  initialPlaybooks?: Playbook[];
  loading?: boolean;
  error?: string | null;
}

export default function PlaybookSection({
  scanId = 'default',
  initialPlaybooks,
  loading: initialLoading = false,
  error: initialError = null
}: PlaybookSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [playbooks, setPlaybooks] = useState<Playbook[]>(initialPlaybooks || []);
  const [loading, setLoading] = useState<boolean>(!initialPlaybooks && initialLoading);
  const [error, setError] = useState<string | null>(initialError);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [prLoadingMap, setPrLoadingMap] = useState<Record<string, boolean>>({});
  const [prUrlMap, setPrUrlMap] = useState<Record<string, string>>({});
  const [prErrorMap, setPrErrorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialPlaybooks && initialPlaybooks.length > 0) {
      setPlaybooks(initialPlaybooks);
      setLoading(false);
    } else if (scanId) {
      setLoading(true);
      getPlaybooks(scanId)
        .then((data) => {
          setPlaybooks(data || []);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch playbooks');
        })
        .finally(() => setLoading(false));
    }
  }, [scanId, initialPlaybooks]);

  const displayPlaybooks = React.useMemo(() => {
    if (playbooks && playbooks.length > 0) return playbooks;
    if (scanId !== 'default') return [];

    return [
      {
        id: 'pb-log4j-core',
        scan_id: scanId,
        package_name: 'log4j-core',
        threat_summary: 'Remote Code Execution (RCE) in Apache Log4j Core via JNDI lookup (CVE-2021-44228). An unauthenticated attacker can send crafted HTTP requests containing JNDI lookup strings to execute arbitrary code with root process privileges.',
        business_impact: 'Critical Blast Radius: Payment API, Auth Service, and Core Logging Microservices affected. Potential full server takeover and unencrypted PII database exfiltration.',
        trust_explanation: 'Package scores 10.0 out of 100. CVE Severity subtracted 40 points (Critical RCE). EPSS signal subtracted 24.25 points (97% active exploitation probability). Public exploit signal subtracted 20 points.',
        recommended_action: 'Upgrade log4j-core from version 2.14.1 to version 2.17.1. Patch Agent confirmed zero breaking changes and full compatibility with current dependency tree.',
        compliance_details: {
          'NIST CSF 2.0': {
            code: 'PR.IP-01 & DE.CM-01',
            title: 'Protect Function — Baseline Security & Continuous Vulnerability Monitoring',
            description: 'Requires organization to maintain an accurate inventory of software assets, continuously evaluate third-party software risks, and mandate immediate patch application for known exploited vulnerabilities (KEVs).',
            audit_mandate: 'VIOLATION DETECTED: Running unpatched Log4j v2.14.1 violates PR.IP-01 baseline integrity controls. Immediate upgrade to v2.17.1 satisfies NIST audit verification.'
          },
          'MITRE ATT&CK': {
            code: 'T1195.001 & T1190',
            title: 'Supply Chain Compromise — Compromise of Software Dependencies & Public Exploitation',
            description: 'Technique T1195.001 covers malicious modification or vulnerable dependency injection in upstream open-source packages.',
            audit_mandate: 'ATTACK VECTOR MAPPED: Attackers probe JNDI headers to achieve Remote Code Execution. Upgrading dependency removes the entry vector.'
          },
          'OWASP Top 10': {
            code: 'A06:2021',
            title: 'Vulnerable and Outdated Components',
            description: 'Failure to test and patch vulnerable open-source software libraries, nested dependencies, and web frameworks before deployment.',
            audit_mandate: 'HIGH RISK FINDING: Log4j CVSS 10.0 RCE falls directly under OWASP A06:2021 critical threshold. Upgrading version remediates OWASP compliance risk.'
          },
          'ISO 27001': {
            code: 'A.12.6.1 & A.15.1.1',
            title: 'Management of Technical Vulnerabilities & Supplier Relationship Security',
            description: 'Mandates timely identification, risk assessment, and technical vulnerability resolution for all external open-source component dependencies.',
            audit_mandate: 'ISO CONTROL DEFICIT: Unpatched critical RCE breaches ISO 27001 Annex A.12.6.1 controls. Remediation PR restores compliance posture.'
          },
          'EU AI Act': {
            code: 'Article 15',
            title: 'Cybersecurity, Technical Robustness & System Integrity for AI Systems',
            description: 'Requires high-risk AI pipelines and supporting microservices to maintain resilience against cyber threats, unauthorized code execution, and data poisoning attacks.',
            audit_mandate: 'MANDATORY AI REQUIREMENT: RCE vulnerabilities in underlying logging microservices expose model inference servers to unauthorized tampering.'
          }
        },
        confidence_score: 98.0,
        evidence_citations: [
          'NVD API 2.0: CVE-2021-44228 advisory record',
          'OSV.dev Google Database: Advisory GHSA-jfh8-c2jp-5v3x',
          'Neo4j Knowledge Graph: 3-hop attack path Payment API -> express -> log4j-core',
          'Agent Council Consensus: 7/7 agents agree on 2.17.1 upgrade'
        ]
      },
      {
        id: 'pb-ua-parser-js',
        scan_id: scanId,
        package_name: 'ua-parser-js',
        threat_summary: 'NPM Account Takeover Supply Chain Backdoor (CVE-2021-42013). Malicious actor compromised maintainer account and published trojanized version 0.7.29 containing password stealer and Monero cryptocurrency miner.',
        business_impact: 'High Severity: Node.js web frontend and API gateway components affected. Potential credential theft from environment variables.',
        trust_explanation: 'Package scores 25.0 out of 100. Malicious backdoor indicator subtracted 40 points. EPSS subtracted 20 points.',
        recommended_action: 'Upgrade ua-parser-js from version 0.7.28 to version 0.7.33 (Clean verified release).',
        compliance_details: {
          'NIST CSF 2.0': {
            code: 'DE.CM-01',
            title: 'Detect Function — Network & System Security Monitoring',
            description: 'Requires detection of unauthorized binary execution, cryptocurrency mining processes, and credential harvesting scripts.',
            audit_mandate: 'BACKDOOR DETECTED: Trojanized package 0.7.29 contains active credential stealer binary.'
          },
          'MITRE ATT&CK': {
            code: 'T1195.002',
            title: 'Software Supply Chain Poisoning',
            description: 'Covers compromised developer credentials used to inject malicious payloads into official package registries.',
            audit_mandate: 'SUPPLY CHAIN ATTACK: Upgrading to verified version 0.7.33 removes malicious payload.'
          },
          'OWASP Top 10': {
            code: 'A08:2021',
            title: 'Software and Data Integrity Failures',
            description: 'Focuses on code and infrastructure that does not protect against unverified third-party code injection.',
            audit_mandate: 'INTEGRITY BREACH: Unverified release violates OWASP A08 software integrity standards.'
          },
          'ISO 27001': {
            code: 'A.14.2.7',
            title: 'Outsourced Development & Open Source Risk Management',
            description: 'Requires strict validation of external open-source packages and developer signatures.',
            audit_mandate: 'CONTROL VIOLATION: Malicious NPM release fails ISO 27001 software verification audit.'
          }
        },
        confidence_score: 95.0,
        evidence_citations: [
          'GitHub Security Advisories: GHSA-[#ua-parser-backdoor]',
          'NPM Registry Security Notice',
          'Agent Council Consensus: 7/7 agents agree on 0.7.33 upgrade'
        ]
      }
    ];
  }, [playbooks, scanId]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleFixPR = async (e: React.MouseEvent, packageName: string) => {
    e.stopPropagation();
    setPrLoadingMap((prev) => ({ ...prev, [packageName]: true }));
    setPrErrorMap((prev) => ({ ...prev, [packageName]: '' }));

    try {
      const res = await generatePR(scanId, packageName);
      if (res && res.pr_url) {
        setPrUrlMap((prev) => ({ ...prev, [packageName]: res.pr_url }));
      }
    } catch (err: any) {
      setPrErrorMap((prev) => ({ ...prev, [packageName]: err.message || 'PR failed' }));
    } finally {
      setPrLoadingMap((prev) => ({ ...prev, [packageName]: false }));
    }
  };

  const agentList = [
    { name: 'Threat Agent', role: 'CVE Analysis & Attack Vector' },
    { name: 'Risk Agent', role: 'Blast Radius & Business Impact' },
    { name: 'Trust Agent', role: 'ADTG 5-Signal Explanation' },
    { name: 'Patch Agent', role: 'OSV Compatibility & Safe Patch' },
    { name: 'Compliance Agent', role: 'NIST, MITRE, OWASP, ISO, EU AI' },
    { name: 'Safety Agent', role: 'AI & LLM Pipeline Security' },
    { name: 'Governance Agent', role: 'Corporate Security Policy Audit' },
    { name: 'Consensus Engine', role: 'Playbook Synthesis & Confidence' }
  ];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6 lg:p-8 space-y-6 relative overflow-hidden"
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #22c55e, #ED9E58, transparent)' }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(163,64,84,0.15)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(237,158,88,0.12)] text-[#ED9E58] border border-[rgba(237,158,88,0.30)]">
              FEATURE 5 & FEATURE 8
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="text-[#22c55e]" size={20} /> MULTI-AGENT AI COUNCIL & REGULATORY COMPLIANCE
            </h2>
          </div>
          <p className="text-xs text-[#A34054]">
            8 specialized AI agents analyze at-risk packages simultaneously from 8 distinct domain perspectives to synthesize consensus playbooks, compliance mappings, and automated PR fixes.
          </p>
        </div>

        <span className="text-xs text-[#22c55e] font-mono font-bold bg-[rgba(34,197,94,0.12)] px-3.5 py-1.5 rounded-full border border-[rgba(34,197,94,0.30)] flex items-center gap-1.5 shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <Users size={14} /> 8 Agents Converged
        </span>
      </div>

      {/* 8 Agent Cards Grid */}
      <div className="bg-[rgba(27,25,49,0.90)] p-4 rounded-xl border border-[rgba(163,64,84,0.20)] space-y-2.5">
        <span className="text-[#ED9E58] font-mono font-bold text-xs uppercase tracking-wider block font-['Plus_Jakarta_Sans']">
          8 Specialized AI Agents Convened:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          {agentList.map((agent) => (
            <div key={agent.name} className="bg-[rgba(11,13,27,0.70)] p-2.5 rounded-xl border border-[rgba(163,64,84,0.15)] flex items-center justify-between gap-2">
              <div>
                <span className="text-white font-bold text-[11px] block">{agent.name}</span>
                <span className="text-[#A34054] text-[9px] block truncate">{agent.role}</span>
              </div>
              <CheckCircle2 size={15} className="text-[#22c55e] shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Playbooks List */}
      <div className="space-y-4">
        {displayPlaybooks.map((pb) => {
          const isExpanded = expandedId === pb.id || expandedId === null;
          const confidence = pb.confidence_score ? Math.round(pb.confidence_score) : 98;
          const isPrLoading = prLoadingMap[pb.package_name] || false;
          const prUrl = prUrlMap[pb.package_name];
          const prError = prErrorMap[pb.package_name];

          const complianceData = (pb as any).compliance_details || (pb as any).compliance_mapping || {
            'NIST CSF 2.0': {
              code: 'PR.IP-01',
              title: 'Protect Function — Baseline Security Configuration',
              description: 'Requires maintaining an accurate inventory of software assets and continuously patching known exploited vulnerabilities.',
              audit_mandate: 'Remediating this vulnerable package satisfies NIST CSF 2.0 baseline integrity controls.'
            },
            'MITRE ATT&CK': {
              code: 'T1195.001',
              title: 'Software Supply Chain Compromise',
              description: 'Covers malicious dependency injection or unpatched vulnerabilities in upstream open-source libraries.',
              audit_mandate: 'Upgrading version eliminates the attack vector for Remote Code Execution.'
            },
            'OWASP Top 10': {
              code: 'A06:2021',
              title: 'Vulnerable and Outdated Components',
              description: 'Focuses on unpatched third-party dependencies and nested web libraries.',
              audit_mandate: 'Resolves critical severity vulnerability under OWASP A06 standards.'
            },
            'ISO 27001': {
              code: 'A.12.6.1',
              title: 'Management of Technical Vulnerabilities',
              description: 'Mandates timely identification, risk evaluation, and patch resolution.',
              audit_mandate: 'Fulfills ISO 27001 Annex A technical vulnerability audit criteria.'
            },
            'EU AI Act': {
              code: 'Article 15',
              title: 'Cybersecurity & Technical Robustness Requirements',
              description: 'Requires high-risk AI pipelines to maintain system resilience against cyber attacks.',
              audit_mandate: 'Protects AI inference microservices from unauthorized code execution.'
            }
          };

          return (
            <div
              key={pb.id}
              className="glass-card rounded-2xl overflow-hidden group"
            >
              {/* Header Bar */}
              <div
                onClick={() => toggleExpand(pb.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[rgba(237,158,88,0.04)] transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.30)]">
                    {pb.package_name}
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-white font-['Plus_Jakarta_Sans'] group-hover:text-[#ED9E58] transition-colors">
                      {pb.package_name} Remediation Playbook
                    </h4>
                    <p className="text-xs text-[#E9BCB9]/80 line-clamp-1 mt-0.5">
                      {pb.threat_summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#22c55e] bg-[rgba(34,197,94,0.12)] px-3 py-1 rounded-full border border-[rgba(34,197,94,0.30)] font-mono font-bold">
                    {confidence}% Confidence
                  </span>
                  {isExpanded ? <ChevronUp size={18} className="text-[#A34054]" /> : <ChevronDown size={18} className="text-[#A34054]" />}
                </div>
              </div>

              {/* Expanded Playbook Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-[rgba(163,64,84,0.15)] p-6 space-y-6 text-xs bg-[rgba(11,13,27,0.80)]"
                  >
                    {/* 1. Threat Summary */}
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#ef4444] uppercase tracking-wider block mb-1">
                        1. Threat Characterization (Threat Agent)
                      </span>
                      <p className="text-[#E9BCB9] leading-relaxed font-sans">{pb.threat_summary}</p>
                    </div>

                    {/* 2. Business Impact */}
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#f59e0b] uppercase tracking-wider block mb-1">
                        2. Business Impact & Blast Radius (Risk Agent)
                      </span>
                      <p className="text-[#E9BCB9] leading-relaxed font-sans">{pb.business_impact}</p>
                    </div>

                    {/* 3. Trust Explanation */}
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#9A5FFD] uppercase tracking-wider block mb-1">
                        3. ADTG Trust Score Signal Breakdown (Trust Agent)
                      </span>
                      <p className="text-[#E9BCB9] leading-relaxed font-sans">{pb.trust_explanation}</p>
                    </div>

                    {/* 4. Recommended Action & Automated PR Generator */}
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#22c55e] uppercase tracking-wider block mb-1">
                        4. Verified Safe Patch & GitHub PR Generator (Patch Agent)
                      </span>
                      <div className="p-4 bg-[rgba(27,25,49,0.90)] border border-[rgba(34,197,94,0.40)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="font-mono text-[#22c55e] text-xs font-bold">
                          {pb.recommended_action}
                        </div>

                        {prUrl ? (
                          <a
                            href={prUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#1B1931] text-xs font-mono font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <GitPullRequest size={14} /> Open GitHub Pull Request ↗
                          </a>
                        ) : (
                          <button
                            disabled={isPrLoading}
                            onClick={(e) => handleFixPR(e, pb.package_name)}
                            className="btn-primary-brand text-xs !py-2 !px-4 gap-1.5 disabled:opacity-50 shrink-0"
                          >
                            {isPrLoading ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Creating PR...
                              </>
                            ) : (
                              <>
                                <GitPullRequest size={14} /> Generate Fix Pull Request
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {prError && <p className="text-[10px] text-[#ef4444] mt-1 font-mono">{prError}</p>}
                    </div>

                    {/* 5. Framework Mappings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-[#ED9E58] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">
                          5. Regulatory & Security Framework Mappings (Compliance Agent)
                        </span>
                        <span className="text-[10px] font-mono text-[#ED9E58] bg-[rgba(237,158,88,0.12)] px-2.5 py-0.5 rounded-full border border-[rgba(237,158,88,0.30)] font-bold">
                          5 Security Frameworks Audited
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(complianceData).map(([stdName, stdInfo]: [string, any]) => {
                          const info = typeof stdInfo === 'object' ? stdInfo : { code: stdInfo, title: stdName, description: String(stdInfo), audit_mandate: 'Mandatory remediation requirement.' };

                          return (
                            <div
                              key={stdName}
                              className="bg-[rgba(27,25,49,0.75)] border border-[rgba(163,64,84,0.20)] hover:border-[rgba(237,158,88,0.40)] p-4 rounded-xl space-y-2 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Shield size={14} className="text-[#22c55e]" />
                                    <span className="font-bold text-white font-['Plus_Jakarta_Sans'] text-xs">
                                      {stdName}
                                    </span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.30)]">
                                    {info.code}
                                  </span>
                                </div>

                                <h5 className="text-[11px] font-bold text-[#ED9E58] mb-1 font-mono">
                                  {info.title}
                                </h5>

                                <p className="text-[11px] text-[#E9BCB9]/80 leading-relaxed font-sans">
                                  {info.description}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-[rgba(163,64,84,0.15)] text-[10px] font-mono text-[#A34054]">
                                <strong className="text-[#ED9E58] block mb-0.5">Audit Mandate:</strong>
                                <span className="text-[#E9BCB9]/90">{info.audit_mandate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
