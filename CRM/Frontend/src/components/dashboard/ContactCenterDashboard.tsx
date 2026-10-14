import React, { useState, useEffect } from 'react';
import { Phone, Clock, Users, Play, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ContactCenterDashboardProps {
  metrics: any;
  totalAgents: number;
}

export function ContactCenterDashboard({ metrics, totalAgents }: ContactCenterDashboardProps) {
  const [dashboardData, setDashboardData] = useState<{ activeCalls: any[], queuedCalls: any[], missedCalls: any[] }>({
    activeCalls: [],
    queuedCalls: [],
    missedCalls: []
  });

  useEffect(() => {
    const fetchDashboardCalls = async () => {
      try {
        const res = await apiFetch('/api/v1/telephony/dashboard-calls');
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard calls:', err);
      }
    };
    
    fetchDashboardCalls();
    const interval = setInterval(fetchDashboardCalls, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Real-time stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Live Active Calls</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{dashboardData.activeCalls.length}</span>
          </div>
          <Phone className="w-8 h-8 text-orange-500" />
        </div>
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Waiting in Queue</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{dashboardData.queuedCalls.length}</span>
          </div>
          <Clock className="w-8 h-8 text-blue-500" />
        </div>
        <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Available Agents</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{totalAgents}</span>
          </div>
          <Users className="w-8 h-8 text-emerald-500" />
        </div>
      </div>

      {/* Call monitor list */}
      <div className="bg-[#0b0b0b] border border-[#1e1e1e] p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Play className="w-4 h-4 text-orange-500" /> Live Agent Call Monitoring Panel</h3>
        <div className="divide-y divide-[#1c1c1c]/50">
          
          {dashboardData.activeCalls.length === 0 && (
             <div className="py-4 text-center text-xs text-slate-500">No active calls right now.</div>
          )}
          
          {dashboardData.activeCalls.map(call => {
            const agent = call.participants?.find((p: any) => p.role === 'AGENT')?.agent?.user;
            const agentName = agent?.name || 'Agent';
            // calculate duration
            const diff = call.startedAt ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000) : 0;
            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
            const secs = (diff % 60).toString().padStart(2, '0');

            return (
              <div key={call.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 w-1/3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-bold truncate">{agentName}</span>
                </div>
                <div className="text-slate-400 w-1/3 text-center truncate">
                  Customer: {call.customer?.name || call.customer?.phone || 'Unknown'}
                </div>
                <div className="flex items-center gap-3 w-1/3 justify-end">
                  <span className="text-slate-400 font-mono">({mins}:{secs})</span>
                  <button className="px-2.5 py-1 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-lg font-bold text-[10px] uppercase text-orange-500 transition-colors">Listen</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
