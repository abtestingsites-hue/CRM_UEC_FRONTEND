import React from 'react';
import { Sparkles, Bell } from 'lucide-react';
import { KPIWidget } from './KPIWidget';
import { WidgetWrapper } from './WidgetWrapper';
import { ChartWidget } from './ChartWidget';

interface ExecutiveDashboardProps {
  metrics: any;
  liveEvents: any[];
}

export function ExecutiveDashboard({ metrics, liveEvents }: ExecutiveDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget label="Total Customers" value={metrics.kpis?.[0]?.value || '184'} change="+4.3%" isPositive={true} />
        <KPIWidget label="Active Leads Pool" value={metrics.kpis?.[1]?.value || '12'} change="+12.4%" isPositive={true} />
        <KPIWidget label="Conversion Rate" value={metrics.kpis?.[2]?.value || '42.5%'} change="+3.1%" isPositive={true} />
        <KPIWidget label="Pipeline Value" value={metrics.kpis?.[3]?.value || '$840,250'} change="+14.2%" isPositive={true} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WidgetWrapper title="Revenue growth & Trend Analysis" dataForExport={metrics.charts?.revenueTrend}>
            <ChartWidget type="line" data={metrics.charts?.revenueTrend || []} />
          </WidgetWrapper>
        </div>
        <div>
          <WidgetWrapper title="Acquisition Pipeline funnel" dataForExport={metrics.charts?.salesFunnel}>
            <ChartWidget type="funnel" data={metrics.charts?.salesFunnel || []} />
          </WidgetWrapper>
        </div>
      </div>

      {/* AI & Operations grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-orange-500" /> AI Executive Insight</h3>
          <div className="space-y-3">
            <div className="p-3 bg-orange-950/10 border border-orange-500/20 rounded-xl">
              <p className="text-xs text-slate-300 font-medium">Sales Pipeline velocity has improved by **14%** following optimized agent occupancy allocations in support channels.</p>
            </div>
            <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 rounded-xl">
              <p className="text-xs text-slate-300 font-medium">Monthly growth targets are on track with a positive CSAT index forecast of **88.5%**.</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Bell className="w-4 h-4 text-orange-500" /> Recent Business Activities</h3>
          <div className="space-y-2.5">
            {liveEvents.map((e, i) => (
              <div key={i} className="flex justify-between items-center text-xs border-b border-[#1c1c1c]/40 pb-2">
                <span className="text-slate-300 font-medium">{e.msg}</span>
                <span className="text-[10px] text-slate-600">{e.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
