'use client';
import { GovernanceEvent } from '@/types';

export default function AuditLog({ events }: { events: GovernanceEvent[] }) {
  return (
    <div className="bg-[#161B22] rounded-lg border border-[#30363D] p-6 text-[#E6EDF3]">
      <h2 className="text-lg font-semibold mb-4">Recent Audit Events</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#8B949E] uppercase bg-[#0D1117]">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Timestamp</th>
              <th className="px-4 py-3">Event Type</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3 rounded-tr-lg">Prompt</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-[#30363D] hover:bg-[#0D1117]">
                <td className="px-4 py-3">{new Date(event.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">{event.event_type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${event.policy_result === 'allowed' ? 'bg-[#00C896] text-[#0D1117]' : event.policy_result === 'blocked' ? 'bg-[#E84040] text-white' : 'bg-[#F0A500] text-[#0D1117]'}`}>
                    {event.policy_result.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 truncate max-w-[200px]">{event.prompt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
