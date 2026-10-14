import React from 'react';
import { KPIWidget } from './KPIWidget';
import { WidgetWrapper } from './WidgetWrapper';
import { ChartWidget } from './ChartWidget';

interface SalesDashboardProps {
  metrics: any;
}

export function SalesDashboard({ metrics }: SalesDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget label="New Leads" value={metrics.kpis?.[0]?.value || '12'} change="+12.4%" isPositive={true} />
        <KPIWidget label="Qualified Leads" value={metrics.kpis?.[1]?.value || '5'} change="+11.2%" isPositive={true} />
        <KPIWidget label="Won Deals" value={metrics.kpis?.[2]?.value || '8'} change="+9.4%" isPositive={true} />
        <KPIWidget label="Forecasted Revenue" value={metrics.kpis?.[5]?.value || '$950,000'} change="On Track" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <WidgetWrapper title="Lead Generation Source Share" dataForExport={metrics.charts?.sourceShare}>
            <ChartWidget type="pie" data={metrics.charts?.sourceShare || []} />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-2">
          <WidgetWrapper title="Weekly Pipeline Velocity" dataForExport={metrics.charts?.pipelineTrend}>
            <ChartWidget type="bar" data={metrics.charts?.pipelineTrend || []} />
          </WidgetWrapper>
        </div>
      </div>
    </div>
  );
}
