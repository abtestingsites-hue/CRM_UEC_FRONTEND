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
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '@/lib/api';

export function QueueOperationsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE_URL}/telephony/queue/operations`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load queue operations dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    if (!autoRefresh) return;
    const interval = setInterval(fetchOperations, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

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
              Contact-Center Queue Engine & Concurrency
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time atomic reservation telemetry, queue depth, and agent availability state.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-[#1a1a1e] border-[#333] text-emerald-500 focus:ring-emerald-500/20"
            />
            Auto-refresh (10s)
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

      {/* Agent Telephony Status Breakdown Bar */}
      <div className="bg-[#0c0c0e] border border-[#222] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Agent Availability Breakdown ({agents.total} Total Configured)
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {agents.available} Available
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {agents.busy} Busy / In-Call
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {agents.break + agents.wrapUp} Pause / Wrap
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              {agents.offline} Offline
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#18181b] h-3 rounded-full overflow-hidden flex">
          {agents.total > 0 && (
            <>
              <div
                style={{ width: `${(agents.available / agents.total) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`${agents.available} Available`}
              />
              <div
                style={{ width: `${(agents.busy / agents.total) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`${agents.busy} Busy`}
              />
              <div
                style={{ width: `${((agents.break + agents.wrapUp) / agents.total) * 100}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`${agents.break + agents.wrapUp} Break/Wrap`}
              />
              <div
                style={{ width: `${(agents.offline / agents.total) * 100}%` }}
                className="bg-slate-700 h-full transition-all"
                title={`${agents.offline} Offline`}
              />
            </>
          )}
        </div>
      </div>

      {/* Queue Concurrency & Mutex Hardening Info */}
      <div className="bg-[#0a0a0c] border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-2">
            Phase 16 Hardened Queue Engine Active
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Atomic Mutex + PostgreSQL Isolation
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Every agent allocation uses an atomic Redis lock (<code className="text-emerald-300">SET lock:agent:&#123;id&#125;:reservation EX 25 NX</code>) coupled with a serializable database transaction. Concurrent inbound calls cannot double-assign a single agent. If an agent fails to answer within the 25-second ring timeout, the reservation is automatically released and routed to backup overflow.
          </p>
        </div>
      </div>

      {/* Agent Roster Live Status Table */}
      <div className="bg-[#0c0c0e] border border-[#222] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Live Agent Dispatch Telemetry
          </h3>
          <span className="text-xs text-slate-500">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141416] text-slate-400 uppercase font-semibold border-b border-[#222]">
              <tr>
                <th className="p-3">Agent</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Active Calls</th>
                <th className="p-3">Socket Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e22]">
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No agents registered in contact center roster.
                  </td>
                </tr>
              ) : (
                roster.map((agent: any) => (
                  <tr key={agent.id} className="hover:bg-[#141416]/50 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      {agent.name}
                    </td>
                    <td className="p-3 text-slate-400">
                      {agent.department}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        agent.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : agent.status === 'BUSY'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : agent.status === 'BREAK' || agent.status === 'WRAP_UP'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {agent.activeCalls || 0} / 1
                    </td>
                    <td className="p-3">
                      {agent.isOnline ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                          Offline
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
