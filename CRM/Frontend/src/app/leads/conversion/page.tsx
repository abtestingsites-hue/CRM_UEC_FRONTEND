"use client";

import React, { useEffect } from 'react';
import { useLeadStore } from '@/store/useLeadStore';
import { Calendar, Phone, Activity, MoreVertical } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { id: 'FOLLOWUP_REQUIRED', label: 'Follow Up', color: 'border-amber-500/50 bg-amber-500/10 text-amber-400' },
  { id: 'POSITIVE', label: 'Positive', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
  { id: 'NEGATIVE', label: 'Negative', color: 'border-rose-500/50 bg-rose-500/10 text-rose-400' },
  { id: 'CONVERTED', label: 'Converted', color: 'border-purple-500/50 bg-purple-500/10 text-purple-400' },
];

export default function LeadConversionBoard() {
  const { leads, fetchLeads, updateLeadStatus } = useLeadStore();

  useEffect(() => {
    const token = localStorage.getItem('paramantra_access_token') || '';
    fetchLeads(token);
  }, [fetchLeads]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      const token = localStorage.getItem('paramantra_access_token') || '';
      await updateLeadStatus(leadId, statusId, 'Moved via Kanban', token);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] md:bg-transparent min-h-screen md:min-h-0 text-[#0F172A] md:text-white flex flex-col">
      <div className="h-full flex flex-col space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] md:text-white">Conversion Board</h1>
          <p className="text-[#64748B] md:text-slate-400 text-sm mt-1">Manage lead statuses via drag and drop.</p>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 flex gap-4 md:gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
          {KANBAN_COLUMNS.map(column => (
            <div 
              key={column.id}
              className="w-80 shrink-0 flex flex-col bg-white border border-[#E2E8F0] md:bg-[#111] md:border-[#222] rounded-2xl shadow-sm md:shadow-none snap-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-4 border-b border-[#E2E8F0] md:border-b-[#222] flex items-center justify-between">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${column.color}`}>
                  {column.label}
                </div>
                <span className="text-xs text-[#64748B] md:text-slate-500 font-bold">
                  {leads.filter(l => l?.status === column.id).length}
                </span>
              </div>
              
              <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar min-h-[300px]">
                {leads.filter(l => l?.status === column.id).map(lead => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] md:bg-[#1a1a1a] md:border-[#333] hover:border-[#CBD5E1] md:hover:border-[#555] rounded-xl p-4 cursor-grab active:cursor-grabbing transition-colors shadow-sm text-[#0F172A] md:text-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A] md:text-white">{lead.customerName}</h4>
                        <p className="text-xs text-[#64748B] md:text-slate-400 mt-0.5">{lead.serviceInterest || 'General Inquiry'}</p>
                      </div>
                      <button className="text-[#64748B] md:text-slate-500 hover:text-[#0F172A] md:hover:text-slate-300">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-[#64748B] md:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-[#94A3B8] md:text-slate-400" />
                        {lead.phoneNumber}
                      </div>
                      
                      {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-[#64748B] md:text-slate-400">
                          <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-[#94A3B8] md:text-slate-400">@</span>
                          {lead.email}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-[#64748B] md:text-slate-400 mt-1">
                        <div className="w-4 h-4 rounded-full bg-[#E2E8F0] md:bg-[#333] flex items-center justify-center text-[8px] font-bold text-[#0F172A] md:text-white">
                          {lead.agentName?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-[#64748B] md:text-slate-300">
                          Handled by {lead.agentName || 'Unknown'}
                        </span>
                      </div>
                      
                      {lead.conversionScore && (
                        <div className="flex items-center gap-2 text-xs text-[#64748B] md:text-slate-400 mt-1">
                          <Activity className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className={lead.conversionScore > 70 ? 'text-emerald-600 md:text-emerald-400 font-bold' : 'text-amber-600 md:text-amber-400 font-bold'}>
                            {lead.conversionScore}% Probability
                          </span>
                        </div>
                      )}
                      
                      {lead.nextFollowup ? (
                        <div className="flex items-center gap-2 text-xs text-amber-600 mt-2 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 w-fit font-bold">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.nextFollowup).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
