"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Sparkles, Brain, FileText, ChevronDown, ChevronUp, Clock, MessageSquare, CheckCircle, Languages, Mic, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallAudioPlayer } from '@/components/recordings/CallAudioPlayer';

export default function AgentAISummary() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    import('@/lib/api').then(({ apiFetch }) => {
      apiFetch('/api/v1/analytics/summaries')
        .then(res => res.json())
        .then(data => {
          setSummaries(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch agent AI summaries', err);
          setLoading(false);
        });
    });
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  const filteredSummaries = summaries.filter(s => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const customer = s.callSession?.customer?.name?.toLowerCase() || '';
    const phone = s.callSession?.customer?.phone || '';
    const summary = s.summary?.toLowerCase() || '';
    return customer.includes(query) || phone.includes(query) || summary.includes(query);
  });

  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#050505]">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="text-primary w-6 h-6" /> AI Call Summaries
          </h1>
          <p className="text-sm text-slate-500">Auto-generated transcripts, audio recordings, and sentiment analysis for your calls.</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="p-3 mb-6 bg-[#0a0a0a] border border-[#222] rounded-xl flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Search call summaries"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, or notes..."
            className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none text-white transition-all placeholder-slate-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="text-white font-medium">{filteredSummaries.length}</span> calls
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500">
          <span className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mr-3"></span>
          Loading your AI call insights...
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-4 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Summaries Found</h3>
          <p className="text-slate-500 max-w-md text-sm">
            {searchQuery ? 'No calls match your search query.' : 'AI summaries will appear here automatically after you complete your calls.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSummaries.map(item => {
            const isExpanded = expandedId === item.id;
            const customerName = item.callSession?.customer?.name || item.callSession?.customer?.phone || 'Unknown Caller';
            const dateStr = new Date(item.createdAt).toLocaleString();
            const callSessionId = item.callSessionId || item.callSession?.id || item.callId;
            const recordingStatus = item.recordingStatus || item.callSession?.recordingStatus;

            return (
              <div key={item.id} className={`bg-[#0a0a0a] border ${isExpanded ? 'border-orange-500/30' : 'border-[#1e1e1e]'} p-5 rounded-xl transition-colors`}>
                {/* Header Row */}
                <div
                  className="flex justify-between items-start cursor-pointer group"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-white">{customerName}</h3>
                      <span className="px-2 py-0.5 bg-[#141414] text-slate-400 border border-[#222] rounded text-[10px] font-bold uppercase tracking-wider">
                        {item.customerIntent || 'General Inquiry'}
                      </span>
                      {item.detectedLanguage && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                          <Languages className="w-3 h-3" /> {item.detectedLanguage}
                        </span>
                      )}
                      {recordingStatus === 'READY' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                          <Mic className="w-3 h-3" /> Audio Ready
                        </span>
                      )}
                      {recordingStatus === 'PROCESSING' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3 animate-spin" /> Processing Audio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {dateStr}</span>
                      <span>•</span>
                      <span>Duration: {item.callSession?.duration || 0}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded border uppercase tracking-wider ${
                      item.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      item.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {item.sentiment || 'Neutral'}
                    </span>
                    <button className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1a1a1a] rounded transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* AI Summary Short */}
                {!isExpanded && (
                  <div className="mt-4 bg-[#111] border border-[#222] p-3 rounded-lg text-sm text-slate-300 line-clamp-2">
                    <strong className="text-orange-500 mr-2">Summary:</strong>
                    {item.summary}
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 pt-6 border-t border-[#1e1e1e] flex flex-col gap-6">
                        {/* Audio Recording Player */}
                        <CallAudioPlayer
                          callId={callSessionId}
                          initialRecordingUrl={item.recordingUrl || item.callSession?.recordingUrl}
                          initialStatus={recordingStatus}
                          duration={item.recordingDuration || item.callSession?.recordingDuration || item.callSession?.duration}
                          customerName={customerName}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column: Summary */}
                          <div className="flex flex-col gap-4">
                            <div className="bg-[#111] border border-[#222] p-4 rounded-xl">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-500" /> AI Executive Summary
                              </h4>
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {item.summary}
                              </p>
                            </div>

                            {item.actionItems && Array.isArray(item.actionItems) && item.actionItems.length > 0 && (
                              <div className="bg-[#111] border border-[#222] p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Action Items
                                </h4>
                                <ul className="space-y-2">
                                  {item.actionItems.map((action: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                      <span className="text-emerald-500 mt-0.5">•</span> {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Transcript */}
                          <div className="flex flex-col gap-4">
                            <div className="bg-[#111] border border-[#222] p-4 rounded-xl h-full flex flex-col">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-purple-500" /> Transcript
                              </h4>
                              <div className="flex-1 space-y-4">
                                <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-slate-300">
                                  {item.originalTranscript || 'No transcript text available.'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
