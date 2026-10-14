"use client";

import React, { useEffect, useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Mic, Clock, Calendar as CalendarIcon, User, ChevronDown, ChevronUp } from 'lucide-react';

export default function AiRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        let agentId = '';
        let role = '';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const user = JSON.parse(stored);
            agentId = user.agentId;
            role = user.role;
          }
        } catch(e) {}

        const { apiFetch } = require('@/lib/api');
        const res = await apiFetch('/api/v1/telephony/history');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        setRecords(data || []);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch call records", err);
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'ENDED':
      case 'COMPLETED':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'MISSED':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'RINGING':
      case 'IN_PROGRESS':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#000]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Mic className="w-4 h-4 text-white" />
          </div>
          AI Call Records
        </h1>
        <p className="text-sm text-slate-400 mt-2">Comprehensive log of all inbound and outbound interactions, augmented with AI summarization.</p>
      </div>

      <div className="bg-[#050505] border border-[#222] rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#111] border-b border-[#222] text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1">Dir</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Agent</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Date/Time</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              No call records found.
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="border-b border-[#222] last:border-0 hover:bg-[#111]/30 transition-colors">
                <div 
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  {/* Direction */}
                  <div className="col-span-1 flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      record.direction === 'Inbound' 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      {record.direction === 'Inbound' ? <PhoneIncoming className="w-4 h-4" /> : <PhoneOutgoing className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="col-span-3 min-w-0 flex flex-col">
                    <span className="text-sm font-bold text-white truncate">{record.customerName}</span>
                    <span className="text-xs text-slate-500 font-mono truncate">{record.customerPhone}</span>
                  </div>

                  {/* Agent */}
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center text-[10px] text-slate-400">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 truncate">{record.agentName}</span>
                  </div>

                  {/* Duration */}
                  <div className="col-span-2 flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(record.duration)}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 flex items-center gap-2 text-sm text-slate-400">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end">
                    <button className="text-slate-400 hover:text-white p-1 rounded transition-colors">
                      {expandedId === record.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details - AI Summary & Recording */}
                {expandedId === record.id && (
                  <div className="bg-[#111] border-t border-[#222] p-6 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Recording */}
                      <div>
                        <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                          <Mic className="w-4 h-4 text-primary" /> Audio Recording
                        </h4>
                        {record.recordingUrl ? (
                          <div className="bg-[#050505] border border-[#222] rounded-xl p-4">
                            <audio src={record.recordingUrl} controls className="w-full h-10" />
                          </div>
                        ) : (
                          <div className="bg-[#050505] border border-[#222] rounded-xl p-4 text-slate-500 italic text-xs">
                            No recording available for this call.
                          </div>
                        )}
                      </div>

                      {/* AI Summary */}
                      <div>
                        <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div> 
                          AI Analysis
                        </h4>
                        {record.aiSummary ? (
                          <div className="bg-[#050505] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Summary</span>
                              <p className="text-slate-300 mt-1 text-sm leading-relaxed">{record.aiSummary.summary || record.aiSummary.summaryText}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#222]">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sentiment</span>
                                <p className={`mt-1 font-bold ${
                                  record.aiSummary.sentiment === 'POSITIVE' || record.aiSummary.sentimentScore === 'POSITIVE' ? 'text-emerald-500' :
                                  record.aiSummary.sentiment === 'NEGATIVE' || record.aiSummary.sentimentScore === 'NEGATIVE' ? 'text-rose-500' : 'text-amber-500'
                                }`}>
                                  {record.aiSummary.sentiment || record.aiSummary.sentimentScore || 'NEUTRAL'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Level</span>
                                <p className={`mt-1 font-bold ${
                                  record.aiSummary.escalationRisk === 'HIGH' || record.aiSummary.riskLevel === 'HIGH' ? 'text-rose-500' :
                                  record.aiSummary.escalationRisk === 'MEDIUM' || record.aiSummary.riskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                  {record.aiSummary.escalationRisk || record.aiSummary.riskLevel || 'LOW'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#050505] border border-[#222] rounded-xl p-4 text-slate-500 italic text-xs">
                            No AI summary generated for this call.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
