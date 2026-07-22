'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const initialTenants = [
  { id: '1', name: 'Fintech App', type: 'Financial', score: 92, pkgs: 1200, atRisk: 5 },
  { id: '2', name: 'Healthcare App', type: 'Medical', score: 88, pkgs: 850, atRisk: 2 },
  { id: '3', name: 'SaaS Platform', type: 'Enterprise', score: 95, pkgs: 2100, atRisk: 8 },
];

export default function MultiTenantView() {
  const [tenants, setTenants] = useState(initialTenants);
  const [attacking, setAttacking] = useState(false);

  const simulateAttack = () => {
    setAttacking(true);
    
    setTimeout(() => {
      setTenants(prev => prev.map(t => t.id === '1' ? { ...t, score: 45, atRisk: t.atRisk + 12 } : t));
    }, 500);

    setTimeout(() => {
      setTenants(prev => prev.map(t => t.id === '2' ? { ...t, score: 62, atRisk: t.atRisk + 12 } : t));
    }, 1200);

    setTimeout(() => {
      setTenants(prev => prev.map(t => t.id === '3' ? { ...t, score: 58, atRisk: t.atRisk + 12 } : t));
      setTimeout(() => setAttacking(false), 2000);
    }, 1900);
  };

  return (
    <div className="space-y-8 text-[#E6EDF3]">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Multi-Tenant Impact Simulation</h2>
        <button 
          onClick={simulateAttack}
          disabled={attacking}
          className="bg-[#E84040] hover:bg-[#c93232] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          Simulate Supply Chain Attack
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-[#161B22] p-6 rounded-lg border border-[#30363D]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{tenant.name}</h3>
                <span className="text-xs text-[#8B949E] uppercase tracking-wider">{tenant.type}</span>
              </div>
              <motion.div 
                animate={{ color: tenant.score < 70 ? '#E84040' : '#00C896' }}
                className="text-3xl font-black"
              >
                {tenant.score}
              </motion.div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8B949E]">Total Packages</span>
                <span className="font-semibold">{tenant.pkgs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8B949E]">At-Risk Packages</span>
                <motion.span 
                  animate={{ color: tenant.atRisk > 10 ? '#E84040' : '#E6EDF3' }}
                  className="font-semibold"
                >
                  {tenant.atRisk}
                </motion.span>
              </div>
            </div>
            
            <AnimatePresence>
              {tenant.score < 70 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-3 bg-[#E84040]/10 border border-[#E84040]/30 rounded text-[#E84040] text-sm flex items-start gap-2"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Trust score plummeted due to compromised shared dependency (React).</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {attacking && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0D1117] p-4 rounded-lg border border-[#F0A500] text-[#F0A500] text-center font-medium"
        >
          One package compromised in Fintech immediately lowers trust across Healthcare and SaaS — the collaborative value of the shared AADTG layer.
        </motion.div>
      )}
    </div>
  );
}
