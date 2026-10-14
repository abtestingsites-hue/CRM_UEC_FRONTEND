import React from 'react';
import { KPIWidget } from './KPIWidget';
import { WidgetWrapper } from './WidgetWrapper';
import { ChartWidget } from './ChartWidget';

interface OmnichannelDashboardProps {
  metrics: any;
}

export function OmnichannelDashboard({ metrics }: OmnichannelDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget label="WhatsApp Messages" value="2,840" change="+14.2%" isPositive={true} />
        <KPIWidget label="Email Dispatched" value="850" change="+4.1%" isPositive={true} />
        <KPIWidget label="SMS Notifications" value="4,200" change="+22.4%" isPositive={true} />
        <KPIWidget label="Live Chats Handled" value="1,420" change="+18.4%" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <WidgetWrapper title="Channel Utilization Distribution" dataForExport={metrics.charts?.sourceShare}>
            <ChartWidget type="pie" data={metrics.charts?.sourceShare || []} />
          </WidgetWrapper>
        </div>
        <div className="lg:col-span-2">
          <WidgetWrapper title="Traffic Flow volume" dataForExport={metrics.charts?.pipelineTrend}>
            <ChartWidget type="bar" data={metrics.charts?.pipelineTrend || []} />
          </WidgetWrapper>
        </div>
      </div>
    </div>
  );
}
