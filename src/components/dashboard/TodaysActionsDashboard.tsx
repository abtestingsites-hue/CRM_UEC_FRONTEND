"use client";

import React, { useState } from 'react';
import { 
  Phone, MessageCircle, Calendar, UserPlus, Clock, UserMinus, 
  FileText, Gift, AlertTriangle, CheckCircle, RefreshCw, UserCheck, 
  Filter, MoreHorizontal 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data Interfaces
interface ActionItem {
  id: string;
  type: string;
  title: string;
  contactName: string;
  contactNumber: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low';
  details?: string;
}

export function TodaysActionsDashboard() {
  const [activeFilter, setActiveFilter] = useState('All');

  const actionCategories = [
    { id: 'calls', label: "Scheduled Calls", icon: Phone, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { id: 'followups', label: "Follow-ups Due", icon: RefreshCw, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" },
    { id: 'new_enquiries', label: "New Enquiries", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: 'pending_enquiries', label: "Pending Enquiries", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { id: 'missed_callbacks', label: "Missed Callbacks", icon: UserMinus, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    { id: 'meetings', label: "Meetings", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { id: 'invoices', label: "Invoice Reminders", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { id: 'birthdays', label: "Birthdays", icon: Gift, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    { id: 'expiring', label: "Expiring Services", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ];

  const mockActions: ActionItem[] = [
    { id: '1', type: 'calls', title: 'Product Demo Follow-up', contactName: 'Rajesh Kumar', contactNumber: '+91 98765 43210', time: '10:30 AM', priority: 'High', details: 'Discuss pricing for Enterprise plan' },
    { id: '2', type: 'followups', title: 'Send Proposal', contactName: 'Anita Sharma', contactNumber: '+91 87654 32109', time: '11:15 AM', priority: 'Medium', details: 'Awaiting revised quote' },
    { id: '3', type: 'new_enquiries', title: 'Website Lead', contactName: 'Vikram Singh', contactNumber: '+91 76543 21098', time: '09:00 AM', priority: 'High', details: 'Interested in Premium care package' },
    { id: '4', type: 'missed_callbacks', title: 'Missed Inbound', contactName: 'Priya Patel', contactNumber: '+91 65432 10987', time: 'Yesterday 5:45 PM', priority: 'High', details: 'Tried calling outside office hours' },
    { id: '5', type: 'meetings', title: 'Quarterly Review', contactName: 'Amit Desai', contactNumber: '+91 54321 09876', time: '02:00 PM', priority: 'Medium', details: 'Zoom Link in calendar' },
    { id: '6', type: 'invoices', title: 'Overdue Payment', contactName: 'Sanjay Gupta', contactNumber: '+91 43210 98765', time: 'Due Today', priority: 'High', details: 'Invoice #INV-2024-089' },
    { id: '7', type: 'birthdays', title: 'Client Birthday', contactName: 'Neha Verma', contactNumber: '+91 32109 87654', time: 'Today', priority: 'Low', details: 'Send wishes and discount code' },
    { id: '8', type: 'expiring', title: 'Service Expiry', contactName: 'Ramesh Shah', contactNumber: '+91 21098 76543', time: 'In 3 Days', priority: 'High', details: 'Annual AMC expires soon' },
  ];

  const filteredActions = activeFilter === 'All' 
    ? mockActions 
    : mockActions.filter(a => a.type === activeFilter);

  const handleAction = (actionName: string, item: ActionItem) => {
    // Show a toast or log for now
    console.log(`Action triggered: ${actionName} for ${item.contactName}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden rounded-2xl border border-[#1e1e1e]">
      {/* Header */}
      <div className="p-6 border-b border-[#1e1e1e] bg-[#0a0a0a]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Today's Action Center</h2>
            <p className="text-sm text-slate-400">Manage all your scheduled tasks, follow-ups, and alerts for today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-orange-500">{mockActions.filter(a => a.priority === 'High').length} High Priority</div>
              <div className="text-xs text-slate-500">{mockActions.length} Total Tasks</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-64 border-r border-[#1e1e1e] bg-[#090909] overflow-y-auto custom-scrollbar flex flex-col p-4 gap-2">
          <button
            onClick={() => setActiveFilter('All')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeFilter === 'All' 
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                : 'text-slate-400 hover:bg-[#141414] hover:text-slate-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4" />
              <span>All Actions</span>
            </div>
            <span className="text-xs bg-[#1a1a1a] px-2 py-0.5 rounded-md font-bold">{mockActions.length}</span>
          </button>
          
          <div className="h-px bg-[#1e1e1e] my-2"></div>
          
          {actionCategories.map(cat => {
            const count = mockActions.filter(a => a.type === cat.id).length;
            const Icon = cat.icon;
            const isActive = activeFilter === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? `${cat.bg} ${cat.color} ${cat.border} border` 
                    : 'text-slate-400 hover:bg-[#141414] hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? cat.color : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                </div>
                {count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${isActive ? 'bg-white/10' : 'bg-[#1a1a1a]'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] p-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <CheckCircle className="w-12 h-12 mb-4 text-slate-600" />
                <h3 className="text-lg font-medium">All Caught Up!</h3>
                <p className="text-sm">No actions required for this category today.</p>
              </div>
            ) : (
              filteredActions.map((action, index) => {
                const category = actionCategories.find(c => c.id === action.type);
                const CatIcon = category?.icon || AlertTriangle;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={action.id}
                    className="group bg-[#0b0b0b] hover:bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] rounded-2xl p-5 flex flex-col sm:flex-row gap-5 transition-all shadow-sm"
                  >
                    {/* Left: Icon & Meta */}
                    <div className="flex flex-col items-center sm:items-start gap-3 shrink-0 sm:w-32 border-b sm:border-b-0 sm:border-r border-[#1e1e1e] pb-4 sm:pb-0 sm:pr-4">
                      <div className={`p-3 rounded-xl ${category?.bg || 'bg-slate-800'} ${category?.border || 'border-slate-700'} border`}>
                        <CatIcon className={`w-6 h-6 ${category?.color || 'text-slate-400'}`} />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-1">Due By</span>
                        <span className="text-sm font-medium text-white">{action.time}</span>
                      </div>
                      {action.priority === 'High' && (
                        <div className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          High Priority
                        </div>
                      )}
                    </div>

                    {/* Middle: Details */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{action.title}</h3>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{action.details}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5 text-slate-300 bg-[#141414] px-3 py-1.5 rounded-lg border border-[#222]">
                          <UserCheck className="w-4 h-4 text-slate-500" />
                          {action.contactName}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300 bg-[#141414] px-3 py-1.5 rounded-lg border border-[#222]">
                          <Phone className="w-4 h-4 text-slate-500" />
                          {action.contactNumber}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-end sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-[#1e1e1e] pt-4 sm:pt-0 sm:pl-4">
                      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 w-full sm:w-auto">
                        <button onClick={() => handleAction('Complete', action)} className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 hover:border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap">
                          <CheckCircle className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button onClick={() => handleAction('Call', action)} className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 hover:border-blue-500/40 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap">
                          <Phone className="w-3.5 h-3.5" /> Call
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleAction('WhatsApp', action)} className="flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 hover:border-green-500/40 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all" title="WhatsApp">
                          <MessageCircle className="w-4 h-4" /> <span className="sm:hidden text-xs">WhatsApp</span>
                        </button>
                        <button onClick={() => handleAction('Reschedule', action)} className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-slate-300 border border-[#333] hover:border-[#444] p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all" title="Reschedule">
                          <Clock className="w-4 h-4" /> <span className="sm:hidden text-xs">Reschedule</span>
                        </button>
                        <button onClick={() => handleAction('Assign', action)} className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-slate-300 border border-[#333] hover:border-[#444] p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all" title="Assign">
                          <UserPlus className="w-4 h-4" /> <span className="sm:hidden text-xs">Assign</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
