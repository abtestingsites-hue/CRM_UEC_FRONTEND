"use client";

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Eye,
  Building,
  Clock,
  ShieldCheck,
  AlertCircle,
  History,
} from 'lucide-react';
import { SopNav } from '@/components/sop/SopNav';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface StepItem {
  stepOrder: number;
  title: string;
  description: string;
  isMandatory: boolean;
  requiresAttachment: boolean;
  requiresNotes: boolean;
  estimatedMinutes?: number;
  roleRequired?: string;
}

export default function SopBuilderPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('HR');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [recurrence, setRecurrence] = useState('NONE');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [escalationHours, setEscalationHours] = useState(24);
  const [steps, setSteps] = useState<StepItem[]>([
    {
      stepOrder: 1,
      title: 'Verify standard operating requirements',
      description: 'Check prerequisites before beginning task',
      isMandatory: true,
      requiresAttachment: false,
      requiresNotes: false,
      estimatedMinutes: 10,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl);
    setCode(tmpl.code);
    setTitle(tmpl.title);
    setDescription(tmpl.description || '');
    setDepartment(tmpl.department);
    setCategory(tmpl.category);
    setPriority(tmpl.priority);
    setRecurrence(tmpl.recurrence);
    setRequiresApproval(tmpl.requiresApproval);
    setEscalationHours(tmpl.escalationHours || 24);

    const latestVersion = tmpl.versions?.[0];
    if (latestVersion?.steps && latestVersion.steps.length > 0) {
      setSteps(
        latestVersion.steps.map((s: any) => ({
          stepOrder: s.stepOrder,
          title: s.title,
          description: s.description || '',
          isMandatory: s.isMandatory ?? true,
          requiresAttachment: s.requiresAttachment ?? false,
          requiresNotes: s.requiresNotes ?? false,
          estimatedMinutes: s.estimatedMinutes || 15,
          roleRequired: s.roleRequired || '',
        })),
      );
    }
    setMsg(null);
  };

  const handleResetForm = () => {
    setSelectedTemplate(null);
    setCode(`SOP-${department}-${Date.now().toString().slice(-4)}`);
    setTitle('');
    setDescription('');
    setCategory('General Operations');
    setPriority('NORMAL');
    setRecurrence('NONE');
    setRequiresApproval(false);
    setEscalationHours(24);
    setSteps([
      {
        stepOrder: 1,
        title: 'Verify task criteria and intake documentation',
        description: '',
        isMandatory: true,
        requiresAttachment: false,
        requiresNotes: true,
        estimatedMinutes: 10,
      },
    ]);
    setMsg(null);
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        stepOrder: steps.length + 1,
        title: '',
        description: '',
        isMandatory: true,
        requiresAttachment: false,
        requiresNotes: false,
        estimatedMinutes: 15,
      },
    ]);
  };

  const handleRemoveStep = (idx: number) => {
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 }));
    setSteps(updated);
  };

  const handleStepChange = (idx: number, field: keyof StepItem, value: any) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], [field]: value };
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code) {
      setMsg({ type: 'error', text: 'Please fill in Title and SOP Code' });
      return;
    }
    if (steps.length === 0 || steps.some((s) => !s.title.trim())) {
      setMsg({ type: 'error', text: 'Each checklist step must have a title' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMsg(null);

      if (selectedTemplate) {
        // Publish a new template version so historical executions remain immutable!
        const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/templates/${selectedTemplate.id}/versions`, {
          method: 'POST',
          body: JSON.stringify({
            steps,
            changelog: `Updated checklist procedure & rules by manager`,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to publish new version');
        }

        setMsg({ type: 'success', text: `Published new version for SOP ${code} successfully!` });
      } else {
        // Create brand new template
        const payload = {
          code,
          title,
          description,
          department,
          category,
          priority,
          recurrence,
          requiresApproval,
          escalationHours: Number(escalationHours) || 24,
          steps,
        };

        const res = await apiFetch(`${API_BASE_URL}/api/v1/sop/templates`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create SOP template');
        }

        setMsg({ type: 'success', text: `Created SOP Template ${code} successfully!` });
      }

      await fetchTemplates();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error saving template' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden">
      <SopNav />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SOP Architecture
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">SOP Builder & Version Studio</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Design institutional procedures, configure mandatory checklists, set approval gates, and publish versioned templates.
            </p>
          </div>

          <button
            onClick={handleResetForm}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            Create New Template
          </button>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Template Library */}
          <div className="bg-[#0f0f11] border border-[#222] rounded-xl p-4 shadow-xl flex flex-col max-h-[750px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#222] mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Template Library ({templates.length})
              </h3>
              <button onClick={fetchTemplates} className="p-1 rounded text-slate-500 hover:text-white">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id;
                const vNum = tmpl.versions?.[0]?.versionNumber || 1;

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                        : 'bg-[#141416] border-[#222] hover:border-[#333] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-primary">{tmpl.code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e1e22] text-slate-400">
                        v{vNum}.0
                      </span>
                    </div>
                    <span className="text-xs font-semibold block truncate">{tmpl.title}</span>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-[#1c1c1f]">
                      <span>{tmpl.department}</span>
                      <span>{tmpl._count?.executions || 0} Runs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Editor Studio */}
          <div className="lg:col-span-2 bg-[#0f0f11] border border-[#222] rounded-xl p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  {selectedTemplate ? `Edit SOP: ${selectedTemplate.code}` : 'New SOP Standard'}
                </h3>
                {selectedTemplate && (
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Saving will publish Version {(selectedTemplate.versions?.[0]?.versionNumber || 1) + 1}
                  </span>
                )}
              </div>

              {/* General Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">SOP Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={!!selectedTemplate}
                    placeholder="e.g. HR-ONB-01"
                    className="w-full bg-[#141416] border border-[#2a2a2d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#141416] border border-[#2a2a2d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="HR">HR Department</option>
                    <option value="CCR">CCR (Customer Care)</option>
                    <option value="SALES">Sales Team</option>
                    <option value="DATA_ENTRY">Data Entry & QA</option>
                    <option value="GENERAL">General Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Employee Onboarding"
                    className="w-full bg-[#141416] border border-[#2a2a2d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Standard Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Employee Verification & Caregiver Readiness"
                  required
                  className="w-full bg-[#141416] border border-[#2a2a2d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description & Objective</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe the operational purpose and expected outcome..."
                  className="w-full bg-[#141416] border border-[#2a2a2d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Execution Rules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#141416] rounded-xl border border-[#222]">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#1c1c1f] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Escalation Deadline (Hours)</label>
                  <input
                    type="number"
                    value={escalationHours}
                    onChange={(e) => setEscalationHours(Number(e.target.value))}
                    min={1}
                    className="w-full bg-[#1c1c1f] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="reqAppr"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="reqAppr" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Requires Manager Approval
                  </label>
                </div>
              </div>

              {/* Checklist Steps Editor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Checklist Steps ({steps.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-2.5 py-1 rounded-lg bg-[#222] hover:bg-[#2a2a2d] text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-[#333] transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>

                <div className="space-y-3">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#141416] border border-[#222] space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Step {idx + 1}</span>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Step action title (e.g. Verify ID & Address Proof)"
                        value={step.title}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                        required
                        className="w-full bg-[#1c1c1f] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />

                      <input
                        type="text"
                        placeholder="Detailed instructions for operator..."
                        value={step.description}
                        onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                        className="w-full bg-[#1c1c1f] border border-[#333] rounded-lg px-2.5 py-1 text-xs text-slate-400 focus:outline-none focus:border-emerald-500"
                      />

                      <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={step.isMandatory}
                            onChange={(e) => handleStepChange(idx, 'isMandatory', e.target.checked)}
                            className="rounded border-slate-700 text-emerald-600"
                          />
                          Mandatory
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={step.requiresAttachment}
                            onChange={(e) => handleStepChange(idx, 'requiresAttachment', e.target.checked)}
                            className="rounded border-slate-700 text-emerald-600"
                          />
                          Requires File
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={step.requiresNotes}
                            onChange={(e) => handleStepChange(idx, 'requiresNotes', e.target.checked)}
                            className="rounded border-slate-700 text-emerald-600"
                          />
                          Requires Notes
                        </label>

                        <div className="flex items-center gap-1 ml-auto">
                          <span>Est:</span>
                          <input
                            type="number"
                            value={step.estimatedMinutes || 15}
                            onChange={(e) => handleStepChange(idx, 'estimatedMinutes', Number(e.target.value))}
                            className="w-12 bg-[#1c1c1f] border border-[#333] rounded px-1.5 py-0.5 text-xs text-white"
                          />
                          <span>min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting
                    ? 'Publishing Version...'
                    : selectedTemplate
                    ? 'Publish New Version'
                    : 'Create Standard SOP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
