"use client";

import React, { useState, useEffect } from 'react';
import { AdvancedKpiCards } from './AdvancedKpiCards';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { OmnichannelTrends } from './OmnichannelTrends';
import { AgentLeaderboard } from './AgentLeaderboard';
import { SlaGauge } from './SlaGauge';
import { CallVolumeHeatmap } from './CallVolumeHeatmap';
import { SentimentTrend } from './SentimentTrend';
import { OmnichannelEnquiriesChart } from './OmnichannelEnquiriesChart';
import { RightSidebarPanels } from './RightSidebarPanels';

export function OverallDashboard({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-4">
        <span className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></span>
        <span>Loading Command Center Data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#000] text-white">
      <div className="flex h-full">
        {/* Main Dashboard Area */}
        <div className="flex-1 p-4 border-r border-[#222] relative">

          {/* KPI Grid (12 cards) */}
          <div className="mb-3">
            <AdvancedKpiCards data={data} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2 bg-[#050505] border border-[#222] rounded-xl p-3 h-[250px]">
              <PerformanceHeatmap data={data} />
            </div>
            <div className="bg-[#050505] border border-[#222] rounded-xl p-3 h-[250px]">
              <OmnichannelTrends data={data} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2 bg-[#050505] border border-[#222] rounded-xl p-3">
              <AgentLeaderboard data={data} />
            </div>
            <div className="bg-[#050505] border border-[#222] rounded-xl p-3 flex flex-col justify-between">
              <SlaGauge percentage={data?.metrics?.slaMet ? parseInt(data.metrics.slaMet, 10) : 100} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2">
              <OmnichannelEnquiriesChart />
            </div>
            <div>
              <SentimentTrend data={data} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-[#050505] border border-[#222] rounded-xl p-3">
              <CallVolumeHeatmap data={data} />
            </div>
          </div>
        </div>

        {/* Right Info Panels */}
        <div className="w-[280px] p-4 hidden lg:block overflow-y-auto custom-scrollbar">
          <RightSidebarPanels />
        </div>
      </div>
    </div>
  );
}
export default OverallDashboard;
