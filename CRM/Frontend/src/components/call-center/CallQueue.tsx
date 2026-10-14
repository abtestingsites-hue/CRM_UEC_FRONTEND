import React from 'react';
import { PhoneIncoming, Users } from 'lucide-react';

export function CallQueue() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-4">
        <Users className="w-8 h-8 text-amber-500" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Queue is Empty</h3>
      <p className="text-sm text-slate-500 max-w-sm">
        There are currently no customers waiting in the call queue.
      </p>
    </div>
  );
}
