"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Phone, PhoneIncoming, PhoneOutgoing, Search, Filter, 
  Calendar, Clock, User, Shield, Play, FileText, 
  RefreshCw, CheckCircle2, AlertTriangle, ArrowUpDown, 
  ChevronLeft, ChevronRight, Share2, Layers
} from 'lucide-react';
import { api } from '@/lib/api';
import { CallHistoryDrawer } from '@/components/call-center/CallHistoryDrawer';
import { Sidebar } from '@/components/Sidebar';

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group filter
  const [activeGroup, setActiveGroup] = useState<'all' | 'today' | 'yesterday' | 'earlierThisWeek' | 'previousWeeks' | 'older'>('all');
  const [groupCounts, setGroupCounts] = useState({
    today: 0,
    yesterday: 0,
    earlierThisWeek: 0,
    previousWeeks: 0,
    older: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [recordingOnly, setRecordingOnly] = useState('');
  const [transferOnly, setTransferOnly] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selected call for drawer
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter options
  const [departments, setDepartments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // Fetch departments & agents for dropdown filters
  useEffect(() => {
    api.get('/telephony/departments')
      .then((res) => {
        if (res?.departments) setDepartments(res.departments);
        if (res?.allAgents) setAgents(res.allAgents);
      })
      .catch((e) => console.warn('Could not load filter metadata:', e));
  }, []);

  const loadCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (activeGroup !== 'all') params.set('group', activeGroup);
      if (search) params.set('search', search);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedDirection) params.set('direction', selectedDirection);
      if (selectedDepartment) params.set('department', selectedDepartment);
      if (selectedAgent) params.set('agentId', selectedAgent);
      if (recordingOnly) params.set('recordingAvailable', recordingOnly);
      if (transferOnly) params.set('transferStatus', transferOnly);

      const res = await api.get(`/telephony/call-history?${params.toString()}`);
      if (res && res.calls) {
        setCalls(res.calls);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalRecords(res.pagination?.total || 0);
        if (res.groupCounts) {
          setGroupCounts(res.groupCounts);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load call history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeGroup, search, selectedStatus, selectedDirection, selectedDepartment, selectedAgent, recordingOnly, transferOnly]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedDirection('');
    setSelectedDepartment('');
    setSelectedAgent('');
    setRecordingOnly('');
    setTransferOnly('');
    setPage(1);
    setActiveGroup('all');
  };

  const openCallDetail = (id: string) => {
    setSelectedCallId(id);
    setIsDrawerOpen(true);
  };

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#070707]">
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-[#1a1a1a] bg-[#090909] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-500" />
              Comprehensive Call Logs & History
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live persisted records, audit timelines, authenticated recording playback, and transfer analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadCalls()}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#262626] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Date Group Tabs */}
        <div className="px-6 pt-3 border-b border-[#161616] bg-[#090909] flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          {[
            { id: 'all', label: 'All History', count: totalRecords },
            { id: 'today', label: 'Today', count: groupCounts.today },
            { id: 'yesterday', label: 'Yesterday', count: groupCounts.yesterday },
            { id: 'earlierThisWeek', label: 'Earlier This Week', count: groupCounts.earlierThisWeek },
            { id: 'previousWeeks', label: 'Previous Weeks', count: groupCounts.previousWeeks },
            { id: 'older', label: 'Older History', count: groupCounts.older },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveGroup(tab.id as any);
                setPage(1);
              }}
              className={`pb-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 flex items-center gap-1.5 transition-all ${
                activeGroup === tab.id
                  ? 'border-orange-500 text-orange-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeGroup === tab.id
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-[#181818] text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3 border-b border-[#161616] bg-[#0c0c0c] flex flex-wrap items-center gap-2.5 shrink-0 text-xs">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by caller, phone, SID or lead..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-[#141414] border border-[#222] rounded-xl text-white placeholder-slate-500 text-xs outline-none focus:border-orange-500"
            />
          </div>

          {/* Direction */}
          <select
            value={selectedDirection}
            onChange={(e) => {
              setSelectedDirection(e.target.value);
              setPage(1);
            }}
            className="bg-[#141414] border border-[#222] rounded-xl px-3 py-1.5 text-slate-300 text-xs outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">All Directions</option>
            <option value="INBOUND">Inbound</option>
            <option value="OUTBOUND">Outbound</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-[#141414] border border-[#222] rounded-xl px-3 py-1.5 text-slate-300 text-xs outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="CONNECTED">Connected</option>
            <option value="MISSED">Missed</option>
            <option value="UNANSWERED">Unanswered</option>
            <option value="BUSY">Busy</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="TRANSFERRED">Transferred</option>
          </select>

          {/* Department */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setPage(1);
            }}
            className="bg-[#141414] border border-[#222] rounded-xl px-3 py-1.5 text-slate-300 text-xs outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id || dept.name} value={dept.name}>{dept.name}</option>
            ))}
          </select>

          {/* Agent */}
          <select
            value={selectedAgent}
            onChange={(e) => {
              setSelectedAgent(e.target.value);
              setPage(1);
            }}
            className="bg-[#141414] border border-[#222] rounded-xl px-3 py-1.5 text-slate-300 text-xs outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">All Agents</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>{ag.name}</option>
            ))}
          </select>

          {/* Recording Availability */}
          <select
            value={recordingOnly}
            onChange={(e) => {
              setRecordingOnly(e.target.value);
              setPage(1);
            }}
            className="bg-[#141414] border border-[#222] rounded-xl px-3 py-1.5 text-slate-300 text-xs outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">Recording Status</option>
            <option value="true">Audio Available</option>
            <option value="false">No Audio</option>
          </select>

          {/* Transfer Filter */}
          <select
            value={transferOnly}
            onChange={(e) => {
              setTransferOnly(e.target.value);
              setPage(1);
            }}
            className="bg-[#141414] border border-[#222] rounded-xl px-3 py-1.5 text-slate-300 text-xs outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">Transfer Status</option>
            <option value="TRANSFERRED">Transferred Only</option>
            <option value="NOT_TRANSFERRED">Direct Only</option>
          </select>

          {/* Reset */}
          {(search || selectedStatus || selectedDirection || selectedDepartment || selectedAgent || recordingOnly || transferOnly || activeGroup !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Call Logs Table */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading call history logs...</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
              <Phone className="w-8 h-8 text-slate-600 mb-1" />
              <h3 className="text-sm font-bold text-white">No Call Logs Found</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No call sessions matched the selected date grouping and filter criteria. Try resetting filters.
              </p>
            </div>
          ) : (
            <div className="border border-[#1e1e1e] rounded-2xl overflow-hidden bg-[#0d0d0d] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131313] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#1e1e1e]">
                    <tr>
                      <th className="py-3.5 px-4">Contact / Caller</th>
                      <th className="py-3.5 px-4">Direction</th>
                      <th className="py-3.5 px-4">Start Time</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Agent & Dept</th>
                      <th className="py-3.5 px-4">Recording</th>
                      <th className="py-3.5 px-4">Disposition</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181818] text-slate-300">
                    {calls.map((call) => (
                      <tr 
                        key={call.id}
                        onClick={() => openCallDetail(call.id)}
                        className="hover:bg-[#161616] cursor-pointer transition-colors group"
                      >
                        {/* Caller */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-orange-400 transition-colors">
                            {call.callerName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {call.callerPhone}
                          </div>
                          {call.leadName && (
                            <span className="text-[10px] text-orange-400/80 font-medium truncate block max-w-[150px]">
                              Lead: {call.leadName}
                            </span>
                          )}
                        </td>

                        {/* Direction */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            call.direction === 'INBOUND'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {call.direction === 'INBOUND' ? <PhoneIncoming className="w-2.5 h-2.5" /> : <PhoneOutgoing className="w-2.5 h-2.5" />}
                            {call.direction}
                          </span>
                        </td>

                        {/* Start Time */}
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          <div>{new Date(call.startedAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500">{new Date(call.startedAt).toLocaleTimeString()}</div>
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-white font-semibold">{formatDuration(call.duration)}</span>
                          {call.connectedDuration !== call.duration && (
                            <span className="text-[10px] text-slate-500 block">Talk: {formatDuration(call.connectedDuration)}</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            call.status === 'CONNECTED' || call.status === 'ENDED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : call.status === 'MISSED'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : call.status === 'TRANSFERRED'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {call.status}
                          </span>
                          {call.isTransferred && (
                            <span className="ml-1 text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold">
                              ↳ Transferred
                            </span>
                          )}
                        </td>

                        {/* Agent & Dept */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{call.handlingAgent?.name || 'Unassigned'}</div>
                          <div className="text-[10px] text-slate-500">{call.department || 'General Care'}</div>
                        </td>

                        {/* Recording */}
                        <td className="py-3.5 px-4">
                          {call.recordingStatus === 'READY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Play className="w-2.5 h-2.5 fill-current" /> Audio Ready
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {call.recordingStatus}
                            </span>
                          )}
                        </td>

                        {/* Disposition */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-300 font-medium truncate max-w-[120px] block">
                            {call.disposition || 'Completed'}
                          </span>
                          {call.priority === 'EMERGENCY' && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 inline-block mt-0.5 animate-pulse">
                              🚨 EMERGENCY
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCallDetail(call.id);
                            }}
                            className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-orange-500/10 border border-[#2a2a2a] hover:border-orange-500/30 text-slate-300 hover:text-orange-400 rounded-lg text-[11px] font-bold transition-all"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="px-6 py-3.5 border-t border-[#1e1e1e] bg-[#0f0f0f] flex items-center justify-between text-xs text-slate-400">
                <div>
                  Showing <span className="font-semibold text-white">{calls.length}</span> of{' '}
                  <span className="font-semibold text-white">{totalRecords}</span> calls
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg bg-[#181818] hover:bg-[#222] border border-[#262626] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-xs">
                    Page <span className="text-white font-bold">{page}</span> of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg bg-[#181818] hover:bg-[#222] border border-[#262626] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Call Detail Drawer */}
      <CallHistoryDrawer
        callId={selectedCallId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCallId(null);
        }}
      />
    </div>
  );
}
