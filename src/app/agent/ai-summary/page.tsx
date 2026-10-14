"use client";

import React from 'react';
import { Activity, Search, Brain, Clock } from 'lucide-react';

export default function AgentAISummary() {
  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar relative">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Activity className="text-primary w-6 h-6" /> AI Call Summaries
          </h1>
          <p className="text-sm text-slate-500">Auto-generated transcripts and sentiment analysis for your calls.</p>
        </div>
      </header>

      <div className="bg-[#0a0a0a] border border-[#222] rounded-xl flex-1 flex flex-col">
        <div className="p-4 border-b border-[#222] flex items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search your call summaries..." 
              className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none text-white transition-all placeholder-slate-500"
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-4 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Summaries Yet</h3>
          <p className="text-slate-500 max-w-md text-center text-sm">
            AI summaries will appear here automatically after you complete your first connected call.
          </p>
        </div>
      </div>
    </div>
  );
}
