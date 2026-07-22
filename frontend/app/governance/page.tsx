'use client';
import GovernanceDashboard from '@/components/governance/GovernanceDashboard';

export default function GovernancePage() {
  return (
    <main className="min-h-screen bg-[#0D1117] p-8">
      <div className="max-w-6xl mx-auto">
        <GovernanceDashboard />
      </div>
    </main>
  );
}
