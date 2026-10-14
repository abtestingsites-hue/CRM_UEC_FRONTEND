"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Sparkles, Brain, FileText, Download, ChevronDown, ChevronUp, Clock, MessageSquare, CheckCircle, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AICallSummaryPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    import('@/lib/api').then(({ apiFetch }) => {
      apiFetch('/api/v1/analytics/summaries')
        .then(res => res.json())
      .then(data => {
        setSummaries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch AI summaries', err);
        setLoading(false);
      });
    });
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else setExpandedId(id);
  };

  return (
    <div className="flex-1 p-6 h-full overflow-y-auto custom-scrollbar bg-[#050505]">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="text-primary w-6 h-6" /> AI Call Summaries
          </h1>
          <p className="text-sm text-slate-500">Automated transcriptions and sentiment analysis from recent calls</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors text-sm font-medium">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg"><Brain className="w-5 h-5 text-primary" /></div>
            <h3 className="text-slate-400 font-medium text-sm">Calls Analyzed</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">{summaries.length}</p>
          <p className="text-xs text-emerald-500 mt-2">Real-time processing active</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg"><Activity className="w-5 h-5 text-purple-500" /></div>
            <h3 className="text-slate-400 font-medium text-sm">Avg Sentiment Score</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">
            {summaries.length > 0 ? (summaries.reduce((a, b) => a + (b.sentimentScore || 5), 0) / summaries.length).toFixed(1) : '0.0'} / 10
          </p>
          <p className="text-xs text-emerald-500 mt-2">Overall positive trend</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg"><FileText className="w-5 h-5 text-amber-500" /></div>
            <h3 className="text-slate-400 font-medium text-sm">Time Saved (Est.)</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">{summaries.length * 5} mins</p>
          <p className="text-xs text-slate-500 mt-2">Via auto-note & action generation</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Recent AI Intelligence Logs</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500">
          <span className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mr-3"></span>
          Loading AI insights...
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-16 bg-[#0a0a0a] rounded-xl border border-[#1e1e1e] text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No processed calls found.</p>
          <p className="text-xs mt-1">Make a call to trigger the AI Intelligence pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {summaries.map(item => {
            const isExpanded = expandedId === item.id;
            const customerName = item.callSession?.customer?.name || item.callSession?.customer?.phone || 'Unknown Caller';
            const agentName = item.callSession?.participants?.[0]?.agent?.name || 'Unassigned';
            const dateStr = new Date(item.createdAt).toLocaleString();
            
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
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {dateStr}</span>
                      <span>•</span>
                      <span>Agent: {agentName}</span>
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
                      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-[#1e1e1e]">
                        
                        {/* Left Column: Summary & Insights */}
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
                                <CheckCircle className="w-4 h-4 text-emerald-500" /> Extracted Action Items
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

                          {item.followUpRecommendation && (
                            <div className="bg-[#111] border border-[#222] p-4 rounded-xl">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" /> Follow-up Recommendation
                              </h4>
                              <p className="text-sm text-slate-300">
                                {item.followUpRecommendation}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Transcript & Translation */}
                        <div className="flex flex-col gap-4">
                          <div className="bg-[#111] border border-[#222] p-4 rounded-xl h-full flex flex-col">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-purple-500" /> Speech-to-Text & Translation
                            </h4>
                            
                            <div className="flex-1 space-y-4">
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  Original Speech ({item.detectedLanguage || 'Unknown'})
                                </div>
                                <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-slate-300 font-medium">
                                  {item.originalTranscript || 'No transcript available.'}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Languages className="w-3 h-3" /> English Translation
                                </div>
                                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-sm text-blue-100">
                                  {item.englishTranslation || 'No translation available.'}
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
