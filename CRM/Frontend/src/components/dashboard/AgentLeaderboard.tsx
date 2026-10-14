import React from 'react';
export function AgentLeaderboard() {
  const agents = [
    { name: 'Raghav (Super Admin)', calls: 142, aht: '04:12', csat: '4.9', sla: '98%' },
    { name: 'Mani (Care)', calls: 128, aht: '03:45', csat: '4.8', sla: '96%' },
    { name: 'Barani (Support)', calls: 115, aht: '04:30', csat: '4.7', sla: '95%' },
    { name: 'Arun M. (Sales)', calls: 95, aht: '05:10', csat: '4.5', sla: '90%' },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm h-[220px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white">Agent Performance</h3>
        <select className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
          <option>Today</option>
          <option>This Week</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase text-slate-500 bg-[#111] sticky top-0">
            <tr>
              <th className="py-2 px-2 font-medium">Agent</th>
              <th className="py-2 px-2 font-medium text-right">Calls</th>
              <th className="py-2 px-2 font-medium text-right">AHT</th>
              <th className="py-2 px-2 font-medium text-right">CSAT</th>
              <th className="py-2 px-2 font-medium text-right">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {agents.map((agent, i) => (
              <tr key={i} className="hover:bg-[#111] transition-colors">
                <td className="py-2.5 px-2 text-slate-300 text-xs font-medium">{agent.name}</td>
                <td className="py-2.5 px-2 text-slate-400 text-xs text-right">{agent.calls}</td>
                <td className="py-2.5 px-2 text-slate-400 text-xs text-right font-mono">{agent.aht}</td>
                <td className="py-2.5 px-2 text-primary text-xs text-right font-bold">{agent.csat}</td>
                <td className="py-2.5 px-2 text-emerald-500 text-xs text-right font-bold">{agent.sla}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
