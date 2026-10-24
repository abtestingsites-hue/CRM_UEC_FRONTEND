"use client";

import React, { useState, useEffect } from 'react';
import { Users, Phone, PhoneOutgoing, Video, ShieldCheck, PhoneCall, PhoneOff } from "lucide-react";
import { useCallStore } from "@/store/useCallStore";
import { CallWidget } from "@/components/call-center/CallWidget";
import { NumericKeypad } from "@/components/call-center/NumericKeypad";

import { SocketContext } from '@/providers/SocketProvider';
import { apiFetch } from '@/lib/api';

interface Agent {
  id: string;
  userId: string;
  name: string;
  role: string;
  email: string;
  status: string;
  department: string;
}

export default function AgentCallCenter() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setActiveCall, queuedCalls, missedCalls } = useCallStore();
  const { telephonySocket, mediaSocket } = React.useContext(SocketContext);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await apiFetch(`/api/v1/agents`);
        if (res.ok) {
          const data = await res.json();
          const formattedAgents = (data.agents || []).map((a: any) => {
            let rawName = a.name || a.email || 'Agent';
            if (rawName.includes('@')) rawName = rawName.split('@')[0];
            return {
              ...a,
              name: rawName.charAt(0).toUpperCase() + rawName.slice(1)
            };
          });

          let currentAgentId = null;
          try {
            const stored = localStorage.getItem('crm_user');
            if (stored) currentAgentId = JSON.parse(stored).agentId;
          } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

          setAgents(formattedAgents.filter((a: any) => a.id !== currentAgentId));
        }
      } catch (err) {
        console.error("Failed to fetch agents", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  // Reconcile active call state on mount to prevent zombie/stale calls after page navigation
  useEffect(() => {
    const reconcileActiveCall = async () => {
      try {
        const { activeCall, setActiveCall, setStatus } = useCallStore.getState();
        if (activeCall) {
          const res = await apiFetch('/telephony/my-active-call');
          if (res.ok) {
            const data = await res.json();
            if (!data.activeCall) {
              console.log('[CALL-RECONCILIATION] Backend reports no active call. Clearing stale activeCall.');
              setActiveCall(null);
              setStatus('AVAILABLE');
            }
          }
        }
      } catch (err) {
        console.warn('[CALL-RECONCILIATION] Error during active call reconciliation:', err);
      }
    };
    reconcileActiveCall();
  }, []);

  useEffect(() => {
    const handleStatusChange = (data: any) => {
      if (!data || !data.agentId) return;
      setAgents(prev => {
        const target = prev.find(a => a.userId === data.agentId || a.id === data.agentId);
        if (!target || target.status === data.status) return prev;
        return prev.map(a =>
          a.userId === data.agentId || a.id === data.agentId
            ? { ...a, status: data.status }
            : a
        );
      });
    };

    const activeSocket = telephonySocket || mediaSocket;
    if (activeSocket) {
      activeSocket.on('agent_status_change', handleStatusChange);
    }

    return () => {
      if (activeSocket) {
        activeSocket.off('agent_status_change', handleStatusChange);
      }
    };
  }, [telephonySocket, mediaSocket]);

  const handleWebRtcCall = async (agent: Agent) => {
    try {
      const roomName = `room_${agent.id.substring(0, 8)}`;

      setActiveCall({
        callSid: roomName,
        customerName: agent.name,
        urgency: 'NORMAL',
        category: agent.department,
        isCaller: true,
        accepted: false
      } as any);

      if (mediaSocket) {
        let currentAgentName = 'Agent';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            let rawName = parsed.name || parsed.email || 'Agent';
            if (rawName.includes('@')) rawName = rawName.split('@')[0];
            currentAgentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          }
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

        mediaSocket.emit('initiateCall', {
          targetAgentId: agent.id, // Target the Agent UUID which is stored in Redis
          callSid: roomName,
          customerName: currentAgentName
        });
      }
    } catch (e) {
      console.error('Failed to initiate WebRTC call:', e);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-[#000]">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Call Center</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Agent Workspace & Communication Hub</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#111] border border-[#222] rounded-lg p-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('inbound')}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md text-xs md:text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'inbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Phone className="w-4 h-4 hidden sm:block" /> Inbound
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md text-xs md:text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'outbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <PhoneOutgoing className="w-4 h-4 hidden sm:block" /> Outbound
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">

        {/* Left Side: Dynamic Content based on Tab */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 shrink-0 lg:shrink min-h-[500px] lg:min-h-0">
          <div className="flex-1 flex flex-col bg-[#050505] border border-[#222] rounded-2xl shadow-lg overflow-hidden">
            {activeTab === 'inbound' ? (
              <div className="flex flex-col h-full">
                <div className="p-5 border-b border-[#222] bg-[#0a0a0a]">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Internal Directory
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Staff, Admins, and Super Admins</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full text-slate-500">
                      <div className="w-5 h-5 border-2 border-slate-500/20 border-t-slate-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {agents.map((agent) => (
                        <div key={agent.id} className="flex justify-between items-center p-4 bg-[#111] border border-[#222] rounded-xl hover:border-[#333] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {agent.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                {agent.name}
                                {(agent.role === 'ADMIN' || agent.role === 'SUPER_ADMIN') && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                              </h4>
                              <p className="text-[10px] text-slate-400 capitalize truncate">
                                {agent.role ? agent.role.replace('_', ' ') : 'Agent'} â€¢ {agent.department || 'General'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                              <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {agent.status}
                            </span>
                            <button
                              onClick={() => handleWebRtcCall(agent)}
                              className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors"
                              title="Call via WebRTC"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-[#0a0a0a]">
                {/* Dialer Section */}
                <div className="p-4 border-b border-[#222]">
                  <NumericKeypad
                    onCallInitiated={(data) => {
                      const finalRoomName = data.roomName || data.callSid || `room_${Date.now()}`;
                      setActiveCall({
                        callSid: finalRoomName,
                        roomName: finalRoomName,
                        customerName: 'Customer',
                        phone: data.to || 'Customer',
                        urgency: 'NORMAL',
                        category: 'Outbound',
                        direction: 'OUTBOUND',
                        status: 'DIALING',
                        isCaller: true,
                        accepted: true,
                        token: data.token,
                        serverUrl: data.serverUrl || data.wsUrl
                      } as any);
                    }}
                  />
                </div>

                {/* Lists Section */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">

                  {/* Queued Calls */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500" /> Queued Calls
                      </span>
                      <span className="bg-[#222] text-slate-300 text-[10px] px-2 py-0.5 rounded-full">{queuedCalls.length} Waiting</span>
                    </h3>
                    <div className="space-y-2">
                      {queuedCalls.length === 0 ? (
                        <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center text-slate-500 text-sm">
                          No calls currently in queue.
                        </div>
                      ) : (
                        queuedCalls.map(call => (
                          <div key={call.id} className="bg-[#111] border border-[#222] rounded-xl p-3 flex flex-col gap-1">
                            <div className="text-white text-sm font-semibold">{call.customer?.name || call.customer?.phone || 'Unknown Caller'}</div>
                            <div className="text-emerald-500 text-xs font-medium">Ringing...</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Missed Calls */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <PhoneOff className="w-4 h-4 text-rose-500" /> Missed Calls
                      </span>
                      <span className="bg-[#222] text-slate-300 text-[10px] px-2 py-0.5 rounded-full">{missedCalls.length} Missed</span>
                    </h3>
                    <div className="space-y-2">
                      {missedCalls.length === 0 ? (
                        <div className="bg-[#111] border border-[#222] rounded-xl p-6 text-center text-slate-500 text-sm">
                          No missed calls to display.
                        </div>
                      ) : (
                        missedCalls.map(call => (
                          <div key={call.id} className="bg-[#111] border border-[#222] rounded-xl p-3 flex flex-col gap-1">
                            <div className="text-white text-sm font-semibold">{call.customer?.name || call.customer?.phone || 'Unknown Caller'}</div>
                            <div className="text-slate-400 text-xs">{new Date(call.startedAt).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active WebRTC Phone System */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#050505] border border-[#222] rounded-2xl shadow-lg p-4 md:p-6 items-center justify-center shrink-0 min-h-[400px]">
          <CallWidget />
        </div>
      </div>
    </div>
  );
}
