'use client';
import { Handle, Position } from 'reactflow';
import { Package } from '@/types';

interface PackageNodeProps {
  data: {
    label: string;
    package: Package;
    trustScore: { score: number };
    dependentCount: number;
  };
}

export default function PackageNode({ data }: PackageNodeProps) {
  const { label, package: pkg, trustScore, dependentCount } = data;
  const score = trustScore?.score || 0;
  
  let borderColor = '#E84040';
  if (score >= 80) borderColor = '#00C896';
  else if (score >= 50) borderColor = '#F0A500';

  const baseSize = 60;
  const size = Math.min(100, baseSize + (dependentCount * 5));
  const isAtRisk = score < 50;

  return (
    <div 
      className={`relative flex flex-col items-center justify-center bg-[#161B22] text-[#E6EDF3] rounded-lg p-2 border-2 shadow-lg transition-transform hover:scale-105`}
      style={{
        width: size,
        height: size,
        borderColor: borderColor,
        boxShadow: isAtRisk ? `0 0 15px ${borderColor}80` : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#8B949E]" />
      
      <div className="text-xs font-bold truncate w-full text-center" title={label}>
        {label}
      </div>
      <div className="text-[10px] text-[#8B949E] mt-1 truncate">
        {pkg.version}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-[#8B949E] mt-1">
        {pkg.ecosystem}
      </div>
      
      <div 
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0D1117]"
        style={{ backgroundColor: borderColor }}
      >
        {score}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-[#8B949E]" />
    </div>
  );
}
