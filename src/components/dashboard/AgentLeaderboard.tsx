import React from 'react';

export function AgentLeaderboard({ data }: { data?: any }) {
  const agents: any[] = data?.metrics?.agentLeaderboard || data?.charts?.agentLeaderboard || [];

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm h-[220px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white">Agent Performance</h3>
        <select aria-label="Leaderboard timeframe filter" className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
          <option>Today</option>
          <option>This Week</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {agents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No agent performance data recorded for this period.
          </div>
        ) : (
          <table aria-label="Agent performance leaderboard table" className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase text-slate-500 bg-[#111] sticky top-0">
              <tr>
                <th scope="col" className="py-2 px-2 font-medium">Agent</th>
                <th scope="col" className="py-2 px-2 font-medium text-right">Calls</th>
                <th scope="col" className="py-2 px-2 font-medium text-right">AHT</th>
                <th scope="col" className="py-2 px-2 font-medium text-right">CSAT</th>
                <th scope="col" className="py-2 px-2 font-medium text-right">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {agents.map((agent, i) => (
                <tr key={i} className="hover:bg-[#111] transition-colors">
                  <td className="py-2.5 px-2 text-slate-300 text-xs font-medium">{agent.name}</td>
                  <td className="py-2.5 px-2 text-slate-400 text-xs text-right">{agent.calls ?? 0}</td>
                  <td className="py-2.5 px-2 text-slate-400 text-xs text-right font-mono">{agent.aht || '0m'}</td>
                  <td className="py-2.5 px-2 text-primary text-xs text-right font-bold">{agent.csat || '5.0'}</td>
                  <td className="py-2.5 px-2 text-emerald-500 text-xs text-right font-bold">{agent.sla || '100%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
