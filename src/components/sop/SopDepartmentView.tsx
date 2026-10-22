"use client";

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  ArrowRight,
  ShieldCheck,
  Tag,
  Building,
} from 'lucide-react';
import { SopNav } from './SopNav';
import { SopTaskModal } from './SopTaskModal';
import { SopCreateTaskModal } from './SopCreateTaskModal';
import { SopHandoffModal } from './SopHandoffModal';
import { HrOperationsView, SalesOperationsView, CcrOperationsView } from './SopOperationalWorkflows';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface SopDepartmentViewProps {
  department: 'HR' | 'CCR' | 'SALES' | 'DATA_ENTRY';
  title: string;
  subtitle: string;
  categories: string[];
}

export function SopDepartmentView({
  department,
  title,
  subtitle,
  categories,
}: SopDepartmentViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [handoffTask, setHandoffTask] = useState<any | null>(null);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'tasks' | 'operations'>('tasks');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/v1/sop/executions?department=${department}&limit=50`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (selectedCategory !== 'ALL') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load department tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [department, statusFilter, selectedCategory, search]);

  const handleOpenTask = async (task: any) => {
    try {
      // Fetch full task details including checklist responses and events
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

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const pendingApprovalCount = tasks.filter((t) => t.status === 'PENDING_APPROVAL').length;
  const criticalCount = tasks.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'COMPLETED').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden">
      {/* Top Navigation */}
      <SopNav badgeCounts={{ [department.toLowerCase()]: tasks.length }} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {department} Department
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTasks}
              className="p-2 rounded-xl bg-[#141416] hover:bg-[#1e1e22] text-slate-400 hover:text-white border border-[#222] transition-colors"
              title="Refresh Tasks"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
            >
              <Plus className="w-4 h-4" />
              New {department} Task
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center justify-between bg-[#0a0a0c] border border-[#222] p-1.5 rounded-xl">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveViewMode('tasks')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeViewMode === 'tasks'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              SOP Checklists & Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveViewMode('operations')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeViewMode === 'operations'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {department === 'HR' && 'HR Staffing & Verification Pipeline'}
              {department === 'SALES' && 'Sales 11-Stage Pipeline & Targets'}
              {department === 'CCR' && 'CCR Complaints & Caregiver Matching'}
              {department === 'DATA_ENTRY' && 'Data Entry Verification & Staff Stock'}
            </button>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline px-3 font-mono">
            Operational View Mode: {activeViewMode === 'tasks' ? 'Checklists' : 'Live SOP Operations'}
          </span>
        </div>

        {activeViewMode === 'operations' ? (
          <div className="pt-2">
            {department === 'HR' && <HrOperationsView />}
            {department === 'SALES' && <SalesOperationsView />}
            {department === 'CCR' && <CcrOperationsView />}
            {department === 'DATA_ENTRY' && <HrOperationsView />}
          </div>
        ) : (
          <>
        {/* Operational KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total SOP Tasks</span>
              <span className="text-2xl font-bold text-white mt-1 block">{tasks.length}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#18181b] text-slate-400 border border-[#2a2a2d]">
              <Building className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Active In-Progress</span>
              <span className="text-2xl font-bold text-blue-400 mt-1 block">{inProgressCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Pending Approval</span>
              <span className="text-2xl font-bold text-purple-400 mt-1 block">{pendingApprovalCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Completed Today</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">{completedCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Category Pills */}
        <div className="space-y-3 bg-[#0c0c0e] p-4 rounded-xl border border-[#222]">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <span className="text-xs text-slate-500 font-medium mr-2 flex items-center gap-1 shrink-0">
              <Tag className="w-3.5 h-3.5" /> Scope:
            </span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#18181b] text-slate-400 hover:text-white border border-[#2a2a2d]'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#18181b] text-slate-400 hover:text-white border border-[#2a2a2d]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Status */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#1e1e22]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks by number, title, or instructions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#141416] border border-[#2a2a2d] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#141416] border border-[#2a2a2d] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task List / Table */}
        <div className="bg-[#0f0f11] border border-[#222] rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-2" />
              <span className="text-xs">Loading {department} tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <Building className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">No tasks found</h3>
              <p className="text-xs text-slate-500 mb-4">
                No SOP operational tasks match the selected filters.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First {department} Task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e22]">
              {tasks.map((task) => {
                const totalSteps = task.totalSteps || 0;
                const completedSteps = task.completedSteps || 0;
                const progress = task.progressPercent || 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => handleOpenTask(task)}
                    className="p-4 hover:bg-[#141416] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : task.status === 'PENDING_APPROVAL' ? (
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                        ) : task.priority === 'URGENT' || task.priority === 'HIGH' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {task.taskNumber}
                          </span>
                          <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {task.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-[#1e1e22] text-slate-400">
                            {task.category}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-400 truncate mt-1 max-w-xl">
                            {task.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 text-slate-400">
                            <User className="w-3 h-3 text-slate-500" />
                            {task.assignedAgent?.name || 'Unassigned'}
                          </span>
                          <span>
                            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                          </span>
                          {task.customer?.name && (
                            <span className="text-slate-400">Client: {task.customer.name}</span>
                          )}
                          {task.lead?.customerName && (
                            <span className="text-slate-400">Lead: {task.lead.customerName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : task.status === 'PENDING_APPROVAL'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}
                        >
                          {task.status}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {totalSteps > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-[#1e1e22] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {completedSteps}/{totalSteps}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>
      )}
      </div>

      {/* Task Execution Modal */}
      {selectedTask && (
        <SopTaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={() => {
            fetchTasks();
            handleOpenTask(selectedTask);
          }}
          onOpenHandoff={(task) => {
            setHandoffTask(task);
            setIsHandoffModalOpen(true);
          }}
        />
      )}

      {/* Create Task Modal */}
      <SopCreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={fetchTasks}
        initialDepartment={department}
      />

      {/* Cross-Department Handoff Modal */}
      {handoffTask && (
        <SopHandoffModal
          task={handoffTask}
          isOpen={isHandoffModalOpen}
          onClose={() => {
            setIsHandoffModalOpen(false);
            setHandoffTask(null);
          }}
          onHandoffComplete={fetchTasks}
        />
      )}
    </div>
  );
}
