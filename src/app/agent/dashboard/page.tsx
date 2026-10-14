"use client";

import React from 'react';
import { DashboardSwitcher } from '@/components/dashboard/DashboardSwitcher';

export default function AgentDashboardPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#000] text-white h-full">
      <DashboardSwitcher 
        allowedTypes={['agent_performance']} 
        defaultType="agent_performance" 
      />
    </div>
  );
}
