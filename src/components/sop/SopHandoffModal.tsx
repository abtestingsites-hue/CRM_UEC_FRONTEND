"use client";

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Building, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface SopHandoffModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onHandoffComplete: () => void;
}

export function SopHandoffModal({
  task,
  isOpen,
  onClose,
  onHandoffComplete,
}: SopHandoffModalProps) {
  const [toDepartment, setToDepartment] = useState('HR');
  const [action, setAction] = useState('Staff Matching Request');
  const [targetRole, setTargetRole] = useState('');
  const [targetAgentId, setTargetAgentId] = useState('');
  const [notes, setNotes] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !task) return;

    // Pre-fill sensible default target department based on current department
    if (task.department === 'SALES') {
      setToDepartment('HR');
      setAction('Staff Matching Request for Qualified Opportunity');
    } else if (task.department === 'CCR') {
      setToDepartment('SALES');
      setAction('Enquiry Qualified - Transfer to Sales Pipeline');
    } else if (task.department === 'HR') {
      setToDepartment('CCR');
      setAction('Staff Deployed - Schedule Client Care Check');
    } else {
      setToDepartment('DATA_ENTRY');
      setAction('Data Quality Review & Record Correction');
    }

    // Fetch agents for target department
    apiFetch(`${API_BASE_URL}/api/v1/agent/list`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
        else if (data?.agents) setAgents(data.agents);
      })
      .catch(() => {});
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) {
      setErrorMsg('Please specify handoff action');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        executionId: task.id,
        toDepartment,
        action,
        targetRole: targetRole || undefined,
        targetAgentId: targetAgentId || undefined,
        notes: notes || `Handoff from ${task.department} task ${task.taskNumber}: ${task.title}`,
      };

      const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/handoff`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to trigger department handoff');
      }

      onHandoffComplete();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing handoff');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f0f11] border border-[#222] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#141416]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            Cross-Department Workflow Handoff
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
          <div className="bg-[#141416] p-3 rounded-xl border border-[#222] text-xs space-y-1">
            <span className="text-slate-500 block">Origin Task:</span>
            <div className="text-slate-200 font-semibold flex items-center gap-2">
              <span className="font-mono text-primary">{task.taskNumber}</span>
              <span>{task.title}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Department: <strong className="text-white">{task.department}</strong> | Status: <strong className="text-emerald-400">{task.status}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Department</label>
              <select
                value={toDepartment}
                onChange={(e) => setToDepartment(e.target.value)}
                className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="HR">HR Department</option>
                <option value="CCR">CCR (Care Center)</option>
                <option value="SALES">Sales Pipeline</option>
                <option value="DATA_ENTRY">Data Entry & Quality</option>
                <option value="GENERAL">General Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Assignee</label>
              <select
                value={targetAgentId}
                onChange={(e) => setTargetAgentId(e.target.value)}
                className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="">Department Queue (Unassigned)</option>
                {agents
                  .filter((a) => !a.department || a.department.toUpperCase() === toDepartment || toDepartment === 'GENERAL')
                  .map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.department || 'General'})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Handoff Trigger Action</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Staff Matching for Qualified Opportunity"
              required
              className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Handoff Brief & Context Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Provide instructions and context for the receiving department..."
              className="w-full bg-[#18181b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
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
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-primary/30"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {isSubmitting ? 'Transferring...' : 'Execute Handoff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
