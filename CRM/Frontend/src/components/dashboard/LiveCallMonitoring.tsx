"use client";

import { Headset, Eye, MicOff, Mic, ShieldAlert } from 'lucide-react';

export function LiveCallMonitoring() {
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm p-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <Headset className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Live Call Monitoring</h3>
        <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">Supervisor Mode</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-slate-500 text-sm">
              <th className="pb-3 font-medium pl-4">Agent</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Duration</th>
              <th className="pb-3 font-medium">Sentiment</th>
              <th className="pb-3 font-medium text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <td className="py-4 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">AJ</div>
                  <span className="font-medium text-sm">Alex Johnson</span>
                </div>
              </td>
              <td className="py-4 text-sm text-slate-600 dark:text-slate-300">Robert Smith (+1 555-0198)</td>
              <td className="py-4 text-sm font-mono text-slate-500">04:12</td>
              <td className="py-4">
                <span className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-max">
                  <ShieldAlert className="w-3 h-3" /> Negative
                </span>
              </td>
              <td className="py-4 pr-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-colors tooltip-trigger" title="Listen (Silent)">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition-colors tooltip-trigger" title="Whisper (Agent Only)">
                    <MicOff className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-500 transition-colors tooltip-trigger" title="Barge In">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
              <td className="py-4 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">SM</div>
                  <span className="font-medium text-sm">Sarah Miller</span>
                </div>
              </td>
              <td className="py-4 text-sm text-slate-600 dark:text-slate-300">Emma Davis (+1 555-8821)</td>
              <td className="py-4 text-sm font-mono text-slate-500">01:45</td>
              <td className="py-4">
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium w-max inline-block">
                  Positive
                </span>
              </td>
              <td className="py-4 pr-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-colors tooltip-trigger" title="Listen (Silent)">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-500 transition-colors tooltip-trigger" title="Whisper (Agent Only)">
                    <MicOff className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-500 transition-colors tooltip-trigger" title="Barge In">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
