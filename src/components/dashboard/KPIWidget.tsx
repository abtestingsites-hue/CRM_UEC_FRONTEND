import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPIWidgetProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export function KPIWidget({ label, value, change, isPositive }: KPIWidgetProps) {
  return (
    <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col justify-between h-[140px] hover:border-[#2b2b2b] transition-all">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-end justify-between mt-2">
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
        <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${
          isPositive 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{change}</span>
        </div>
      </div>
      {/* Decorative Accent Sparkline Bar */}
      <div className="w-full bg-[#161616] h-1.5 rounded-full overflow-hidden mt-4">
        <div 
          className={`h-full rounded-full ${isPositive ? 'bg-orange-500' : 'bg-rose-500'}`} 
          style={{ width: `${isPositive ? 75 : 45}%` }}
        ></div>
      </div>
    </div>
  );
}
