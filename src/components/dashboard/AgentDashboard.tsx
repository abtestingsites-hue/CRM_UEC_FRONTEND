"use client";

import React from 'react';
import { Phone, Users, Ticket, MessageSquare, Plus } from 'lucide-react';

interface AgentDashboardProps {
  metrics?: any;
}

export function AgentDashboard({ metrics }: AgentDashboardProps) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-2 bg-[#050505] text-white min-h-screen md:min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome back, Mani! Let's accomplish your tasks.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center justify-center gap-2 bg-[#141414] border border-[#222] px-3 py-2 rounded-full min-h-[44px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-sm text-white font-medium">Available</span>
          </div>
          <button className="bg-[#ff6b00] hover:bg-[#ff8533] text-white px-4 py-3 sm:py-1.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors min-h-[48px] sm:min-h-0 w-full sm:w-auto shadow-md shadow-orange-500/10">
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calls Connected - Orange Card */}
        <div className="bg-gradient-to-br from-[#ff6b00] to-orange-600 rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_15px_rgba(255,107,0,0.15)] relative overflow-hidden group hover:shadow-[0_0_25px_rgba(255,107,0,0.25)] transition-all h-[140px]">
          <div className="flex justify-between items-start z-10">
            <h3 className="text-white/90 font-medium text-sm">Calls Connected</h3>
            <div className="p-2 bg-white/10 rounded-full">
              <Phone className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-4 z-10">
            <h2 className="text-4xl font-bold text-white tracking-tight">45</h2>
          </div>
          <div className="mt-2 flex items-center gap-1 text-white/80 text-[10px] font-medium z-10">
            <span className="bg-white/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
              ↗ Increased from last week
            </span>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
        </div>

        {/* Queue Calls */}
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col justify-between hover:border-[#333] transition-all h-[140px]">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 font-medium text-sm">Queue Calls</h3>
            <div className="p-2 bg-[#1a1a1a] rounded-full">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">3</h2>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
            <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded flex items-center gap-1 border border-orange-500/20">
              ↗ Monitor wait times
            </span>
          </div>
        </div>

        {/* Tickets Raised */}
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col justify-between hover:border-[#333] transition-all h-[140px]">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 font-medium text-sm">Tickets Raised</h3>
            <div className="p-2 bg-[#1a1a1a] rounded-full">
              <Ticket className="w-4 h-4 text-slate-300" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">18</h2>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
            <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded flex items-center gap-1 border border-red-500/20">
              ↗ Action required
            </span>
          </div>
        </div>

        {/* Unread Messages */}
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col justify-between hover:border-[#333] transition-all h-[140px]">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 font-medium text-sm">Unread Messages</h3>
            <div className="p-2 bg-[#1a1a1a] rounded-full">
              <MessageSquare className="w-4 h-4 text-slate-300" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">12</h2>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
            <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/20">
              ↗ Inbox overview
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Sentiment Analytics */}
        <div className="lg:col-span-2 bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 md:p-6 shadow-none">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Customer Sentiment Analytics</h2>
              <p className="text-sm text-slate-500">AI analysis of customer satisfaction from recent connected calls.</p>
            </div>
            <select className="w-full sm:w-auto bg-[#141414] text-white border border-[#222] text-xs px-3 py-2 sm:py-1.5 rounded-xl outline-none focus:border-[#444] min-h-[40px] sm:min-h-0 shadow-none cursor-pointer">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="mt-6 mb-8">
            {/* The progress bar */}
            <div className="w-full h-8 bg-gradient-to-r from-[#ff8c00] to-[#ffb84d] rounded-full relative overflow-hidden shadow-inner">
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 md:p-4 text-center shadow-none">
              <div className="text-xl md:text-2xl font-bold text-emerald-500 mb-1">0%</div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase">Positive</div>
            </div>
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 md:p-4 text-center shadow-none">
              <div className="text-xl md:text-2xl font-bold text-orange-500 mb-1">100%</div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase">Neutral</div>
            </div>
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 md:p-4 text-center shadow-none">
              <div className="text-xl md:text-2xl font-bold text-red-500 mb-1">0%</div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase">Negative</div>
            </div>
          </div>
        </div>

        {/* Past Calls */}
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 md:p-6 flex flex-col shadow-none">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase">Past Calls</h2>
            <button className="text-xs text-orange-600 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors min-h-[32px]">
              + New
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[150px]">
            <p className="text-sm text-slate-500">No recent calls found.</p>
          </div>
        </div>
      </div>

      {/* Transfer Call Directory */}
      <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 md:p-6 shadow-none">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Transfer Call Directory</h2>
            <p className="text-sm text-slate-500">Select an active agent to transfer your current customer.</p>
          </div>
          <button className="w-full sm:w-auto border border-[#333] text-sm text-white px-4 py-2.5 sm:py-1.5 rounded-xl hover:bg-[#141414] transition-colors min-h-[44px] sm:min-h-0 font-medium">
            View All Departments
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 flex flex-col items-center hover:border-[#444] transition-all shadow-none">
            <div className="relative mb-3">
              <div className="w-12 h-12 bg-[#222] border-transparent rounded-full flex items-center justify-center text-slate-400 shadow-none">
                <Users className="w-5 h-5" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#141414] rounded-full"></div>
            </div>
            <h4 className="text-sm font-bold text-white">Mani</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-4">Customer Care</p>
            <button className="w-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white text-xs font-bold py-2.5 rounded-xl transition-colors border border-[#333] min-h-[40px] flex items-center justify-center">
              Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
