"use client";

import React, { useEffect, useRef } from 'react';
import { useCallStore } from '@/store/useCallStore';
import { useSocket } from '@/providers/SocketProvider';
import { Phone, PhoneOff, AlertTriangle, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IncomingCallModal = () => {
  const { incomingCall, setIncomingCall, setActiveCall, setStatus } = useCallStore();
  const { telephonySocket, mediaSocket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (incomingCall) {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
      }
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError' && e.name !== 'NotSupportedError') {
            console.error('Audio play failed:', e);
          }
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [incomingCall]);

  const handleAccept = () => {
    if (!incomingCall) return;
    
    // Notify backend that we accepted
    if (incomingCall.category === 'Internal' && mediaSocket) {
      mediaSocket.emit('acceptCall', { 
        callSid: incomingCall.callSid,
        roomName: incomingCall.roomName
      });
    } else if (telephonySocket) {
      telephonySocket.emit('acceptCall', { 
        callSid: incomingCall.callSid,
        roomName: incomingCall.roomName
      });
    }
    
    setActiveCall({ ...incomingCall, duration: 0, accepted: true });
    setIncomingCall(null);
    setStatus('BUSY');
    
    // LiveKit/Mediasoup WebRTC logic will now trigger in CallWidget.tsx automatically
  };

  const handleReject = () => {
    if (!incomingCall) return;
    
    if (incomingCall.category === 'Internal' && mediaSocket) {
      mediaSocket.emit('rejectCall', { callSid: incomingCall.callSid });
    } else if (telephonySocket) {
      telephonySocket.emit('rejectCall', { callSid: incomingCall.callSid });
    }
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
        >
          {incomingCall.emergencyFlag && (
            <div className="bg-red-500 text-white p-2 text-center text-sm font-bold animate-pulse flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              EMERGENCY CALL
            </div>
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  {incomingCall.customerContext?.customer?.name || incomingCall.customerName || 'Unknown Caller'}
                </h3>
                <p className="text-slate-500 font-mono mt-1">{incomingCall.phone}</p>
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  incomingCall.customerContext?.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {incomingCall.customerContext?.priority || incomingCall.category || 'Support'}
                </span>
                <span className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Ringing...
                </span>
              </div>
            </div>

            {/* CRM Customer Context Overlay */}
            {incomingCall.customerContext && (
              <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Service Plan:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {incomingCall.customerContext.servicePlans?.[0]?.planType || 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Previous Tickets:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {incomingCall.customerContext.tickets?.length || 0} Open
                  </span>
                </div>
              </div>
            )}

            {incomingCall.transcript && (
              <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">AI Live Transcript</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{incomingCall.transcript}"</p>
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={handleReject}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 text-slate-600 rounded-xl font-medium transition-all flex justify-center items-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                Reject
              </button>
              
              <button 
                onClick={handleAccept}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-2"
              >
                <Phone className="w-5 h-5 animate-bounce" />
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
