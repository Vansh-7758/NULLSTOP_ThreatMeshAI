// frontend/components/dashboard/PredictedRiskPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PredictedRisk } from '@/types';
import { getPredictions } from '@/lib/api';
import { TrendingUp, Sparkles, Zap } from 'lucide-react';

interface PredictedRiskPanelProps {
  scanId?: string;
  initialPredictions?: PredictedRisk[];
  loading?: boolean;
  error?: string | null;
}

export default function PredictedRiskPanel({
  scanId = 'default',
  initialPredictions,
  loading: initialLoading = false,
  error: initialError = null
}: PredictedRiskPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const [predictions, setPredictions] = useState<PredictedRisk[]>(initialPredictions || []);
  const [loading, setLoading] = useState<boolean>(!initialPredictions && initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  useEffect(() => {
    if (initialPredictions && initialPredictions.length > 0) {
      setPredictions(initialPredictions);
      setLoading(false);
    } else if (scanId) {
      setLoading(true);
      getPredictions(scanId)
        .then((data) => {
          setPredictions(data || []);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch predictions');
        })
        .finally(() => setLoading(false));
    }
  }, [scanId, initialPredictions]);

  const displayPredictions = React.useMemo(() => {
    if (predictions && predictions.length > 0) return predictions;
    if (scanId !== 'default') return [];

    return [
      {
        package_name: 'reqeusts',
        version: '2.28.1',
        risk_score: 88.5,
        signals: {
          days_since_commit: 410,
          days_since_commit_penalty: 30,
          ecosystem_cve_trend: 42,
          epss_trend_signal: 20,
          dependency_chain_risk: 15,
          download_volume_anomaly: 'High Spikes (+340%)'
        },
        explanation: 'This package has not been updated in 14 months. Maintainer GitHub account has shown zero activity since early 2025. Three similar packages in PyPI received Critical CVEs in the last 30 days. We recommend monitoring closely.'
      },
      {
        package_name: 'crossenv',
        version: '7.0.3',
        risk_score: 82.0,
        signals: {
          days_since_commit: 520,
          days_since_commit_penalty: 30,
          ecosystem_cve_trend: 38,
          epss_trend_signal: 20,
          dependency_chain_risk: 10,
          download_volume_anomaly: 'Unusual Download Spike'
        },
        explanation: 'Typosquatting risk pattern detected. High ecosystem CVE frequency (+38 new CVEs in 30 days) and dormant repository inactivity (+520 days without commits).'
      },
      {
        package_name: 'Pillow',
        version: '9.0.0',
        risk_score: 64.0,
        signals: {
          days_since_commit: 180,
          days_since_commit_penalty: 15,
          ecosystem_cve_trend: 25,
          epss_trend_signal: 20,
          dependency_chain_risk: 10,
          download_volume_anomaly: 'Normal'
        },
        explanation: 'Rising EPSS trend detected for buffer overflow vector in image parser module. Attacker interest in this vulnerability class is growing week-over-week.'
      },
      {
        package_name: 'event-stream',
        version: '3.3.6',
        risk_score: 76.0,
        signals: {
          days_since_commit: 680,
          days_since_commit_penalty: 30,
          ecosystem_cve_trend: 40,
          epss_trend_signal: 20,
          dependency_chain_risk: 15,
          download_volume_anomaly: 'Spike Detected'
        },
        explanation: 'Historical backdoor pattern and abandoned maintainer activity. High probability of targeted supply chain exploit attempt within 30 days.'
      }
    ];
  }, [predictions, scanId]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6 lg:p-8 space-y-6 relative overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #ED9E58, #9A5FFD, transparent)' }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(233,188,185,0.20)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(237,158,88,0.15)] text-[#ED9E58] border border-[rgba(237,158,88,0.35)]">
              FEATURE 9
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-[#ED9E58]" size={20} /> PREDICTIVE RISK ENGINE — NEXT 30 DAYS
            </h2>
          </div>
          <p className="text-xs text-[#CBD5E1] font-sans">
            Predicts which packages are likely to become vulnerable in the next 30 days BEFORE official CVE publication.
          </p>
        </div>

        <span className="text-xs text-[#ED9E58] font-mono font-bold bg-[rgba(237,158,88,0.15)] px-3.5 py-1.5 rounded-full border border-[rgba(237,158,88,0.35)] flex items-center gap-1.5 shrink-0 shadow-[0_0_20px_rgba(237,158,88,0.20)]">
          <TrendingUp size={14} /> 30-Day Early Warning AI
        </span>
      </div>

      <div className="bg-[rgba(27,25,49,0.92)] p-4 rounded-xl border border-[rgba(233,188,185,0.25)] font-mono text-xs text-white space-y-3">
        <span className="text-[#ED9E58] font-extrabold text-[11px] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">
          5 Predictive Signals Evaluated Continuously:
        </span>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-[11px]">
          <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-lg border border-[rgba(233,188,185,0.20)]">
            <span className="text-white font-bold block mb-0.5">1. Maintainer Inactivity</span>
            <span className="text-[#ED9E58] text-[10px] font-mono">&gt;365d: +30 pts penalty</span>
          </div>
          <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-lg border border-[rgba(233,188,185,0.20)]">
            <span className="text-white font-bold block mb-0.5">2. Ecosystem CVE Spike</span>
            <span className="text-[#ED9E58] text-[10px] font-mono">npm/PyPI trend shift</span>
          </div>
          <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-lg border border-[rgba(233,188,185,0.20)]">
            <span className="text-white font-bold block mb-0.5">3. EPSS Risk Trend</span>
            <span className="text-[#ED9E58] text-[10px] font-mono">Rising EPSS &gt;0.50</span>
          </div>
          <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-lg border border-[rgba(233,188,185,0.20)]">
            <span className="text-white font-bold block mb-0.5">4. Dependency Chain</span>
            <span className="text-[#ED9E58] text-[10px] font-mono">Lateral chain risk</span>
          </div>
          <div className="bg-[rgba(11,13,27,0.80)] p-2.5 rounded-lg border border-[rgba(233,188,185,0.20)]">
            <span className="text-white font-bold block mb-0.5">5. Download Anomaly</span>
            <span className="text-[#ED9E58] text-[10px] font-mono">Attacker study spikes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPredictions.map((pred, idx) => {
          const riskScore = pred.risk_score ?? 0;
          const isHighRisk = riskScore >= 70;
          const badgeBg = isHighRisk
            ? 'bg-[rgba(239,68,68,0.20)] text-[#ef4444] border-[rgba(239,68,68,0.40)]'
            : 'bg-[rgba(237,158,88,0.20)] text-[#ED9E58] border-[rgba(237,158,88,0.40)]';

          const signalList = [];
          if (pred.signals) {
            if (Number(pred.signals.days_since_commit || pred.signals.days_since_commit_penalty) > 100) signalList.push('Inactive Maintainer (>365d)');
            if (Number(pred.signals.ecosystem_cve_trend) > 20) signalList.push('Ecosystem CVE Spike');
            if (Number(pred.signals.epss_trend_signal) > 0) signalList.push('Rising EPSS Trend');
            if (pred.signals.download_volume_anomaly && pred.signals.download_volume_anomaly !== 'Normal') signalList.push('Download Spike Anomaly');
          }
          if (signalList.length === 0) signalList.push('Early Warning Risk Signal');

          return (
            <motion.div
              key={pred.package_name + idx}
              whileHover={shouldReduceMotion ? {} : { y: -3 }}
              className="glass-card p-5 rounded-xl space-y-3 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-base font-extrabold text-white font-['Plus_Jakarta_Sans'] group-hover:text-[#ED9E58] transition-colors">
                    {pred.package_name} <span className="text-xs font-mono text-[#ED9E58]">@{pred.version}</span>
                  </h4>
                  <div className={`px-3 py-1 rounded-lg border text-xs font-mono font-extrabold ${badgeBg} flex items-center gap-1.5`}>
                    <TrendingUp size={13} /> {Math.round(riskScore)} Risk Index
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 my-2">
                  {signalList.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono font-bold bg-[rgba(154,95,253,0.18)] text-[#9A5FFD] border border-[rgba(154,95,253,0.35)] px-2.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-[#CBD5E1] leading-relaxed font-sans mt-2">
                  {pred.explanation}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 bg-[rgba(237,158,88,0.12)] border border-[rgba(237,158,88,0.30)] rounded-xl text-xs leading-relaxed text-[#F8FAFC] space-y-1">
        <span className="font-extrabold text-[#ED9E58] block text-sm flex items-center gap-1.5 font-['Plus_Jakarta_Sans']">
          <Zap size={16} className="text-[#ED9E58]" /> Why Predictive Risk Engine Matters (The XZ Utils Lesson):
        </span>
        <p className="text-xs text-[#CBD5E1] leading-relaxed font-sans">
          The XZ Utils backdoor — one of the most devastating supply chain attacks in history — showed clear behavioral signals months before the actual attack was discovered. ThreatMesh Predictive Risk Engine analyzes maintainer inactivity, repository anomalies, and ecosystem trends to flag vulnerabilities weeks before official CVE publication.
        </p>
      </div>
    </motion.div>
  );
}
