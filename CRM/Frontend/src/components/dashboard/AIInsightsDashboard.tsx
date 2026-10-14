import React from 'react';
import { Sparkles } from 'lucide-react';
import { KPIWidget } from './KPIWidget';
import { WidgetWrapper } from './WidgetWrapper';
import { ChartWidget } from './ChartWidget';

interface AIInsightsDashboardProps {
  metrics: any;
}

export function AIInsightsDashboard({ metrics }: AIInsightsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget label="AI Summaries" value="840" change="100% Auto" isPositive={true} />
        <KPIWidget label="AI Sentiment Accuracy" value="94.2%" change="+1.5%" isPositive={true} />
        <KPIWidget label="AI Time Saved" value="142 Hrs" change="High ROI" isPositive={true} />
        <KPIWidget label="AI Lead Scores" value="245" change="Synced" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WidgetWrapper title="AI usage analytics trend" dataForExport={metrics.charts?.pipelineTrend}>
            <ChartWidget type="bar" data={metrics.charts?.pipelineTrend || []} />
          </WidgetWrapper>
        </div>
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-orange-500" /> AI Recommendations</h3>
            <p className="text-xs text-slate-300">Customer care queues should trigger an SMS template callback alert when average wait times exceed 20 seconds.</p>
          </div>
          <div className="mt-4 p-3 bg-orange-950/10 border border-orange-500/20 rounded-xl">
            <span className="text-[10px] font-bold text-orange-500 block uppercase tracking-wider">Projected Impact</span>
            <span className="text-xs text-slate-400 block mt-0.5">Increases FCR by +4.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
