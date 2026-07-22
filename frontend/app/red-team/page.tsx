'use client';
import RedTeamDashboard from '@/components/red-team/RedTeamDashboard';

export default function RedTeamPage() {
  return (
    <main className="min-h-screen bg-[#0D1117] p-8">
      <div className="max-w-6xl mx-auto">
        <RedTeamDashboard />
      </div>
    </main>
  );
}
