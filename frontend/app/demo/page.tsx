'use client';
import MultiTenantView from '@/components/demo/MultiTenantView';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#0D1117] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#E6EDF3] mb-2">Ecosystem Demo</h1>
        <p className="text-[#8B949E] mb-8">Observe how ThreatMesh X protects interconnected systems.</p>
        <MultiTenantView />
      </div>
    </main>
  );
}
