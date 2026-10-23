"use client";

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, Sliders } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';

import { OverallDashboard } from './OverallDashboard';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { SalesDashboard } from './SalesDashboard';
import { AgentDashboard } from './AgentDashboard';
import { OmnichannelDashboard } from './OmnichannelDashboard';
import { ContactCenterDashboard } from './ContactCenterDashboard';
import { CustomerExperienceDashboard } from './CustomerExperienceDashboard';
import { AIInsightsDashboard } from './AIInsightsDashboard';
import { ReportsAnalyticsDashboard } from './ReportsAnalyticsDashboard';
import { CustomBuilderDashboard } from './CustomBuilderDashboard';
import { TodaysActionsDashboard } from './TodaysActionsDashboard';

export function DashboardSwitcher({ 
  allowedTypes = ['overall', 'actions', 'executive', 'sales_lead', 'agent_performance', 'omnichannel', 'contact_center', 'customer_experience', 'ai_insights', 'reports', 'custom'],
  defaultType = 'overall'
}: {
  allowedTypes?: string[];
  defaultType?: string;
}) {
  const { 
    activeType, setActiveType, metrics, fetchMetrics, isLoading,
    startDate, endDate, department, team, setFilters
  } = useDashboardStore();

  const [isOpen, setIsOpen] = useState(false);

  const allDashboards = [
    { type: 'overall', label: 'Overall Dashboard' },
    { type: 'executive', label: 'Executive Dashboard' },
    { type: 'sales_lead', label: 'Sales & Lead Dashboard' },
    { type: 'agent_performance', label: 'Agent Performance' },
    { type: 'omnichannel', label: 'Messaging Hub Dashboard' },
    { type: 'contact_center', label: 'Contact Center Live' },
    { type: 'customer_experience', label: 'Customer Experience' },
    { type: 'ai_insights', label: 'AI Insights' },
    { type: 'reports', label: 'Reports & Analytics' },
    { type: 'custom', label: 'Custom Builder' },
  ];

  const dashboards = allDashboards.filter(d => allowedTypes.includes(d.type));
  
  // Ensure activeType is valid for the current view, otherwise use default
  useEffect(() => {
    if (!allowedTypes.includes(activeType)) {
      setActiveType(defaultType);
    }
  }, [allowedTypes, activeType, defaultType, setActiveType]);

  const currentLabel = activeType === 'actions' 
    ? (dashboards[0]?.label || 'Dashboard') 
    : dashboards.find(d => d.type === activeType)?.label || dashboards[0]?.label || 'Dashboard';

  useEffect(() => {
    fetchMetrics();
  }, []);

  const { socket, telephonySocket } = useSocket();
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  useEffect(() => {
    const handleIncomingCall = (data: any) => {
      const time = new Date().toLocaleTimeString();
      const caller = data.caller || data.from || 'Caller';
      setLiveEvents(prev => [
        { time, msg: `Inbound call from ${caller} (${data.queueType || data.category || 'General'})`, type: 'INFO' },
        ...prev.slice(0, 19)
      ]);
    };

    const handleCallConnected = (data: any) => {
      const time = new Date().toLocaleTimeString();
      setLiveEvents(prev => [
        { time, msg: `Call connected (SID: ${data?.callSid ? data.callSid.slice(0, 8) + '...' : 'active'})`, type: 'SUCCESS' },
        ...prev.slice(0, 19)
      ]);
    };

    const handleCallEnded = (data: any) => {
      const time = new Date().toLocaleTimeString();
      setLiveEvents(prev => [
        { time, msg: `Call completed${data?.duration ? ` (${data.duration}s)` : ''}`, type: 'INFO' },
        ...prev.slice(0, 19)
      ]);
    };

    const handleNewMessage = (data: any) => {
      const time = new Date().toLocaleTimeString();
      const channel = data?.channel || (data?.message?.senderPhone ? 'WhatsApp' : 'Omnichannel');
      setLiveEvents(prev => [
        { time, msg: `New ${channel} message received`, type: 'INFO' },
        ...prev.slice(0, 19)
      ]);
    };

    const handleAgentStatus = (data: any) => {
      const time = new Date().toLocaleTimeString();
      setLiveEvents(prev => [
        { time, msg: `Agent status: ${data?.status || 'AVAILABLE'}`, type: 'INFO' },
        ...prev.slice(0, 19)
      ]);
    };

    if (telephonySocket) {
      telephonySocket.on('incoming_call', handleIncomingCall);
      telephonySocket.on('callConnected', handleCallConnected);
      telephonySocket.on('callEnded', handleCallEnded);
      telephonySocket.on('agent_status_change', handleAgentStatus);
    }
    if (socket) {
      socket.on('new_whatsapp_message', handleNewMessage);
      socket.on('new_message', handleNewMessage);
      socket.on('new_email_message', handleNewMessage);
    }

    return () => {
      if (telephonySocket) {
        telephonySocket.off('incoming_call', handleIncomingCall);
        telephonySocket.off('callConnected', handleCallConnected);
        telephonySocket.off('callEnded', handleCallEnded);
        telephonySocket.off('agent_status_change', handleAgentStatus);
      }
      if (socket) {
        socket.off('new_whatsapp_message', handleNewMessage);
        socket.off('new_message', handleNewMessage);
        socket.off('new_email_message', handleNewMessage);
      }
    };
  }, [socket, telephonySocket]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#050505] text-white">
      {/* Filters Dock & Swapping Selector */}
      <header className="border-b border-[#1e1e1e] bg-[#090909] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative z-30">
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-xl text-sm font-bold text-white transition-all outline-none"
            >
              <span>{currentLabel}</span>
              <ChevronDown className={`w-4 h-4 text-orange-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-64 bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden z-50 p-1"
                >
                  {dashboards.map((d) => (
                    <button
                      key={d.type}
                      onClick={() => {
                        setActiveType(d.type);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeType === d.type 
                          ? 'bg-orange-600/15 text-orange-500' 
                          : 'text-slate-400 hover:bg-[#141414] hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setActiveType('actions')}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-sm font-bold transition-all outline-none ${
              activeType === 'actions' 
                ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]' 
                : 'bg-[#141414] hover:bg-[#202020] text-slate-300 border-[#222]'
            }`}
          >
            Today's Actions
          </button>


          <div className="h-6 w-px bg-[#1c1c1c] hidden md:block"></div>

          {/* Start Date */}
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Start Date</span>
            <input aria-label="Dashboard filter start date" 
              type="date" 
              value={startDate}
              onChange={(e) => setFilters({ startDate: e.target.value })}
              className="bg-[#141414] border border-[#222] rounded-lg px-2.5 py-0.5 text-xs text-white outline-none focus:border-orange-500"
            />
          </div>
          {/* End Date */}
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">End Date</span>
            <input aria-label="Dashboard filter end date" 
              type="date" 
              value={endDate}
              onChange={(e) => setFilters({ endDate: e.target.value })}
              className="bg-[#141414] border border-[#222] rounded-lg px-2.5 py-0.5 text-xs text-white outline-none focus:border-orange-500"
            />
          </div>
          {/* Dept */}
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Department</span>
            <select 
              aria-label="Dashboard Department Filter" value={department}
              onChange={(e) => setFilters({ department: e.target.value })}
              className="bg-[#141414] border border-[#222] rounded-lg px-2 py-0.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value="All">All Departments</option>
              <option value="Sales">Sales Division</option>
              <option value="Care">Care Support</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all self-end md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>
      </header>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
        {/* Non-blocking sync indicator instead of full overlay */}
        {isLoading && (
          <div className="absolute top-4 right-4 bg-[#141414]/90 backdrop-blur-md border border-[#333] px-3 py-1.5 rounded-full flex items-center shadow-xl z-50">
            <span className="w-3.5 h-3.5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mr-2"></span>
            <span className="text-[10px] text-slate-300 font-bold tracking-wider uppercase">Syncing</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {activeType === 'overall' && (
              <OverallDashboard data={metrics} />
            )}
            {activeType === 'actions' && (
              <TodaysActionsDashboard />
            )}
            {activeType === 'executive' && (
              <ExecutiveDashboard metrics={metrics} liveEvents={liveEvents} />
            )}
            {activeType === 'sales_lead' && (
              <SalesDashboard metrics={metrics} />
            )}
            {activeType === 'agent_performance' && (
              <AgentDashboard metrics={metrics} />
            )}
            {activeType === 'omnichannel' && (
              <OmnichannelDashboard metrics={metrics} />
            )}
            {activeType === 'contact_center' && (
              <ContactCenterDashboard metrics={metrics} totalAgents={6} />
            )}
            {activeType === 'customer_experience' && (
              <CustomerExperienceDashboard metrics={metrics} />
            )}
            {activeType === 'ai_insights' && (
              <AIInsightsDashboard metrics={metrics} />
            )}
            {activeType === 'reports' && (
              <ReportsAnalyticsDashboard />
            )}
            {activeType === 'custom' && (
              <CustomBuilderDashboard />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
