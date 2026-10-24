import React, { useState } from 'react';
import { X, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface AddAgentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAgentModal({ onClose, onSuccess }: AddAgentModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'work' | 'login'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    gender: '',
    dob: '',
    employeeId: '',
    department: '',
    role: 'AGENT',
    status: 'AVAILABLE',
    joinedAt: new Date().toISOString().split('T')[0],
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent, forceReactivate = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = { ...formData };
      if (forceReactivate) payload.reactivate = true;
      if (!payload.employeeId?.trim()) delete payload.employeeId;
      if (!payload.phone?.trim()) delete payload.phone;
      if (!payload.dob?.trim()) delete payload.dob;
      if (!payload.joinedAt?.trim()) delete payload.joinedAt;
      if (!payload.address?.trim()) delete payload.address;
      if (!payload.city?.trim()) delete payload.city;
      if (!payload.state?.trim()) delete payload.state;
      if (!payload.country?.trim()) delete payload.country;
      if (!payload.zipCode?.trim()) delete payload.zipCode;
      if (!payload.gender?.trim()) delete payload.gender;
      if (!payload.department?.trim()) delete payload.department;

      const res = await apiFetch(`/api/v1/agents/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        if (err.isArchived) {
          const confirmReactivate = window.confirm(
            `${err.error}\n\nWould you like to restore and reactivate this archived agent profile?`
          );
          if (confirmReactivate) {
            return handleSubmit(e, true);
          }
        }
        alert(`Error: ${err.message || err.error || 'Failed to create agent'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'work', label: 'Work Info' },
    { id: 'login', label: 'Credentials' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#0a0a0a] border-0 md:border border-[#222] rounded-none md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] max-w-2xl overflow-hidden flex flex-col"
      >
        <div className="p-5 md:p-6 border-b border-[#222] flex items-center justify-between bg-[#111] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-tight">Add New Agent</h2>
              <p className="text-xs text-slate-500">Create a profile and generate login credentials</p>
            </div>
          </div>
          <button aria-label="Close dialog" onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#222] bg-[#050505] shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3.5 md:py-3 text-xs md:text-sm font-bold border-b-2 transition-colors min-h-[44px] ${activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#111]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar bg-[#050505]">
          <form id="add-agent-form" onSubmit={handleSubmit} className="space-y-6">

            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Full Name *</label>
                  <input aria-label="Full Name" required name="fullName" value={formData.fullName} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email Address *</label>
                  <input aria-label="Email" required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Phone Number</label>
                  <input aria-label="Phone" name="phone" value={formData.phone} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Address</label>
                  <input aria-label="Address" name="address" value={formData.address} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">City</label>
                  <input aria-label="City" name="city" value={formData.city} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">State / Province</label>
                  <input aria-label="State" name="state" value={formData.state} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Country</label>
                  <input aria-label="Country" name="country" value={formData.country} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">ZIP Code</label>
                  <input aria-label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Gender</label>
                  <select aria-label="Agent Gender" name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0 cursor-pointer">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Date of Birth</label>
                  <input aria-label="Dob" name="dob" value={formData.dob} onChange={handleChange} type="date" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0 [color-scheme:dark]" />
                </div>
              </div>
            )}

            {activeTab === 'work' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Employee ID</label>
                  <input aria-label="Employee Id" name="employeeId" value={formData.employeeId} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Department</label>
                  <input aria-label="Department" name="department" value={formData.department} onChange={handleChange} type="text" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Role</label>
                  <select aria-label="Agent Role" name="role" value={formData.role} onChange={handleChange} className="w-full bg-[#111] border border-[#333] focus:border-orange-500 rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0 cursor-pointer">
                    <option value="AGENT">Agent</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Initial Status</label>
                  <select aria-label="Agent Status" name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0 cursor-pointer">
                    <option value="AVAILABLE">Available (Online)</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Joining Date</label>
                  <input aria-label="Joined At" name="joinedAt" value={formData.joinedAt} onChange={handleChange} type="date" className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0 [color-scheme:dark]" />
                </div>
              </div>
            )}

            {activeTab === 'login' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm mb-6 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Credentials will be securely stored in Supabase Auth and linked to the agent's database profile. The agent can use this email and password to log in.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Platform Login Email *</label>
                    <input aria-label="Email" name="email" value={formData.email} onChange={handleChange} type="email" required className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Temporary Password *</label>
                    <input aria-label="Password" name="password" value={formData.password} onChange={handleChange} type="password" required className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-xl px-4 py-3 md:py-2 text-base md:text-sm outline-none text-white transition-colors min-h-[48px] md:min-h-0" />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-5 border-t border-[#222] bg-[#111] flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            {activeTab !== 'personal' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'login' ? 'work' : 'personal')}
                className="px-4 py-3 md:py-2 border border-[#333] text-slate-300 rounded-xl text-sm font-medium hover:bg-[#222] transition-colors min-h-[48px] md:min-h-0"
              >
                Back
              </button>
            )}
          </div>

          {activeTab !== 'login' ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'personal' ? 'work' : 'login')}
              className="px-6 py-3 md:py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors min-h-[48px] md:min-h-0"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              form="add-agent-form"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 md:py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-bold shadow-lg shadow-primary/20 min-h-[48px] md:min-h-0"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Agent Profile'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
