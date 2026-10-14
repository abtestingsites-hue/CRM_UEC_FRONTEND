import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface DeleteAgentModalProps {
  agent: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteAgentModal({ agent, onClose, onSuccess }: DeleteAgentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await apiFetch(`/api/v1/agents/${agent.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to delete agent'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="p-6 text-center pt-8">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Delete Agent Profile</h2>
          <p className="text-sm text-slate-400 mb-6">
            Are you sure you want to delete <strong className="text-white">{agent.name}</strong>?
            This will revoke their access to the system immediately. This action can only be undone by a super admin.
          </p>
        </div>

        <div className="p-5 border-t border-[#222] bg-[#111] flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2 border border-[#333] text-slate-300 rounded-lg text-sm font-medium hover:bg-[#222] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex-1 flex justify-center items-center gap-2 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-bold shadow-lg shadow-rose-500/20"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Deleting...' : 'Delete Agent'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
