"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CreateTicketModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTicketModal({ onClose, onSuccess }: CreateTicketModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    subject: '',
    category: 'General',
    priority: 'NORMAL',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await apiFetch(`/api/v1/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-[#222]">
          <h2 className="text-xl font-bold text-white">Create New Ticket</h2>
          <button aria-label="Close dialog" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Name</label>
              <input aria-label="Enter the customer" required type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="Enter the customer's name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
              <input aria-label="Enter the customer" required type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="Enter the customer's phone number" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</label>
            <input aria-label="Enter the ticket subject" required type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Enter the ticket subject" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
              <select aria-label="Ticket Category" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="General">General</option>
                <option value="Billing">Billing</option>
                <option value="Technical">Technical</option>
                <option value="Sales">Sales</option>
                <option value="Complaint">Complaint</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
              <select aria-label="Ticket Priority" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea aria-label="Ticket description" required rows={4} className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Provide details about the issue..."></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-[#111] transition-colors border border-transparent hover:border-[#333]">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
