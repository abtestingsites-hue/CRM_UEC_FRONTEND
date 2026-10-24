"use client";

import React, { useEffect, useState } from 'react';
import { Mic, Play, Download, Search, Filter, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';

export default function AIRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        let role = '';
        let agentId = '';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const user = JSON.parse(stored);
            role = user.role;
            agentId = user.agentId || user.id;
          }
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

        const { apiFetch } = require('@/lib/api');
        const res = await apiFetch('/telephony/history');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        const recordsList = Array.isArray(data) ? data : (data?.calls || []);
        setRecords(recordsList);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch call records", err);
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  let filteredRecords = records.filter(record => {
    if (activeTab === 'ALL') return true;
    return record.direction === activeTab;
  });

  if (activeTab === 'OUTBOUND') {
    const unique = new Map();
    filteredRecords.forEach(record => {
      const key = record.callSid || record.id;
      if (!unique.has(key)) {
        unique.set(key, record);
      }
    });
    filteredRecords = Array.from(unique.values());
  }

  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Mic className="text-primary w-6 h-6" /> AI Auto Call Records
          </h1>
          <p className="text-sm text-slate-500">Access and review automated WebRTC call recordings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors text-sm font-medium">
          <Download className="w-4 h-4" /> Export Archive
        </button>
      </header>

      {/* TABS */}
      <div className="flex items-center gap-2 mb-6 bg-[#111] p-1 rounded-xl w-fit border border-[#222]">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ALL' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          All Calls
        </button>
        <button 
          onClick={() => setActiveTab('INBOUND')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'INBOUND' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><PhoneIncoming className="w-3 h-3" /> Inbound</span>
        </button>
        <button 
          onClick={() => setActiveTab('OUTBOUND')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'OUTBOUND' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-2"><PhoneOutgoing className="w-3 h-3" /> Outbound</span>
        </button>
      </div>

      <div className="bg-[#050505] border border-[#222] rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div className="relative group w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input aria-label="Search call recordings" 
              type="text" 
              placeholder="Search recordings..." 
              className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 border border-[#333] text-slate-400 hover:text-white hover:bg-[#111] rounded-lg transition-colors flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table aria-label="Call recordings audit table" className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 bg-[#111] uppercase border-b border-[#222] sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Call ID / Type</th>
                <th scope="col" className="px-6 py-4 font-semibold">Customer</th>
                <th scope="col" className="px-6 py-4 font-semibold">Agent</th>
                <th scope="col" className="px-6 py-4 font-semibold">Duration</th>
                <th scope="col" className="px-6 py-4 font-semibold">Date & Time</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Playback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block"></span>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record, idx) => {
                  const customerDisplay = record.customerName || record.customerDetails?.name || record.callerName || (record.customerPhone && record.customerPhone !== 'Unknown' ? record.customerPhone : (record.callerPhone && record.callerPhone !== 'Unknown' ? record.callerPhone : 'Customer'));
                  const agentDisplay = record.agentName || record.handlingAgent?.name || record.originalAgent?.name || 'Agent';
                  const rawDate = record.timestamp || record.startedAt || record.date || record.createdAt;
                  const dateObj = rawDate ? new Date(rawDate) : null;
                  const dateDisplay = dateObj && !isNaN(dateObj.getTime())
                    ? `${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}, ${dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                    : '—';
                  const displayId = (record.callSid || record.id || '').replace(/^call_outbound_/, 'OUT-').replace(/^call_inbound_/, 'IN-');
                  const shortId = displayId.length > 12 ? `${displayId.substring(0, 10)}...` : displayId;
                  const durationVal = record.duration || record.connectedDuration || 0;

                  return (
                    <tr key={record.id || idx} className="hover:bg-[#111] transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-300">
                        <div className="flex items-center gap-2">
                          {record.direction === 'INBOUND' ? (
                            <PhoneIncoming className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4 text-blue-500" />
                          )}
                          <span title={record.callSid || record.id}>{shortId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{customerDisplay}</td>
                      <td className="px-6 py-4 text-slate-400">{agentDisplay}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDuration(durationVal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {dateDisplay}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {record.recordingStatus === 'READY' && record.recordingUrl ? (
                          <div className="flex items-center justify-end gap-2">
                            <audio 
                              src={record.recordingUrl} 
                              controls 
                              className="w-48 h-8 rounded-lg outline-none" 
                              preload="metadata"
                              crossOrigin="anonymous"
                              onLoadStart={(e) => console.log(`[RECORDING-PLAYER] event=loadStart callId=${record.id} srcPresent=${!!e.currentTarget.src}`)}
                              onLoadedMetadata={(e) => console.log(`[RECORDING-PLAYER] event=loadedMetadata callId=${record.id} duration=${e.currentTarget.duration}`)}
                              onCanPlay={(e) => console.log(`[RECORDING-PLAYER] event=canPlay callId=${record.id} readyState=${e.currentTarget.readyState}`)}
                              onError={(e) => console.error(`[RECORDING-PLAYER] event=error callId=${record.id} networkState=${e.currentTarget.networkState} errorCode=${e.currentTarget.error?.code} errorMessage=${e.currentTarget.error?.message}`)}
                            />
                          </div>
                        ) : record.recordingStatus === 'PROCESSING' ? (
                          <span className="text-xs text-amber-500 font-medium inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Processing Recording...
                          </span>
                        ) : record.recordingStatus === 'FAILED' ? (
                          <span className="text-xs text-rose-500 font-medium">Recording Failed</span>
                        ) : (
                          <span className="text-xs text-slate-500">No Recording</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Mic className="w-12 h-12 mb-4 text-slate-700 opacity-50" />
                      <p className="text-base font-medium text-white mb-1">No recordings found</p>
                      <p className="text-sm">Active WebRTC calls will be automatically recorded and archived here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
