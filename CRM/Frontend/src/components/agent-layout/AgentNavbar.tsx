"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Bell, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AgentNavbar() {
  const [time, setTime] = useState<Date | null>(null);
  const [user, setUser] = useState<{name: string, email: string, avatarUrl?: string} | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mockNotifications: any[] = [];

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('crm_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
  };

  return (
    <header className="h-[72px] border-b border-[#222] bg-[#050505]/95 backdrop-blur supports-[backdrop-filter]:bg-[#050505]/60 flex items-center justify-between px-6 shrink-0 relative z-50">
      
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search tasks, customers, or calls..." 
            className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded-xl pl-10 pr-4 py-2 text-sm outline-none text-white transition-all placeholder-slate-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-[#222] border border-[#333] rounded text-[10px] font-medium text-slate-400">Ctrl</kbd>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-[#222] border border-[#333] rounded text-[10px] font-medium text-slate-400">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 ml-6">
        
        {/* Clock */}
        {time && (
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-white tracking-wider">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        <div className="h-6 w-px bg-[#222] hidden md:block"></div>

        {/* Notification */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#111] border border-[#222] hover:border-[#333] hover:bg-[#1a1a1a] text-slate-400 hover:text-white transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#050505]"></span>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-3 w-80 bg-[#111] border border-[#222] rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#0a0a0a]">
                  <h3 className="font-bold text-white text-sm">Notifications</h3>
                  <button className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {mockNotifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-[#222] hover:bg-[#1a1a1a] transition-colors cursor-pointer ${n.unread ? 'bg-[#050505]' : 'opacity-70'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${n.unread ? 'text-white font-medium' : 'text-slate-400'}`}>{n.text}</p>
                        {n.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 ml-2"></span>}
                      </div>
                      <p className="text-[10px] text-slate-500">{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-[#222] bg-[#0a0a0a] hover:bg-[#1a1a1a] cursor-pointer transition-colors text-xs text-slate-400 font-medium">
                  View All Notifications
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 relative" ref={profileRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Agent'}</p>
            <p className="text-[10px] text-slate-500">{user?.email || 'agent@example.com'}</p>
          </div>
          <div className="relative cursor-pointer">
            <img 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Agent')}&background=ea580c&color=fff`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-[#333] object-cover hover:border-primary transition-colors"
            />
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-[#222] rounded-xl shadow-xl overflow-hidden transition-all">
                 <Link
                   href="/agent/profile"
                   onClick={() => setShowProfileDropdown(false)}
                   className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[#1a1a1a] hover:text-white text-slate-400 text-sm font-medium transition-colors border-b border-[#222]"
                 >
                   My Profile
                 </Link>
                 <button 
                   onClick={handleLogout}
                   className="w-full flex items-center gap-2 px-4 py-3 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 text-sm font-medium transition-colors"
                 >
                   <LogOut className="w-4 h-4" /> Sign Out
                 </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
