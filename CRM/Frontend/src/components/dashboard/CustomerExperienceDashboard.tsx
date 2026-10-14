import React from 'react';
import { KPIWidget } from './KPIWidget';
import { WidgetWrapper } from './WidgetWrapper';
import { ChartWidget } from './ChartWidget';

interface CustomerExperienceDashboardProps {
  metrics: any;
}

export function CustomerExperienceDashboard({ metrics }: CustomerExperienceDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget label="NPS (Net Promoter)" value="72" change="+4" isPositive={true} />
        <KPIWidget label="CSAT Index" value="88.5%" change="+2.1%" isPositive={true} />
        <KPIWidget label="Retention Rate" value="94.2%" change="+0.8%" isPositive={true} />
        <KPIWidget label="Churn Risk Index" value="5.8%" change="-0.8%" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <WidgetWrapper title="Customer Sentiments Breakdown" dataForExport={metrics.charts?.sourceShare}>
            <ChartWidget type="pie" data={metrics.charts?.sourceShare || []} />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-2">
          <WidgetWrapper title="Customer retention trend" dataForExport={metrics.charts?.revenueTrend}>
            <ChartWidget type="line" data={metrics.charts?.revenueTrend || []} />
          </WidgetWrapper>
        </div>
      </div>
    </div>
  );
}
