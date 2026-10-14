"use client";

import React from 'react';
import { useCallStore } from '@/store/useCallStore';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallTimer } from './CallTimer';
import { CallControls } from './CallControls';

export const LiveCallPanel = () => {
  const { activeCall, webrtcConnected } = useCallStore();
  const pathname = usePathname();

  if (!activeCall || pathname?.includes('/call-center')) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-6 w-full max-w-2xl bg-[#050505] rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-[#222] overflow-hidden z-40 flex flex-col"
      >
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 blur-[100px] pointer-events-none transition-all duration-1000 ${
          webrtcConnected ? 'bg-emerald-500/20' : 'bg-primary/20'
        }`} />

        {activeCall.emergencyFlag && (
          <div className="bg-red-500 h-1 w-full animate-pulse" />
        )}
        
        <div className="p-6 flex flex-row items-center gap-6 relative z-10">
          {/* Caller Profile */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border ${
                activeCall.emergencyFlag ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-blue-500/20 border-blue-500/30 text-blue-500'
              }`}>
                {activeCall.customerName?.charAt(0) || <User />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {activeCall.customerName || 'Unknown Caller'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-1 bg-[#111] border border-[#222] rounded text-xs font-mono text-slate-400">
                    {activeCall.phone}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                    {activeCall.category || 'Support'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Call Status & Timer */}
          <div className="flex flex-col items-center justify-center border-l border-[#222] pl-6">
            <CallTimer isActive={!!activeCall} />
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${webrtcConnected ? 'bg-emerald-500 animate-pulse' : 'bg-primary animate-pulse'}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${webrtcConnected ? 'text-emerald-500' : 'text-primary'}`}>
                {webrtcConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10">
          <CallControls />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
