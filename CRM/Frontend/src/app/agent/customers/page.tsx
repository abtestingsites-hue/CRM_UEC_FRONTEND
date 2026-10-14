"use client";

import React from 'react';
import { UserRound, Search, Filter } from 'lucide-react';

export default function AgentCustomers() {
  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar relative">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <UserRound className="text-primary w-6 h-6" /> Customer Directory
          </h1>
          <p className="text-sm text-slate-500">Access authorized profiles and historical interactions.</p>
        </div>
      </header>

      <div className="bg-[#0a0a0a] border border-[#222] rounded-xl flex-1 flex flex-col">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none text-white transition-all placeholder-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-[#333] rounded-lg text-slate-400 hover:text-white hover:bg-[#111] transition-colors text-sm">
            <Filter className="w-4 h-4" /> Filter Profiles
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center border border-[#222] mb-4">
            <UserRound className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Directory is Empty</h3>
          <p className="text-slate-500 max-w-md text-center text-sm">
            You do not currently have any customers explicitly linked or assigned to your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
