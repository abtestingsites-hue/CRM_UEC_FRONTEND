"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, Building, User, Calendar, Tag } from 'lucide-react';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface SopCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  initialDepartment?: string;
}

export function SopCreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  initialDepartment,
}: SopCreateTaskModalProps) {
  const [department, setDepartment] = useState(initialDepartment || 'HR');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialDepartment) setDepartment(initialDepartment);
  }, [initialDepartment]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch templates for current department
    apiFetch(`${API_BASE_URL}/api/v1/sop/templates?department=${department}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplateId(data[0].id);
            setTitle(data[0].title);
            setCategory(data[0].category || '');
            setPriority(data[0].priority || 'NORMAL');
          } else {
            setSelectedTemplateId('');
          }
        }
      })
      .catch((e) => console.error('Failed to load templates', e));

    // Fetch active agents for assignment
    apiFetch(`${API_BASE_URL}/api/v1/agent/list`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
        else if (data?.agents) setAgents(data.agents);
      })
      .catch(() => {});
  }, [isOpen, department]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tmplId = e.target.value;
    setSelectedTemplateId(tmplId);
    const found = templates.find((t) => t.id === tmplId);
    if (found) {
      setTitle(found.title);
      setCategory(found.category || '');
      setPriority(found.priority || 'NORMAL');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setErrorMsg('Please enter a task title');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        templateId: selectedTemplateId || undefined,
        title,
        department,
        category: category || 'Operational Task',
        priority,
        assignedAgentId: assignedAgentId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes,
      };

      const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/executions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create task execution');
      }

      onTaskCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f0f11] border border-[#222] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#141416]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            New SOP Operational Task
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="HR">HR</option>
                <option value="CCR">CCR</option>
                <option value="SALES">Sales</option>
                <option value="DATA_ENTRY">Data Entry</option>
                <option value="GENERAL">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">SOP Template Standard</label>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Custom / Ad-Hoc Task</option>
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.code} - {tmpl.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee Care Background Verification"
              required
              className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assignee</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Auto / Unassigned</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.department || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Operational Instructions & Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add specific instructions for the assigned personnel..."
              className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#2a2a2d] text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSubmitting ? 'Creating...' : 'Create SOP Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
