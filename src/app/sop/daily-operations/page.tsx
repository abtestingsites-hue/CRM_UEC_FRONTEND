"use client";

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { SopNav } from '@/components/sop/SopNav';
import { SopTaskModal } from '@/components/sop/SopTaskModal';
import { SopCreateTaskModal } from '@/components/sop/SopCreateTaskModal';
import { SopHandoffModal } from '@/components/sop/SopHandoffModal';
import { apiFetch, API_BASE_URL } from '@/lib/api';

export default function DailyOperationsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [handoffTask, setHandoffTask] = useState<any | null>(null);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);

  const fetchDailyOps = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/v1/sop/daily-operations`;
      if (departmentFilter !== 'ALL') url += `?department=${departmentFilter}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load daily operations data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyOps();
  }, [departmentFilter]);

  const handleOpenTask = async (task: any) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/executions/${task.id}`);
      if (res.ok) {
        const fullTask = await res.json();
        setSelectedTask(fullTask);
        setIsTaskModalOpen(true);
      } else {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
      }
    } catch {
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const summary = data?.summary || {};
  const morningHandovers = data?.morningHandovers || [];
  const criticalActionItems = data?.criticalActionItems || [];
  const standardOperations = data?.standardOperations || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden">
      <SopNav badgeCounts={{ daily: summary.totalDailyTasks }} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Daily Operations
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Today's Shift Roster & Operational Run</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active shift schedule: morning handovers, critical action deadlines, and routine department operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDailyOps}
              className="p-2 rounded-xl bg-[#141416] hover:bg-[#1e1e22] text-slate-400 hover:text-white border border-[#222] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
            >
              <Plus className="w-4 h-4" />
              Add Daily Task
            </button>
          </div>
        </div>

        {/* Shift Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Tasks for Shift</span>
              <span className="text-2xl font-bold text-white mt-1 block">{summary.totalDailyTasks || 0}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#18181b] text-slate-400 border border-[#2a2a2d]">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Completed Today</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">{summary.completedToday || 0}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Critical Open Items</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block">{summary.criticalOpen || 0}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" /> Department:
          </span>
          {['ALL', 'HR', 'CCR', 'SALES', 'DATA_ENTRY'].map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                departmentFilter === dept
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#141416] text-slate-400 hover:text-white border border-[#222]'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>

        {/* Section 1: Morning Shift Handover & Acknowledgement */}
        {morningHandovers.length > 0 && (
          <div className="bg-[#0f0f11] border border-amber-500/30 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm">
              <Clock className="w-4 h-4" />
              Shift Handovers & Pending Acknowledgements
            </div>
            <div className="divide-y divide-[#1e1e22]">
              {morningHandovers.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(task)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-[#141416] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-primary">{task.taskNumber}</span>
                    <span className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {task.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-[#1e1e22] text-slate-400">
                      {task.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {task.assignedAgent?.name || 'Unassigned'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Critical Urgent Action Items */}
        {criticalActionItems.length > 0 && (
          <div className="bg-[#0f0f11] border border-rose-500/30 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              Critical Action Items (High & Urgent Priority)
            </div>
            <div className="divide-y divide-[#1e1e22]">
              {criticalActionItems.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(task)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-[#141416] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-rose-400 font-semibold">{task.taskNumber}</span>
                    <span className="text-xs font-semibold text-white group-hover:text-rose-400 transition-colors">
                      {task.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleTimeString() : 'Today'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Standard Daily Operations */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              Standard Shift Run ({standardOperations.length} Tasks)
            </h2>
          </div>

          <div className="divide-y divide-[#1e1e22]">
            {standardOperations.map((task: any) => (
              <div
                key={task.id}
                onClick={() => handleOpenTask(task)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#141416] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-primary">{task.taskNumber}</span>
                  <span className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {task.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-[#1e1e22] text-slate-400">
                    {task.department}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">
                    {task.assignedAgent?.name || 'Unassigned'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedTask && (
        <SopTaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={() => {
            fetchDailyOps();
            handleOpenTask(selectedTask);
          }}
          onOpenHandoff={(task) => {
            setHandoffTask(task);
            setIsHandoffModalOpen(true);
          }}
        />
      )}

      <SopCreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={fetchDailyOps}
      />

      {handoffTask && (
        <SopHandoffModal
          task={handoffTask}
          isOpen={isHandoffModalOpen}
          onClose={() => {
            setIsHandoffModalOpen(false);
            setHandoffTask(null);
          }}
          onHandoffComplete={fetchDailyOps}
        />
      )}
    </div>
  );
}
