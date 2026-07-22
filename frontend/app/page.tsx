'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Shield, AlertTriangle, Bug, GitPullRequest } from 'lucide-react';
import { uploadSBOM, triggerScan } from '@/lib/api';
import SummaryRow from '@/components/dashboard/SummaryRow';
import CyberHealthGauge from '@/components/dashboard/CyberHealthGauge';
import TrustDistributionChart from '@/components/dashboard/TrustDistributionChart';
import CriticalPackagesTable from '@/components/dashboard/CriticalPackagesTable';
import LiveFeed from '@/components/dashboard/LiveFeed';
import PlaybookCard from '@/components/dashboard/PlaybookCard';
import AIHealthPanel from '@/components/dashboard/AIHealthPanel';
import type { Package, LiveFeedEvent, Playbook, AIHealthMetrics, TrustDistribution } from '@/types';

const mockPackages: Package[] = [
  { id: '1', name: 'log4j-core', version: '2.14.1', ecosystem: 'maven', purl: null, node_type: 'package', trust_score: 12, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '2', name: 'lodash', version: '4.17.20', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 35, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '3', name: 'Pillow', version: '9.0.0', ecosystem: 'pypi', purl: null, node_type: 'package', trust_score: 42, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '4', name: 'axios', version: '0.21.1', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 65, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '5', name: 'express', version: '4.17.1', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 72, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '6', name: 'react', version: '18.2.0', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 95, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '7', name: 'flask', version: '2.2.0', ecosystem: 'pypi', purl: null, node_type: 'package', trust_score: 88, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '8', name: 'django', version: '3.2.0', ecosystem: 'pypi', purl: null, node_type: 'package', trust_score: 82, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '9', name: 'node-fetch', version: '2.6.1', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 58, first_seen: new Date().toISOString(), dependencies: [] },
  { id: '10', name: 'minimist', version: '1.2.5', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 48, first_seen: new Date().toISOString(), dependencies: [] },
];

const mockEvents: LiveFeedEvent[] = [
  { event_type: 'cve_detected', title: 'Critical CVE Detected', description: 'CVE-2021-44228 (Log4Shell) in log4j-core 2.14.1', severity: 'critical', timestamp: new Date().toISOString(), data: {} },
  { event_type: 'trust_updated', title: 'Trust Score Updated', description: 'log4j-core dropped from 65 to 12', severity: 'warning', timestamp: new Date(Date.now() - 60000).toISOString(), data: {} },
  { event_type: 'scan_completed', title: 'Scan Complete', description: '16 packages analyzed, 3 at risk', severity: 'info', timestamp: new Date(Date.now() - 120000).toISOString(), data: {} },
  { event_type: 'playbook_created', title: 'Playbook Generated', description: 'AI Council remediation for lodash', severity: 'info', timestamp: new Date(Date.now() - 180000).toISOString(), data: {} },
];

const mockPlaybook: Playbook = {
  id: 'pb-1', scan_id: 'demo', package_name: 'log4j-core',
  threat_summary: 'CVE-2021-44228 (Log4Shell) is a critical RCE vulnerability in Apache Log4j allowing attackers to execute arbitrary code via crafted log messages using JNDI lookups.',
  business_impact: 'All services using Java logging are at risk. Potential for complete system compromise, data exfiltration, and ransomware deployment. Blast radius: entire backend infrastructure.',
  trust_explanation: 'Trust score of 12/100 driven by: Critical CVE (-40), public exploit available (-20), high EPSS score 0.97 (-24). Only maintainer health (+15%) prevents score from reaching zero.',
  recommended_action: 'Immediately upgrade log4j-core from 2.14.1 to 2.17.1. This is a patch-level upgrade with no breaking changes. Apply WAF rules to block JNDI lookup patterns as interim mitigation.',
  compliance_mapping: { 'NIST CSF': 'Identify, Protect, Respond', 'MITRE ATT&CK': 'T1195 Supply Chain', 'OWASP': 'A06 Vulnerable Components', 'EU AI Act': 'N/A' },
  confidence_score: 94, evidence_citations: ['NVD CVE-2021-44228', 'GHSA-jfh8-c2jp-5v3q', 'OSV GHSA-jfh8'],
  created_at: new Date().toISOString(),
};

const mockDistribution: TrustDistribution = { trusted: 4, watch: 3, at_risk: 3 };

const mockAIHealth: AIHealthMetrics = {
  hallucination_rate: 2.1, unsafe_prompts_blocked: 14, total_prompts: 342,
  policy_violations: 3, ai_attack_attempts: 7, compliance_score: 94.5,
  safety_score: 91.2, jailbreak_resistance: 97.8, bias_score: 95.3,
};

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadSBOM(file);
      if (result.scan_id) {
        router.push(`/scan/${result.scan_id}`);
      }
    } catch {
      // On API error, navigate to demo scan
      router.push('/scan/demo-scan-id');
    } finally {
      setIsUploading(false);
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) handleFile(file);
  }, [handleFile]);

  const handleFixPackage = useCallback((packageName: string) => {
    alert(`Generating PR to fix ${packageName}...`);
  }, []);

  return (
    <main className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 bg-[#161B22] transition-all cursor-pointer text-center ${
              isDragOver ? 'border-[#00C896] bg-[#00C896]/10' : 'border-[#30363D] hover:border-[#00C896]/50'
            }`}
          >
            <UploadCloud size={40} className={isDragOver ? 'text-[#00C896] mx-auto' : 'text-[#8B949E] mx-auto'} />
            <p className="text-lg font-semibold mt-3">Upload SBOM to Begin Scan</p>
            <p className="text-sm text-[#8B949E] mt-1">Drag & drop CycloneDX or SPDX JSON, or click to browse</p>
            {isUploading && <p className="text-[#00C896] mt-3 animate-pulse font-medium">Uploading and initializing scan...</p>}
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }} />
          </div>
        </motion.div>

        {/* Dashboard Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
          <Shield className="text-[#00C896]" size={28} />
          <h2 className="text-2xl font-bold">Executive Dashboard</h2>
          <span className="text-sm text-[#8B949E] ml-auto">Live Demo Data</span>
        </motion.div>

        {/* Summary Row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SummaryRow totalPackages={16} atRiskCount={3} activeCVEs={5} openPRs={2} />
        </motion.div>

        {/* Two Column: Gauges + Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <CyberHealthGauge score={72} />
            <TrustDistributionChart distribution={mockDistribution} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <LiveFeed events={mockEvents} />
          </motion.div>
        </div>

        {/* Critical Packages */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <CriticalPackagesTable packages={mockPackages} onFix={handleFixPackage} />
        </motion.div>

        {/* AI Health */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <AIHealthPanel metrics={mockAIHealth} />
        </motion.div>

        {/* Playbooks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <h3 className="text-xl font-bold mb-4">AI Council Playbooks</h3>
          <PlaybookCard playbook={mockPlaybook} />
        </motion.div>

        {/* Feature Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 bg-[#161B22] rounded-xl border border-[#30363D] hover:border-[#00C896]/50 transition-colors">
            <h3 className="font-bold mb-2 text-[#00C896]">Adaptive Trust Graph</h3>
            <p className="text-sm text-[#8B949E]">Real-time dependency scoring using multi-dimensional threat intel from NVD, OSV, and GHSA.</p>
          </div>
          <div className="p-6 bg-[#161B22] rounded-xl border border-[#30363D] hover:border-[#F0A500]/50 transition-colors">
            <h3 className="font-bold mb-2 text-[#F0A500]">AI Governance & Safety</h3>
            <p className="text-sm text-[#8B949E]">Monitor LLM interactions, enforce policies, detect prompt injection, and audit every decision.</p>
          </div>
          <div className="p-6 bg-[#161B22] rounded-xl border border-[#30363D] hover:border-[#E84040]/50 transition-colors">
            <h3 className="font-bold mb-2 text-[#E84040]">Auto-Remediation</h3>
            <p className="text-sm text-[#8B949E]">8-agent AI Council generates playbooks and creates GitHub PRs with safe patch versions.</p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
