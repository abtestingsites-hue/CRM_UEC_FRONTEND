"use client";

import React, { useState } from 'react';
import { X, Loader2, PhoneForwarded } from 'lucide-react';

interface TransferCallModalProps {
  agentName: string;
  department: string;
  targetUserId?: string;
  targetAgentId?: string;
  callSid?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferCallModal({ 
  agentName, 
  department, 
  targetUserId, 
  targetAgentId, 
  callSid, 
  onClose, 
  onSuccess 
}: TransferCallModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      let activeSid = callSid;
      if (!activeSid) {
        try {
          const { useCallStore } = await import('@/store/useCallStore');
          activeSid = useCallStore.getState().activeCall?.callSid;
        } catch (e) {
          console.warn('Could not read active call from store', e);
        }
      }

      if (!activeSid) {
        throw new Error('No active call session identified to transfer.');
      }

      const { apiFetch } = await import('@/lib/api');
      const res = await apiFetch(`/api/v1/calls/${encodeURIComponent(activeSid)}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetUserId || undefined,
          targetAgentId: targetAgentId || undefined,
          targetDepartment: department
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Transfer failed with HTTP status ${res.status}`);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Call transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-[#222]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PhoneForwarded className="w-5 h-5 text-primary" /> Transfer Call
          </h2>
          <button aria-label="Close dialog" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {error}
            </div>
          )}
          <p className="text-sm text-slate-300 mb-6 text-center leading-relaxed">
            Are you sure you want to transfer the current call to <strong className="text-white">{agentName}</strong> from the <span className="text-white">{department}</span> department?
          </p>
          
          <div className="flex justify-between gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 py-2.5 rounded-lg font-medium text-slate-300 bg-[#111] hover:bg-[#1a1a1a] transition-colors border border-[#333]"
            >
              Cancel
            </button>
            <button 
              onClick={handleTransfer} 
              disabled={isSubmitting} 
              className="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
