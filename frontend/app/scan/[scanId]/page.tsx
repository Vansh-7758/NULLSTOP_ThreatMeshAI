'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import DependencyGraph from '@/components/graph/DependencyGraph';
import PackageSidePanel from '@/components/graph/PackageSidePanel';
import AttackReplayTimeline from '@/components/timeline/AttackReplayTimeline';
import PlaybookCard from '@/components/dashboard/PlaybookCard';
import { Package, AttackPath, Playbook } from '@/types';
import { getScanStatus, getScanResults } from '@/lib/api';

const mockPackages: Package[] = [
  { id: '1', name: 'log4j-core', version: '2.14.1', ecosystem: 'maven', purl: null, node_type: 'package', trust_score: 12, first_seen: '', dependencies: [] },
  { id: '2', name: 'lodash', version: '4.17.20', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 35, first_seen: '', dependencies: [] },
  { id: '3', name: 'Pillow', version: '9.0.0', ecosystem: 'pypi', purl: null, node_type: 'package', trust_score: 42, first_seen: '', dependencies: [] },
  { id: '4', name: 'axios', version: '0.21.1', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 65, first_seen: '', dependencies: [] },
  { id: '5', name: 'express', version: '4.17.1', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 72, first_seen: '', dependencies: ['2', '4'] },
  { id: '6', name: 'react', version: '18.2.0', ecosystem: 'npm', purl: null, node_type: 'package', trust_score: 95, first_seen: '', dependencies: ['2'] },
];

const mockAttackPaths: AttackPath[] = [
  { id: 'p1', scan_id: 'demo', source_package: '6', target_package: '1', path: ['6', '5', '1'], path_length: 3, attack_type: 'indirect_cve' }
];

const mockPlaybook: Playbook = {
  id: 'pb-1', scan_id: 'demo', package_name: 'log4j-core',
  threat_summary: 'CVE-2021-44228 (Log4Shell) is a critical RCE vulnerability in Apache Log4j allowing attackers to execute arbitrary code.',
  business_impact: 'Complete system compromise potential. Blast radius: entire backend infrastructure.',
  trust_explanation: 'Trust score of 12/100 driven by Critical CVE (-40), public exploit (-20).',
  recommended_action: 'Immediately upgrade log4j-core to 2.17.1.',
  compliance_mapping: { 'NIST CSF': 'Identify, Protect, Respond' },
  confidence_score: 94, evidence_citations: ['NVD CVE-2021-44228'],
  created_at: new Date().toISOString(),
};

export default function ScanPage({ params }: { params: { scanId: string } }) {
  const [status, setStatus] = useState<'scanning' | 'completed' | 'error'>('scanning');
  const [progress, setProgress] = useState(0);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [timelineActive, setTimelineActive] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [attackPaths, setAttackPaths] = useState<AttackPath[]>([]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    const fetchStatus = async () => {
      try {
        const scanStatus = await getScanStatus(params.scanId);
        if (scanStatus.status === 'completed') {
          setStatus('completed');
          const results = await getScanResults(params.scanId);
          setPackages(results.packages || mockPackages);
          setAttackPaths(results.attack_paths || mockAttackPaths);
          setTimelineActive(true);
        } else if (scanStatus.status === 'failed') {
          setStatus('error');
        } else {
          setProgress(scanStatus.progress || Math.min(progress + 10, 90));
        }
      } catch {
        // Fallback to mock data progression
        progressInterval = setInterval(() => {
          setProgress(p => {
            if (p >= 100) {
              clearInterval(progressInterval);
              setStatus('completed');
              setPackages(mockPackages);
              setAttackPaths(mockAttackPaths);
              setTimeout(() => setTimelineActive(true), 1000);
              return 100;
            }
            return p + 20;
          });
        }, 1000);
      }
    };

    if (status === 'scanning') {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => { clearInterval(interval); clearInterval(progressInterval); };
    }
  }, [params.scanId, status]);

  if (status === 'scanning') {
    return (
      <main className="min-h-screen bg-[#0D1117] flex items-center justify-center text-[#E6EDF3]">
        <div className="max-w-md w-full p-8 bg-[#161B22] rounded-xl border border-[#30363D] text-center">
          <Loader size={48} className="text-[#00C896] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Analyzing SBOM</h2>
          <p className="text-[#8B949E] mb-6">Evaluating dependencies against NVD, OSV, and ThreatMesh AI...</p>
          <div className="h-2 bg-[#0D1117] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#00C896]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-2 text-sm text-[#8B949E]">{progress}% Complete</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1117] p-8 text-[#E6EDF3]">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-[#30363D] pb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-[#00C896]" size={32} />
              <h1 className="text-3xl font-bold">Scan Complete</h1>
            </div>
            <p className="text-[#8B949E]">Scan ID: {params.scanId}</p>
          </div>
          <button 
            onClick={() => setTimelineActive(true)}
            className="bg-[#00C896]/10 text-[#00C896] hover:bg-[#00C896] hover:text-[#0D1117] border border-[#00C896]/50 px-6 py-2 rounded-lg font-bold transition-all"
          >
            Replay Attack Vector
          </button>
        </motion.header>

        <AnimatePresence>
          {timelineActive && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <AttackReplayTimeline active={timelineActive} onReplay={() => setTimelineActive(true)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="text-[#00C896]" size={20} />
              Dependency Graph
            </h2>
            <div className="h-[600px] bg-[#161B22] rounded-xl border border-[#30363D] overflow-hidden">
              <DependencyGraph 
                packages={packages} 
                attackPaths={attackPaths} 
                onNodeClick={setSelectedPkg} 
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="text-[#F0A500]" size={20} />
              AI Playbooks
            </h2>
            <PlaybookCard playbook={mockPlaybook} />
            
            <div className="bg-[#161B22] rounded-xl p-6 border border-[#30363D]">
              <h3 className="font-bold mb-4">Risk Predictions</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
                  <span className="text-sm">log4j-core</span>
                  <span className="px-2 py-1 text-xs font-bold bg-[#E84040]/20 text-[#E84040] rounded-full">Critical Risk</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#0D1117] rounded-lg border border-[#30363D]">
                  <span className="text-sm">lodash</span>
                  <span className="px-2 py-1 text-xs font-bold bg-[#F0A500]/20 text-[#F0A500] rounded-full">High Risk</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <PackageSidePanel 
          package={selectedPkg}
          cves={[]}
          trustScore={{ score: selectedPkg?.trust_score || 0, breakdown: { cve_impact: 10, epss_risk: 5, exploit_risk: 0, maintainer_health: 80, release_cadence: 90 }, package_name: '', version: '', node_type: 'package', computed_at: '' }}
          playbook={null}
          onClose={() => setSelectedPkg(null)}
        />
      </div>
    </main>
  );
}
