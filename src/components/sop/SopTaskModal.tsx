"use client";

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  User,
  ArrowRight,
  ShieldCheck,
  Send,
  FileText,
  Building,
  Tag,
  Paperclip,
  Check,
  Ban,
  MessageSquare,
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface SopTaskModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onOpenHandoff?: (task: any) => void;
}

export function SopTaskModal({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onOpenHandoff,
}: SopTaskModalProps) {
  const [submittingStepId, setSubmittingStepId] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [stepAttachments, setStepAttachments] = useState<Record<string, string>>({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const responses = task.checklistResponses || [];
  const steps = task.templateVersion?.steps || [];
  const events = task.workflowEvents || [];

  const handleToggleStep = async (step: any, currentlyCompleted: boolean) => {
    try {
      setSubmittingStepId(step.id);
      setErrorMsg(null);
      const notes = stepNotes[step.id];
      const attachmentUrl = stepAttachments[step.id];

      const res = await apiFetch(
        `${API_BASE_URL}/api/v1/sop/executions/${task.id}/steps/${step.id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            isCompleted: !currentlyCompleted,
            notes: notes || undefined,
            attachmentUrl: attachmentUrl || undefined,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update step');
      }

      onTaskUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing step');
    } finally {
      setSubmittingStepId(null);
    }
  };

  const handleReviewApproval = async (status: 'APPROVED' | 'REJECTED') => {
    try {
      setIsReviewing(true);
      setErrorMsg(null);

      const res = await apiFetch(
        `${API_BASE_URL}/api/v1/sop/executions/${task.id}/review`,
        {
          method: 'POST',
          body: JSON.stringify({
            status,
            comments: approvalComments || (status === 'APPROVED' ? 'Approved by manager' : 'Rejected by manager'),
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to review approval');
      }

      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing approval review');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setErrorMsg(null);
      const res = await apiFetch(
        `${API_BASE_URL}/api/v1/sop/executions/${task.id}/submit-approval`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit for approval');
      }
      onTaskUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting for approval');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">NORMAL</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">IN PROGRESS</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">PENDING APPROVAL</span>;
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">BLOCKED</span>;
      case 'OVERDUE':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-600/30">OVERDUE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">{s}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f0f11] border border-[#222] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#222] text-slate-300">
              {task.taskNumber}
            </span>
            <div className="flex items-center gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-500" />
              {task.department}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Title & Notes */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{task.title}</h2>
            {task.notes && (
              <p className="text-sm text-slate-400 bg-[#161618] p-3 rounded-xl border border-[#222]">
                {task.notes}
              </p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#141416] p-4 rounded-xl border border-[#222]">
            <div>
              <span className="text-[11px] text-slate-500 block">Assigned To</span>
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {task.assignedAgent?.name || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Due Date</span>
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No Deadline'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Category</span>
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                {task.category || 'General'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Origin Record</span>
              <span className="text-xs font-medium text-slate-200 truncate block mt-0.5">
                {task.customer?.name ? `Customer: ${task.customer.name}` : task.lead?.customerName ? `Lead: ${task.lead.customerName}` : 'Standard Ops'}
              </span>
            </div>
          </div>

          {/* Interactive Checklist Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                SOP Checklist Steps ({responses.filter((r: any) => r.isCompleted).length}/{steps.length || responses.length})
              </h3>
              {task.template?.requiresApproval && (
                <span className="text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Manager Approval Required
                </span>
              )}
            </div>

            <div className="space-y-3">
              {(steps.length > 0 ? steps : responses.map((r: any) => r.step)).map((step: any, idx: number) => {
                if (!step) return null;
                const response = responses.find((r: any) => r.stepId === step.id);
                const isCompleted = response?.isCompleted ?? false;
                const isSubmitting = submittingStepId === step.id;

                return (
                  <div
                    key={step.id || idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-950/10 border-emerald-500/30 text-slate-300'
                        : 'bg-[#141416] border-[#222] hover:border-[#333] text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStep(step, isCompleted)}
                        disabled={isSubmitting}
                        className={`mt-0.5 p-1 rounded transition-colors ${
                          isCompleted
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Step {step.stepOrder || idx + 1}:</span>
                          <span className={`text-sm font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                            {step.title}
                          </span>
                          {step.isMandatory && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Mandatory
                            </span>
                          )}
                          {step.estimatedMinutes && (
                            <span className="text-[10px] text-slate-500">
                              ~{step.estimatedMinutes}m
                            </span>
                          )}
                        </div>

                        {step.description && (
                          <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                        )}

                        {/* Input controls for notes and attachments if required */}
                        {!isCompleted && (step.requiresNotes || step.requiresAttachment) && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#222]">
                            {step.requiresNotes && (
                              <input
                                type="text"
                                placeholder="Mandatory operational notes..."
                                value={stepNotes[step.id] || ''}
                                onChange={(e) => setStepNotes({ ...stepNotes, [step.id]: e.target.value })}
                                className="bg-[#1c1c1f] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                              />
                            )}
                            {step.requiresAttachment && (
                              <input
                                type="text"
                                placeholder="Evidence attachment URL / File ID..."
                                value={stepAttachments[step.id] || ''}
                                onChange={(e) => setStepAttachments({ ...stepAttachments, [step.id]: e.target.value })}
                                className="bg-[#1c1c1f] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                              />
                            )}
                          </div>
                        )}

                        {response?.notes && (
                          <div className="mt-2 text-xs text-slate-400 bg-black/30 p-2 rounded border border-[#222]">
                            <span className="font-semibold text-slate-300">Note: </span>
                            {response.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manager Approval Section */}
          {task.status === 'PENDING_APPROVAL' && (
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-purple-400 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                Manager Review & Approval Required
              </div>
              <p className="text-xs text-slate-300 mb-3">
                All mandatory checklist items are complete. Review operational evidence before approving.
              </p>
              <textarea
                placeholder="Review notes or rejection reason..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={2}
                className="w-full bg-[#161618] border border-[#333] rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 mb-3"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => handleReviewApproval('REJECTED')}
                  disabled={isReviewing}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Reject Task
                </button>
                <button
                  onClick={() => handleReviewApproval('APPROVED')}
                  disabled={isReviewing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Task
                </button>
              </div>
            </div>
          )}

          {/* Workflow Events Audit Trail */}
          {events.length > 0 && (
            <div className="pt-4 border-t border-[#222]">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Workflow Audit Trail
              </h4>
              <div className="space-y-2">
                {events.slice(0, 5).map((evt: any, i: number) => (
                  <div key={evt.id || i} className="flex items-center justify-between text-xs py-1.5 px-3 bg-[#141416] rounded-lg border border-[#222]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-200">{evt.action}</span>
                      <span className="text-[10px] text-slate-500">by {evt.actorEmail || 'System'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#222] bg-[#141416] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onOpenHandoff && (
              <button
                onClick={() => onOpenHandoff(task)}
                className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2a2a2d] text-slate-200 border border-[#333] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                Cross-Dept Handoff
              </button>
            )}
            {task.status !== 'PENDING_APPROVAL' && task.status !== 'COMPLETED' && task.template?.requiresApproval && (
              <button
                onClick={handleSubmitForApproval}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Submit for Approval
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222] hover:bg-[#2a2a2d] text-slate-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
