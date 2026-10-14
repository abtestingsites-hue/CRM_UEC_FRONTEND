"use client";

import React, { useState } from 'react';
import { X, Loader2, PhoneForwarded } from 'lucide-react';

interface TransferCallModalProps {
  agentName: string;
  department: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferCallModal({ agentName, department, onClose, onSuccess }: TransferCallModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async () => {
    setIsSubmitting(true);
    // Simulate network delay for transfer logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-[#222]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PhoneForwarded className="w-5 h-5 text-primary" /> Transfer Call
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
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
