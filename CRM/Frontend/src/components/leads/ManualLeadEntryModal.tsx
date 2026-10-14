import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, FileText, Tag, Loader2 } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';

interface ManualLeadEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualLeadEntryModal({ isOpen, onClose }: ManualLeadEntryModalProps) {
  const { addLead } = useLeadStore();
  
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    serviceInterest: '',
    source: 'Manual Entry',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.phoneNumber) {
      setError('Phone number is required');
      return;
    }

    setIsLoading(true);
    
    // Simulate getting the current user from auth
    let user = null;
    try {
      const userStr = localStorage.getItem('crm_user');
      if (userStr) user = JSON.parse(userStr);
    } catch (err) {}

    const token = localStorage.getItem('crm_token') || 'mock_token';
    const agentId = user?.id || undefined;

    const success = await addLead({ ...formData, agentId } as any, token);
    
    setIsLoading(false);
    if (success) {
      // Reset and close
      setFormData({
        customerName: '',
        phoneNumber: '',
        email: '',
        serviceInterest: '',
        source: 'Manual Entry',
        notes: '',
      });
      onClose();
    } else {
      setError('Failed to create lead. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Manual Lead Entry</h2>
                <p className="text-xs text-slate-400">Add a new prospective customer</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#222] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm flex items-center gap-2">
                  <span className="font-semibold">Error:</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <input 
                        type="text" 
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <input 
                        type="tel" 
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Interest</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="w-4 h-4 text-slate-500" />
                      </div>
                      <select 
                        value={formData.serviceInterest}
                        onChange={(e) => setFormData({...formData, serviceInterest: e.target.value})}
                        className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                      >
                        <option value="">Select Service...</option>
                        <option value="Home Care">Home Care</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Physical Therapy">Physical Therapy</option>
                        <option value="General Checkup">General Checkup</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="w-4 h-4 text-slate-500" />
                      </div>
                      <input 
                        type="text" 
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                        placeholder="e.g. Inbound Call, Website"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Additional Notes</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <textarea 
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600 resize-none"
                      placeholder="Any specific requests or context..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-[#222] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || !formData.phoneNumber}
                    className="px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Lead'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
