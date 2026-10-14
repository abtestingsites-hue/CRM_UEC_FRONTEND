"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, KeyRound, Building, Phone } from 'lucide-react';

export default function AgentProfilePage() {
  const [user, setUser] = useState({
    name: 'Agent',
    email: 'agent@uec.com',
    role: 'Agent',
    department: 'General',
    phone: '+1 234 567 8900'
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('crm_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
          role: parsed.role ? parsed.role.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') : prev.role,
        }));
      }
    } catch (e) {}
  }, []);

  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#000]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account information and preferences.</p>
      </div>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Info Card */}
        <div className="md:col-span-1 bg-[#0a0a0a] border border-[#222] rounded-xl p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none"></div>
          
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary/20 mb-4 relative z-10">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          
          <h2 className="text-xl font-bold text-white relative z-10">{user.name}</h2>
          <p className="text-sm text-slate-400 mb-4 relative z-10">{user.role}</p>
          
          <div className="w-full bg-[#111] rounded-lg p-3 text-left border border-[#222]">
            <div className="flex items-center gap-3 text-sm text-slate-300 mb-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Building className="w-4 h-4 text-slate-500" />
              <span>{user.department}</span>
            </div>
          </div>
        </div>

        {/* Details Form */}
        <div className="md:col-span-2 bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-[#222] pb-4">Personal Details</h3>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={user.name} 
                  disabled
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-300 outline-none cursor-not-allowed" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-300 outline-none cursor-not-allowed" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    value={user.role} 
                    disabled
                    className="w-full bg-[#111] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 outline-none cursor-not-allowed" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    value={user.phone} 
                    disabled
                    className="w-full bg-[#111] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 outline-none cursor-not-allowed" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#222] mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Security</h3>
              <button type="button" className="flex items-center gap-2 bg-[#111] border border-[#333] hover:bg-[#1a1a1a] px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors">
                <KeyRound className="w-4 h-4" /> Change Password
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
