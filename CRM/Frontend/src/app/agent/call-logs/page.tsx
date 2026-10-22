"use client";

import React, { Suspense } from 'react';
import CallLogsPage from '../../call-logs/page';

export default function AgentCallLogsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707] flex items-center justify-center text-slate-400">Loading Call Logs...</div>}>
      <CallLogsPage />
    </Suspense>
  );
}
