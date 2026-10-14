import React, { useState } from 'react';
import { useDashboardStore, WidgetConfig } from '@/store/dashboardStore';
import { Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { KPIWidget } from './KPIWidget';
import { ChartWidget } from './ChartWidget';
import { WidgetWrapper } from './WidgetWrapper';

export function BuilderPanel() {
  const { customWidgets, addCustomWidget, removeCustomWidget, resetCustomWidgets } = useDashboardStore();

  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetType, setWidgetType] = useState<'kpi' | 'bar' | 'line' | 'pie'>('kpi');
  const [widgetWidth, setWidgetWidth] = useState<1 | 2>(1);

  // Mock records for customized widget plotting
  const mockCustomData = [
    { name: 'Label A', value: 400 },
    { name: 'Label B', value: 300 },
    { name: 'Label C', value: 200 },
    { name: 'Label D', value: 500 },
  ];

  const handleAddWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgetTitle.trim()) return;

    const newWidget: WidgetConfig = {
      id: `custom-${Date.now()}`,
      type: widgetType,
      title: widgetTitle,
      metricKey: 'customData',
      w: widgetWidth,
    };

    addCustomWidget(newWidget);
    setWidgetTitle('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Builder Toolbar */}
      <div className="bg-[#0b0b0b] border border-[#1e1e1e] p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <form onSubmit={handleAddWidget} className="flex-1 flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Widget Title</span>
            <input 
              type="text" 
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
              placeholder="e.g. Conversion Funnel"
              className="bg-[#141414] border border-[#222] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-orange-500 w-56"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Chart Type</span>
            <select 
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value as any)}
              className="bg-[#141414] border border-[#222] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value="kpi">KPI Summary Metric Card</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Donut Chart</option>
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Grid Column Span</span>
            <select 
              value={widgetWidth}
              onChange={(e) => setWidgetWidth(Number(e.target.value) as any)}
              className="bg-[#141414] border border-[#222] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value={1}>1 Column Width (Normal)</option>
              <option value={2}>2 Columns Width (Wide)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="flex items-center gap-1 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.1)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Widget</span>
          </button>
        </form>

        <button 
          onClick={resetCustomWidgets}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all self-end lg:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Grid</span>
        </button>
      </div>

      {/* 2. Drag & Drop Configured Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {customWidgets.map((w) => {
          const colSpanStyle = w.w === 2 ? 'md:col-span-2' : 'md:col-span-1';

          return (
            <div key={w.id} className={`${colSpanStyle} relative group`}>
              {/* Trash Hover overlay trigger */}
              <button 
                onClick={() => removeCustomWidget(w.id)}
                className="absolute top-4 right-4 z-20 p-1.5 bg-rose-950/20 hover:bg-rose-600 border border-rose-900/40 text-rose-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove widget"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {w.type === 'kpi' ? (
                <KPIWidget 
                  label={w.title} 
                  value="42,500" 
                  change="+12.4%" 
                  isPositive={true} 
                />
              ) : (
                <WidgetWrapper title={w.title} dataForExport={mockCustomData}>
                  <ChartWidget type={w.type as any} data={mockCustomData} />
                </WidgetWrapper>
              )}
            </div>
          );
        })}
      </div>
      {customWidgets.length === 0 && (
        <div className="text-center py-20 bg-[#0b0b0b] border border-[#1e1e1e] border-dashed rounded-2xl text-slate-500 text-xs">
          Your dashboard canvas is empty. Use the form above to add customized analytical widgets.
        </div>
      )}
    </div>
  );
}
