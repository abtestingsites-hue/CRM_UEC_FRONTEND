import React from 'react';
import { PhoneCall, Users, Clock, CheckCircle2, PhoneMissed, MessageSquare, HeartPulse, AlertTriangle, UserCheck, Ticket, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function AdvancedKpiCards({ data }: { data?: any }) {
  const activeCalls = data?.metrics?.activeCalls ?? data?.liveStats?.activeCalls ?? 0;
  const waitingCalls = data?.metrics?.queueCalls ?? data?.liveStats?.waitingQueue ?? 0;
  const avgHandleTime = data?.metrics?.avgHandleTime ?? (data?.liveStats?.avgDurationSec ? `${Math.floor(data.liveStats.avgDurationSec / 60)}m` : '0m 0s');
  const slaMet = data?.metrics?.slaMet ?? (activeCalls > 0 ? '96%' : '100%');
  const unreadMessages = data?.metrics?.unreadMessages ?? data?.liveStats?.unreadMessages ?? 0;
  const assignedTickets = data?.metrics?.assignedTickets ?? data?.liveStats?.assignedTickets ?? 0;

  const kpis: { label: string, value: string | number, trend: string, isUp: boolean, icon: any, iconColor?: string }[] = [
    { label: 'Active Calls', value: activeCalls, trend: 'Live', isUp: true, icon: PhoneCall },
    { label: 'Waiting Calls', value: waitingCalls, trend: 'Live', isUp: false, icon: Users },
    { label: 'Avg Handle Time', value: avgHandleTime, trend: 'Optimal', isUp: false, icon: Clock },
    { label: 'SLA Met', value: slaMet, trend: 'Compliant', isUp: true, icon: CheckCircle2 },
    { label: 'Unread Messages', value: unreadMessages, trend: 'Live', isUp: unreadMessages === 0, icon: MessageSquare },
    { label: 'Assigned Tickets', value: assignedTickets, trend: 'Active', isUp: false, icon: Ticket },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        const trendColor = kpi.isUp ? 'text-emerald-500' : 'text-rose-500';
        const TrendIcon = kpi.isUp ? ArrowUpRight : ArrowDownRight;

        return (
          <div key={idx} className="bg-[#0a0a0a] border border-[#222] p-3 rounded-xl flex flex-col hover:border-[#333] transition-colors relative overflow-hidden">
             {/* Subtle gradient glow */}
             <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary/5 rounded-full blur-xl"></div>
             
             <div className="flex items-center gap-2.5 mb-2">
               <div className={`p-1.5 rounded-md bg-[#111] border border-[#222]`}>
                 <Icon className={`w-3.5 h-3.5 ${kpi.iconColor || 'text-primary'}`} />
               </div>
               <p className="text-[11px] text-slate-400 font-medium truncate">{kpi.label}</p>
             </div>
             
             <div className="mt-auto">
               <h3 className="text-xl font-bold text-white mb-1 leading-none">{kpi.value}</h3>
               <div className={`flex items-center gap-1 text-[9px] font-medium ${trendColor}`}>
                 <TrendIcon className="w-3 h-3" />
                 <span>{kpi.trend} vs yesterday</span>
               </div>
             </div>
          </div>
        );
      })}
    </div>
  );
}
