'use client';

interface SafetyScoreCardProps {
  testType: string;
  status: string;
  score: number;
  details: string;
}

export default function SafetyScoreCard({ testType, status, score, details }: SafetyScoreCardProps) {
  let color = '#E84040'; // failed
  if (status === 'passed') color = '#00C896';
  else if (status === 'warning') color = '#F0A500';

  return (
    <div 
      className="bg-[#161B22] p-5 rounded-lg border-2"
      style={{ borderColor: `${color}40` }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">{testType}</h3>
        <span 
          className="text-xs px-2 py-1 rounded font-bold uppercase"
          style={{ backgroundColor: color, color: '#0D1117' }}
        >
          {status}
        </span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-[#8B949E] mb-1">
          <span>Score</span>
          <span>{score}/100</span>
        </div>
        <div className="w-full bg-[#30363D] h-2 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full" 
            style={{ width: `${score}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
      <p className="text-xs text-[#8B949E] mt-3">{details}</p>
    </div>
  );
}
