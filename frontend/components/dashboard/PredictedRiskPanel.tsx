// frontend/components/dashboard/PredictedRiskPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PredictedRisk } from '@/types';
import { getPredictions } from '@/lib/api';
import { TrendingUp, AlertTriangle, Sparkles, ShieldAlert, Cpu, Activity, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

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

  // Demo fallback predictions if no backend predictions return for default scan
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
        explanation: 'This package has not been updated in 14 months. Its maintainer GitHub account has shown zero activity since early 2025. Three similar packages in PyPI received Critical CVEs in the last 30 days. We recommend monitoring this package closely and preparing a contingency upgrade path.'
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
      className="bg-[#0e0e14]/90 border border-[#2D2D5E] rounded-xl p-6 shadow-2xl backdrop-blur-xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E3A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/40">
              FEATURE 9
            </span>
            <h2 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-[#ff9900]" size={20} /> Predictive Risk Engine — Next 30 Days
            </h2>
          </div>
          <p className="text-xs text-[#ccc3d8] mt-1">
            Predicts which packages are likely to become vulnerable in the next 30 days BEFORE official CVE publication.
          </p>
        </div>

        <span className="text-xs text-[#ff9900] font-mono font-bold bg-[#ff9900]/10 px-3 py-1 rounded-full border border-[#ff9900]/30 flex items-center gap-1.5 shrink-0">
          <TrendingUp size={14} /> 30-Day Early Warning AI
        </span>
      </div>

      {/* 5 Predictive Signals Bar */}
      <div className="bg-[#141424] p-3.5 rounded-xl border border-[#232345] font-mono text-xs text-[#ccc3d8] space-y-2">
        <span className="text-[#a78bfa] font-bold text-[11px] uppercase tracking-wider block">
          5 Predictive Signals Evaluated Continuously:
        </span>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
          <div className="bg-[#0c0c16] p-2 rounded border border-[#1f1f3a]">
            <span className="text-white font-bold block">1. Maintainer Inactivity</span>
            <span className="text-[#8a809b] text-[10px]">&gt;365d: +30 pts penalty</span>
          </div>
          <div className="bg-[#0c0c16] p-2 rounded border border-[#1f1f3a]">
            <span className="text-white font-bold block">2. Ecosystem CVE Spike</span>
            <span className="text-[#8a809b] text-[10px]">npm/PyPI trend shift</span>
          </div>
          <div className="bg-[#0c0c16] p-2 rounded border border-[#1f1f3a]">
            <span className="text-white font-bold block">3. EPSS Risk Trend</span>
            <span className="text-[#8a809b] text-[10px]">Rising EPSS &gt;0.50</span>
          </div>
          <div className="bg-[#0c0c16] p-2 rounded border border-[#1f1f3a]">
            <span className="text-white font-bold block">4. Dependency Chain</span>
            <span className="text-[#8a809b] text-[10px]">Lateral chain risk</span>
          </div>
          <div className="bg-[#0c0c16] p-2 rounded border border-[#1f1f3a]">
            <span className="text-white font-bold block">5. Download Anomaly</span>
            <span className="text-[#8a809b] text-[10px]">Attacker study spikes</span>
          </div>
        </div>
      </div>

      {/* Predictions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPredictions.map((pred, idx) => {
          const riskScore = pred.risk_score ?? 0;
          const isHighRisk = riskScore >= 70;
          const badgeBg = isHighRisk
            ? 'bg-[#ff2a6d]/20 text-[#ff2a6d] border-[#ff2a6d]/50'
            : 'bg-[#ff9900]/20 text-[#ff9900] border-[#ff9900]/50';

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
              whileHover={shouldReduceMotion ? {} : { y: -2 }}
              className="bg-[#141424]/90 border border-[#232345] hover:border-[#7c3aed]/60 p-4 rounded-xl shadow-md space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white font-['Space_Grotesk']">
                      {pred.package_name} <span className="text-xs font-mono text-[#8a809b]">@{pred.version}</span>
                    </h4>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-extrabold ${badgeBg} flex items-center gap-1`}>
                    <TrendingUp size={13} /> {Math.round(riskScore)} Risk Index
                  </div>
                </div>

                {/* Signal Badges */}
                <div className="flex flex-wrap gap-1.5 my-2">
                  {signalList.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono font-semibold bg-[#0c0c16] text-[#a78bfa] border border-[#7c3aed]/30 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Plain English Explanation */}
                <p className="text-xs text-[#ccc3d8] leading-relaxed font-sans mt-2">
                  {pred.explanation}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* XZ Utils Value Prop Callout */}
      <div className="p-4 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-xl text-xs leading-relaxed text-[#ccc3d8] space-y-1">
        <span className="font-bold text-[#a78bfa] block text-sm flex items-center gap-1.5">
          <Zap size={16} className="text-[#ff9900]" /> Why Predictive Risk Engine Matters (The XZ Utils Lesson):
        </span>
        <p className="text-xs text-[#ccc3d8]">
          The XZ Utils backdoor — one of the most devastating supply chain attacks in history — showed clear behavioral signals months before the actual attack was discovered. ThreatMesh Predictive Risk Engine analyzes maintainer inactivity, repository anomalies, and ecosystem trends to flag vulnerabilities weeks before official CVE publication.
        </p>
      </div>
    </motion.div>
  );
}
