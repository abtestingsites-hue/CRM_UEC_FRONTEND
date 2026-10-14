"use client";

import React from 'react';
import { Mic, MicOff, Pause, Play, FileText, Share2, PhoneOff } from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';
import { useSocket } from '@/providers/SocketProvider';

export const CallControls: React.FC = () => {
  const { activeCall, setActiveCall, setStatus, isMuted, toggleMute, isHold, toggleHold } = useCallStore();
  const { socket } = useSocket();

  const handleEndCall = () => {
    if (activeCall && socket) {
      socket.emit('endCall', { callSid: activeCall.callSid });
    }
    setActiveCall(null);
    setStatus('AVAILABLE');
  };

  return (
    <div className="bg-[#0a0a0a] p-4 flex justify-between items-center px-8 border-t border-[#222]">
      <div className="flex gap-4">
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-[#111] text-slate-400 hover:text-white hover:bg-[#222] border border-[#333]'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button 
          onClick={toggleHold}
          className={`p-4 rounded-2xl flex items-center justify-center transition-all ${isHold ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-[#111] text-slate-400 hover:text-white hover:bg-[#222] border border-[#333]'}`}
          title={isHold ? 'Resume' : 'Hold'}
        >
          {isHold ? <Play size={24} /> : <Pause size={24} />}
        </button>

        <button 
          className="p-4 bg-[#111] border border-[#333] text-slate-400 hover:text-white hover:bg-[#222] rounded-2xl transition-all"
          title="Transfer"
        >
          <Share2 size={24} />
        </button>
        
        <button 
          className="p-4 bg-[#111] border border-[#333] text-slate-400 hover:text-white hover:bg-[#222] rounded-2xl transition-all"
          title="Notes"
        >
          <FileText size={24} />
        </button>
      </div>
      
      <button 
        onClick={handleEndCall}
        className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-2xl shadow-[0_0_15px_rgba(239,68,68,0.2)] font-semibold flex items-center gap-3 transition-all group"
      >
        <PhoneOff size={24} className="group-hover:scale-110 transition-transform" />
        End Call
      </button>
    </div>
  );
};
