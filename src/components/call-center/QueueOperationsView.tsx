"use client";

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Clock,
  PhoneCall,
  CheckCircle2,
  PhoneMissed,
  PhoneOff,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Radio,
  Lock,
  Sliders,
  PhoneForwarded,
  Layers,
  Zap,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '@/lib/api';

export function QueueOperationsView() {
  const [data, setData] = useState<any>(null);
  const [capacity, setCapacity] = useState<any>(null);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'queue' | 'callbacks'>('roster');

  // Capacity edit modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editTotalChannels, setEditTotalChannels] = useState(3);
  const [editInboundReserved, setEditInboundReserved] = useState(1);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const [opsRes, capRes, cbRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/telephony/queue/operations`).catch(() => null),
        apiFetch(`${API_BASE_URL}/telephony/capacity/status?provider=vobiz`).catch(() => null),
        apiFetch(`${API_BASE_URL}/telephony/queue/callbacks`).catch(() => null),
      ]);

      if (opsRes && opsRes.ok) {
        const json = await opsRes.json();
        setData(json);
      }

      if (capRes && capRes.ok) {
        const capJson = await capRes.json();
        setCapacity(capJson?.data);
        if (capJson?.data) {
          setEditTotalChannels(capJson.data.totalChannels || 3);
          setEditInboundReserved(capJson.data.inboundReserved || 1);
        }
      }

      if (cbRes && cbRes.ok) {
        const cbJson = await cbRes.json();
        setCallbacks(Array.isArray(cbJson) ? cbJson : []);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load queue operations dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    if (!autoRefresh) return;
    const interval = setInterval(fetchOperations, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleSaveCapacityConfig = async () => {
    try {
      setIsSavingConfig(true);
      const res = await apiFetch(`${API_BASE_URL}/telephony/capacity/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'vobiz',
          totalChannels: Number(editTotalChannels),
          inboundReserved: Number(editInboundReserved),
          maxOutboundChannels: Math.max(Number(editTotalChannels) - Number(editInboundReserved), 1),
        }),
      });

      if (res.ok) {
        setShowConfigModal(false);
        await fetchOperations();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update capacity');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      const res = await apiFetch(`${API_BASE_URL}/telephony/capacity/reconcile?provider=vobiz`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchOperations();
      }
    } catch (e: any) {
      console.error('Reconciliation error', e);
    } finally {
      setReconciling(false);
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const agents = data?.agents || { available: 0, busy: 0, break: 0, wrapUp: 0, offline: 0, total: 0 };
  const metrics = data?.metricsToday || { offered: 0, answered: 0, missed: 0, abandoned: 0, answerRate: 100 };
  const roster = data?.agentRoster || [];
  const waitingDetails = data?.waitingQueueDetails || [];

  const capTotal = capacity?.totalChannels || 3;
  const capActive = capacity?.totalActive || 0;
  const capAvailable = capacity?.availableChannels ?? Math.max(capTotal - capActive, 0);
  const capUtil = capacity?.utilizationPercent ?? Math.round((capActive / capTotal) * 100);
  const isThrottled = capacity?.isThrottled || (waitingDetails.length > 0 && capAvailable <= 1);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5 space-y-6 custom-scrollbar text-white">
      {/* Header with Live Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Telephony Concurrency & Inbound Queue Orchestrator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time capacity orchestration, atomic agent reservation, and priority queue management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-xs font-semibold text-slate-200 border border-[#333] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Capacity Policy ({capTotal} Channels)
          </button>
          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-xs font-semibold text-slate-200 border border-[#333] transition-colors disabled:opacity-50"
            title="Flush stale sessions & synchronize database with provider"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${reconciling ? 'animate-spin' : ''}`} />
            Reconcile
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-[#1a1a1e] border-[#333] text-emerald-500 focus:ring-emerald-500/20"
            />
            Auto-refresh (8s)
          </label>
          <button
            onClick={fetchOperations}
            className="p-2 rounded-xl bg-[#141416] hover:bg-[#1e1e22] text-slate-400 hover:text-white border border-[#222] transition-colors"
            title="Refresh Now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* GLOBAL TELEPHONY CONCURRENCY & CAPACITY PANEL */}
      <div className="bg-gradient-to-r from-[#0c0d10] via-[#0f1115] to-[#0c0d10] border border-[#272a30] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1f2228]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Provider Concurrency Capacity Pool
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  {capacity?.provider || 'Vobiz'} PSTN TRUNK
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Configurable runtime capacity limit: {capTotal} channels total • {capacity?.inboundReserved || 1} reserved for inbound
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isThrottled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                OUTBOUND THROTTLED (INBOUND PRIORITY)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                CAPACITY OPTIMAL
              </span>
            )}
          </div>
        </div>

        {/* Capacity Breakdown Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-[#121418] p-3 rounded-lg border border-[#22252b]">
            <span className="text-[11px] text-slate-400 block">Total Account Channels</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{capTotal}</span>
              <span className="text-[11px] text-slate-500">simultaneous</span>
            </div>
          </div>

          <div className="bg-[#121418] p-3 rounded-lg border border-[#22252b]">
            <span className="text-[11px] text-slate-400 block">Active Inbound Channels</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{capacity?.activeInbound || 0}</span>
              <span className="text-[11px] text-slate-500">in-use</span>
            </div>
          </div>

          <div className="bg-[#121418] p-3 rounded-lg border border-[#22252b]">
            <span className="text-[11px] text-slate-400 block">Active Outbound Calls</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-400">{capacity?.activeOutbound || 0}</span>
              <span className="text-[11px] text-slate-500">max: {capacity?.maxOutboundChannels || 2}</span>
            </div>
          </div>

          <div className="bg-[#121418] p-3 rounded-lg border border-[#22252b]">
            <span className="text-[11px] text-slate-400 block">Available Trunk Channels</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${capAvailable > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {capAvailable}
              </span>
              <span className="text-[11px] text-slate-500">free</span>
            </div>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Utilization: {capUtil}% ({capActive} / {capTotal} channels held)</span>
            <span>Free Capacity: {capAvailable}</span>
          </div>
          <div className="w-full bg-[#181a1f] h-2.5 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${Math.min(capUtil, 100)}%` }}
              className={`h-full transition-all duration-500 ${
                capUtil >= 90 ? 'bg-rose-500' : capUtil >= 66 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Top 4 Real-time KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiting Calls */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Waiting Calls (Queue Depth)</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {data?.waitingCalls ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Active Queues: {data?.activeQueues ?? 1}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${
            (data?.waitingCalls ?? 0) > 0
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-[#18181b] text-slate-400 border-[#2a2a2d]'
          }`}>
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Oldest Wait */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Oldest Wait Time</span>
            <span className={`text-3xl font-extrabold mt-1 block ${
              (data?.oldestWaitSeconds ?? 0) > 60 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {formatSeconds(data?.oldestWaitSeconds ?? 0)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Max SLA: 60s
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Answer Rate */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Answer Rate (Today)</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {metrics.answerRate}%
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {metrics.answered} answered / {metrics.offered} offered
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Missed / Abandoned */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Missed / Abandoned</span>
            <span className="text-3xl font-extrabold text-rose-400 mt-1 block">
              {metrics.missed + metrics.abandoned}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {metrics.missed} missed • {metrics.abandoned} abandoned
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <PhoneMissed className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs: Agent Roster vs. Live Queue Items vs. Callbacks */}
      <div className="flex items-center gap-2 border-b border-[#222]">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'roster'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Agent Dispatch Roster ({roster.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Waiting Inbound Calls ({waitingDetails.length})
          {waitingDetails.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              {waitingDetails.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('callbacks')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'callbacks'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Overflow Callback Requests ({callbacks.length})
        </button>
      </div>

      {/* TAB CONTENT 1: WAITING INBOUND CALLS TABLE */}
      {activeTab === 'queue' && (
        <div className="bg-[#0c0c0e] border border-[#222] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Live Waiting Calls in Queue
            </h3>
            <span className="text-xs text-slate-400">
              Auto-dequeued by worker engine every 3 seconds
            </span>
          </div>

          {waitingDetails.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No callers currently waiting in queue. Inbound calls are being directly connected to agents.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141416] text-slate-400 uppercase font-semibold text-[10px] border-b border-[#222]">
                  <tr>
                    <th className="px-4 py-3">Queue ID</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Wait Duration</th>
                    <th className="px-4 py-3">Entered At</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e22]">
                  {waitingDetails.map((item: any) => (
                    <tr key={item.id} className="hover:bg-[#121215] transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {item.callSessionId ? item.callSessionId.substring(0, 8) : item.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.priority === 'EMERGENCY'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.department}</td>
                      <td className="px-4 py-3 font-mono text-amber-400 font-bold">
                        {formatSeconds(item.waitSeconds)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(item.enteredAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          WAITING AGENT
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: OVERFLOW CALLBACK REQUESTS TABLE */}
      {activeTab === 'callbacks' && (
        <div className="bg-[#0c0c0e] border border-[#222] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PhoneForwarded className="w-4 h-4 text-blue-400" />
              Overflow Callback Requests
            </h3>
            <span className="text-xs text-slate-400">
              Generated when callers time out in queue or capacity is full
            </span>
          </div>

          {callbacks.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No pending callback requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141416] text-slate-400 uppercase font-semibold text-[10px] border-b border-[#222]">
                  <tr>
                    <th className="px-4 py-3">Phone Number</th>
                    <th className="px-4 py-3">Caller Name</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Requested At</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e22]">
                  {callbacks.map((cb: any) => (
                    <tr key={cb.id} className="hover:bg-[#121215] transition-colors">
                      <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{cb.phoneNumber}</td>
                      <td className="px-4 py-3 text-slate-300">{cb.customerName || 'Customer'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                          {cb.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{cb.department || 'GENERAL'}</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(cb.requestedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            await apiFetch(`${API_BASE_URL}/telephony/queue/callbacks/${cb.id}/process`, { method: 'POST' });
                            fetchOperations();
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                        >
                          Mark Processed
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: AGENT ROSTER TABLE */}
      {activeTab === 'roster' && (
        <div className="bg-[#0c0c0e] border border-[#222] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Live Agent Dispatch Telemetry
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {roster.filter((a: any) => a.isOnline).length} / {roster.length} Sockets Connected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141416] text-slate-400 uppercase font-semibold text-[10px] border-b border-[#222]">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active Calls</th>
                  <th className="px-4 py-3">WebRTC Socket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e22]">
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No agents configured in roster.
                    </td>
                  </tr>
                ) : (
                  roster.map((agent: any) => (
                    <tr key={agent.id} className="hover:bg-[#121215] transition-colors">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          agent.status === 'AVAILABLE' ? 'bg-emerald-400' :
                          agent.status === 'BUSY' ? 'bg-rose-400' :
                          agent.status === 'BREAK' || agent.status === 'WRAP_UP' ? 'bg-amber-400' :
                          'bg-slate-600'
                        }`} />
                        {agent.name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{agent.department}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          agent.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300' :
                          agent.status === 'BUSY' ? 'bg-rose-500/20 text-rose-300' :
                          agent.status === 'BREAK' || agent.status === 'WRAP_UP' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-300">
                        {agent.activeCalls}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${
                          agent.isOnline ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          {agent.isOnline ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAPACITY CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121316] border border-[#2a2c32] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Runtime Capacity Orchestration Policy</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Configure global telephony limits across inbound & outbound traffic.
              Changes apply immediately to all horizontally scaled workers without redeploying code.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Total Telephony Account Channels ($C_{'total'}$)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={editTotalChannels}
                  onChange={(e) => setEditTotalChannels(parseInt(e.target.value || '1', 10))}
                  className="w-full bg-[#181a1f] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Current provider allocation: 3 (Upgrade to 10, 30, or 100+ anytime).
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Inbound Reserved Channel Floor ($C_{'inbound_reserve'}$)
                </label>
                <input
                  type="number"
                  min="0"
                  max={editTotalChannels - 1}
                  value={editInboundReserved}
                  onChange={(e) => setEditInboundReserved(parseInt(e.target.value || '0', 10))}
                  className="w-full bg-[#181a1f] border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Guaranteed channels reserved exclusively for incoming customer calls.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#181a1f] border border-[#26282e] space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">Resulting Policy Limits:</span>
                <div className="flex justify-between font-mono text-slate-300 text-[11px]">
                  <span>Max Concurrent Outbound:</span>
                  <span className="text-blue-400 font-bold">{Math.max(editTotalChannels - editInboundReserved, 1)}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-300 text-[11px]">
                  <span>Outbound Throttler Trigger:</span>
                  <span className="text-amber-400 font-bold">Queue Depth &gt; 0</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg bg-[#1e2024] hover:bg-[#282a30] text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCapacityConfig}
                disabled={isSavingConfig}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors disabled:opacity-50"
              >
                {isSavingConfig ? 'Saving...' : 'Apply Runtime Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
