import React from 'react';
import { Headset } from 'lucide-react';

export function ActiveCallsList() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4">
        <Headset className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Active Calls</h3>
      <p className="text-sm text-slate-500 max-w-sm">
        You are not currently participating in any active voice calls.
      </p>
    </div>
  );
}
