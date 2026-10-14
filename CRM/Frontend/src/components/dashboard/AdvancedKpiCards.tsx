import React from 'react';
import { PhoneCall, Users, Clock, CheckCircle2, PhoneMissed, MessageSquare, HeartPulse, AlertTriangle, UserCheck, Ticket, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function AdvancedKpiCards({ data }: { data?: any }) {
  const kpis: { label: string, value: string | number, trend: string, isUp: boolean, icon: any, iconColor?: string }[] = [
    { label: 'Active Calls', value: data?.metrics?.activeCalls || '14', trend: '12%', isUp: true, icon: PhoneCall },
    { label: 'Waiting Calls', value: data?.metrics?.queueCalls || '3', trend: '5%', isUp: false, icon: Users },
    { label: 'Avg Handle Time', value: '04:22', trend: '8%', isUp: false, icon: Clock },
    { label: 'SLA Met', value: '94%', trend: '2%', isUp: true, icon: CheckCircle2 },
    { label: 'Unread Messages', value: data?.metrics?.unreadMessages || '11', trend: '14%', isUp: true, icon: MessageSquare },
    { label: 'Assigned Tickets', value: data?.metrics?.assignedTickets || '28', trend: '3%', isUp: false, icon: Ticket },
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
