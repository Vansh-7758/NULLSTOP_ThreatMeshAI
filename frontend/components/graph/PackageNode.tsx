// frontend/components/graph/PackageNode.tsx
'use client';

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Package } from '@/types';
import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import { Skull, GitPullRequest } from 'lucide-react';

interface PackageNodeProps {
  data: {
    label?: string;
    package: Package;
    trustScore?: number;
    hasAttackPath?: boolean;
    hasPendingPR?: boolean;
    isRescoring?: boolean;
  };
  selected?: boolean;
}

function PackageNode({ data, selected }: PackageNodeProps) {
  const pkg = data.package;
  const score = data.trustScore ?? pkg?.trust_score ?? 100;
  const hasAttackPath = data.hasAttackPath ?? false;
  const hasPendingPR = data.hasPendingPR ?? false;
  const isRescoring = data.isRescoring ?? false;

  const name = pkg?.name || data.label || 'Unknown';
  const version = pkg?.version || '1.0.0';
  const ecosystem = (pkg?.ecosystem || 'unknown').toLowerCase();

  const truncatedName = name.length > 18 ? `${name.slice(0, 16)}...` : name;

  // Border color logic
  let borderColor = '#30363D';
  if (score < 50) borderColor = '#E84040';
  else if (score < 80) borderColor = '#F0A500';
  else borderColor = '#00C896';

  // Ecosystem pill colors
  const getEcosystemBadgeClass = (eco: string) => {
    if (eco === 'npm') return 'bg-[#E84040]/15 text-[#E84040] border-[#E84040]/30';
    if (eco === 'pypi') return 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30';
    if (eco === 'maven') return 'bg-[#F0A500]/15 text-[#F0A500] border-[#F0A500]/30';
    if (eco === 'golang' || eco === 'go') return 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30';
    return 'bg-[#8B949E]/15 text-[#8B949E] border-[#8B949E]/30';
  };

  return (
    <div
      className={`w-[180px] h-[80px] bg-[#161B22] rounded-lg p-2.5 flex flex-col justify-between relative shadow-md transition-all select-none ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0D1117]' : ''
      } ${isRescoring ? 'animate-pulse' : ''}`}
      style={{
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: selected ? '#E6EDF3' : borderColor
      }}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-[#8B949E] border-2 border-[#0D1117]"
      />

      {/* Top Row: Name & Icons */}
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col pr-1 overflow-hidden">
          <span className="text-[13px] font-bold text-[#E6EDF3] leading-snug truncate" title={name}>
            {truncatedName}
          </span>
          <span className="text-[11px] font-mono text-[#8B949E] leading-none mt-0.5">v{version}</span>
        </div>

        {/* Top Right Badges/Icons */}
        <div className="flex items-center gap-1">
          {hasAttackPath && (
            <div title="Attack Path Reachable">
              <Skull size={14} className="text-[#E84040] animate-bounce" />
            </div>
          )}
          {hasPendingPR && (
            <div title="Pending Remediation PR">
              <GitPullRequest size={14} className="text-[#00C896]" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Ecosystem Pill & Trust Score */}
      <div className="flex items-end justify-between w-full mt-auto">
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getEcosystemBadgeClass(ecosystem)}`}>
          {ecosystem}
        </span>
        <TrustScoreBadge score={score} size="sm" />
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-[#8B949E] border-2 border-[#0D1117]"
      />
    </div>
  );
}

export default memo(PackageNode);
