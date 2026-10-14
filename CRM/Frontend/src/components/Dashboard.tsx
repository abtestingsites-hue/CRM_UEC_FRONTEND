"use client";

import React from 'react';
import { DashboardSwitcher } from './dashboard/DashboardSwitcher';

export function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#000] text-white h-full">
      <DashboardSwitcher />
    </div>
  );
}
