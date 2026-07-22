'use client'

import React, { useState } from 'react';
import { Package } from '@/types';
import TrustScoreBadge from '../shared/TrustScoreBadge';
import { GitPullRequest } from 'lucide-react';

interface Props {
  packages: Package[];
  onFix: (packageName: string) => Promise<void>;
}

export default function CriticalPackagesTable({ packages, onFix }: Props) {
  const [fixing, setFixing] = useState<Record<string, boolean>>({});

  if (packages.length === 0) {
    return (
      <div className="bg-card border border-border p-6 rounded-xl flex items-center justify-center text-text-secondary">
        No critical packages found.
      </div>
    );
  }

  const handleFix = async (pkgName: string) => {
    setFixing(prev => ({ ...prev, [pkgName]: true }));
    try {
      await onFix(pkgName);
    } finally {
      setFixing(prev => ({ ...prev, [pkgName]: false }));
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-bold">Critical Packages</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-background text-text-secondary text-sm uppercase">
            <tr>
              <th className="px-6 py-3">Package</th>
              <th className="px-6 py-3">Version</th>
              <th className="px-6 py-3">Ecosystem</th>
              <th className="px-6 py-3">Trust Score</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {packages.map(pkg => (
              <tr key={pkg.id} className="hover:bg-border/30 transition-colors">
                <td className="px-6 py-4 font-medium">{pkg.name}</td>
                <td className="px-6 py-4 text-text-secondary">{pkg.version}</td>
                <td className="px-6 py-4 text-text-secondary">{pkg.ecosystem}</td>
                <td className="px-6 py-4">
                  <TrustScoreBadge score={pkg.trust_score} size="sm" />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleFix(pkg.name)}
                    disabled={fixing[pkg.name]}
                    className="inline-flex items-center space-x-1 bg-accent text-background px-3 py-1.5 rounded text-sm font-bold disabled:opacity-50 hover:bg-accent/80 transition-colors"
                  >
                    <GitPullRequest className="w-4 h-4" />
                    <span>{fixing[pkg.name] ? 'Fixing...' : 'Fix'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
