'use client';
import { Package, CVERecord, TrustScore, Playbook } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PackageSidePanelProps {
  package: Package | null;
  cves: CVERecord[];
  trustScore: TrustScore | null;
  playbook: Playbook | null;
  onClose: () => void;
}

export default function PackageSidePanel({ package: pkg, cves, trustScore, playbook, onClose }: PackageSidePanelProps) {
  if (!pkg) return null;

  const score = trustScore?.score || pkg.trust_score || 0;
  let scoreColor = '#E84040';
  if (score >= 80) scoreColor = '#00C896';
  else if (score >= 50) scoreColor = '#F0A500';

  const chartData = trustScore?.breakdown ? [
    { name: 'CVE', value: trustScore.breakdown.cve_impact },
    { name: 'EPSS', value: trustScore.breakdown.epss_risk },
    { name: 'Exploit', value: trustScore.breakdown.exploit_risk },
    { name: 'Health', value: trustScore.breakdown.maintainer_health },
    { name: 'Release', value: trustScore.breakdown.release_cadence },
  ] : [];

  return (
    <AnimatePresence>
      {pkg && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 right-0 h-full w-96 bg-[#161B22] border-l border-[#30363D] shadow-2xl p-6 overflow-y-auto z-50 text-[#E6EDF3]"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-[#8B949E] hover:text-[#E6EDF3]">
            <X size={24} />
          </button>

          <div className="mt-8 border-b border-[#30363D] pb-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold truncate pr-4">{pkg.name}</h2>
              <div 
                className="px-3 py-1 rounded-full text-sm font-bold text-[#0D1117]"
                style={{ backgroundColor: scoreColor }}
              >
                {score}
              </div>
            </div>
            <div className="text-[#8B949E] flex gap-3 text-sm">
              <span>{pkg.version}</span>
              <span className="uppercase">{pkg.ecosystem}</span>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-4">Trust Score Breakdown</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#8B949E', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#30363D' }} contentStyle={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#E6EDF3' }} />
                    <Bar dataKey="value" fill={scoreColor} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {playbook && (
            <div className="mb-6 bg-[#0D1117] p-4 rounded-lg border border-[#30363D]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-3">
                <ShieldAlert size={16} className="text-[#E84040]" />
                AI Council Verdict
              </h3>
              <p className="text-sm text-[#E6EDF3] mb-3">{playbook.threat_summary}</p>
              <div className="bg-[#161B22] p-3 rounded border border-[#30363D]">
                <span className="text-xs text-[#00C896] font-semibold block mb-1">RECOMMENDED ACTION</span>
                <p className="text-sm">{playbook.recommended_action}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#8B949E] uppercase tracking-wider mb-4">Vulnerabilities ({cves.length})</h3>
            {cves.length === 0 ? (
              <p className="text-sm text-[#8B949E]">No known vulnerabilities.</p>
            ) : (
              <div className="space-y-3">
                {cves.map((cve) => (
                  <div key={cve.cve_id} className="bg-[#0D1117] p-3 rounded-lg border border-[#30363D]">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-[#E84040]">{cve.cve_id}</span>
                      <span className="text-xs bg-[#E84040] text-[#0D1117] px-2 py-0.5 rounded font-bold">
                        CVSS {cve.cvss_score}
                      </span>
                    </div>
                    <p className="text-xs text-[#8B949E] line-clamp-3">{cve.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
