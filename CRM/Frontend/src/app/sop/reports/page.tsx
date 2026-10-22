"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  RefreshCw,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Filter,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { SopNav } from '@/components/sop/SopNav';
import { apiFetch, API_BASE_URL } from '@/lib/api';

export default function SopReportsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const fetchReports = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/v1/sop/reports`;
      if (departmentFilter !== 'ALL') url += `?department=${departmentFilter}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load SOP reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [departmentFilter]);

  const summary = data?.summary || {};
  const departmentPerformance = data?.departmentPerformance || [];
  const auditEvents = data?.auditEvents || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden">
      <SopNav />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Operational Intelligence
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">SOP Reports & Audit History</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-department operational compliance, SLA completion rates, and tamper-evident workflow audit logging.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReports}
              className="p-2 rounded-xl bg-[#141416] hover:bg-[#1e1e22] text-slate-400 hover:text-white border border-[#222] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Summary KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4">
            <span className="text-xs text-slate-500 font-medium block">Total SOP Instances</span>
            <span className="text-2xl font-bold text-white mt-1 block">{summary.totalTasks || 0}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Persisted Executions</span>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4">
            <span className="text-xs text-slate-500 font-medium block">Overall SLA Completion</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">
              {summary.overallCompletionRate || 0}%
            </span>
            <span className="text-[10px] text-emerald-500/80 mt-0.5 block">
              {summary.completedTasks || 0} Tasks Finalized
            </span>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4">
            <span className="text-xs text-slate-500 font-medium block">Overdue Breaches</span>
            <span className="text-2xl font-bold text-rose-400 mt-1 block">{summary.overdueTasks || 0}</span>
            <span className="text-[10px] text-rose-500/80 mt-0.5 block">Exceeded Escalation SLA</span>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4">
            <span className="text-xs text-slate-500 font-medium block">Blocked Tasks</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{summary.blockedTasks || 0}</span>
            <span className="text-[10px] text-amber-500/80 mt-0.5 block">Awaiting Resolution</span>
          </div>
        </div>

        {/* Department Performance Matrix */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-5 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            Departmental Operational Performance & SLA Rates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {departmentPerformance.map((dept: any) => (
              <div
                key={dept.department}
                className="bg-[#141416] border border-[#222] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">{dept.department}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {dept.completionRate}%
                  </span>
                </div>

                <div className="w-full bg-[#1c1c1f] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${dept.completionRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#1e1e22]">
                  <span>Total: <strong>{dept.total}</strong></span>
                  <span>Completed: <strong className="text-emerald-400">{dept.completed}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Audit Trail History */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Immutable Workflow Event Audit Trail
            </h2>
            <span className="text-xs text-slate-500 font-mono">Last 30 Events</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading audit events...</div>
          ) : auditEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No audit events recorded yet.</div>
          ) : (
            <div className="divide-y divide-[#1e1e22]">
              {auditEvents.map((evt: any) => (
                <div key={evt.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e1e22] text-slate-300">
                        {evt.eventType}
                      </span>
                      <span className="font-semibold text-white">{evt.action}</span>
                      {evt.execution?.taskNumber && (
                        <span className="font-mono text-[11px] text-primary">
                          ({evt.execution.taskNumber})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Actor: <strong className="text-slate-400">{evt.actorEmail || 'System'}</strong></span>
                      {evt.fromDepartment && (
                        <span>From: <strong className="text-slate-400">{evt.fromDepartment}</strong></span>
                      )}
                      {evt.toDepartment && (
                        <span>To: <strong className="text-slate-400">{evt.toDepartment}</strong></span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(evt.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
