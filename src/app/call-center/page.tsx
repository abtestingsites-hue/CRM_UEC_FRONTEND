"use client";

import React, { useState, useEffect } from 'react';
import { Users, Phone, PhoneOutgoing, Video, ShieldCheck, Activity } from "lucide-react";
import { useCallStore } from "@/store/useCallStore";
import { useSocket } from "@/providers/SocketProvider";
import { CallWidget } from "@/components/call-center/CallWidget";
import { NumericKeypad } from "@/components/call-center/NumericKeypad";
import { QueueOperationsView } from "@/components/call-center/QueueOperationsView";
import { apiFetch } from '@/lib/api';

interface Agent {
  id: string;
  userId?: string;
  name: string;
  role: string;
  email: string;
  status: string;
  department: string;
}

export default function CallCenterPage() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound' | 'internal' | 'queue'>('inbound');
  const [dialNumber, setDialNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setActiveCall, queuedCalls, missedCalls, fetchDashboardCalls } = useCallStore();
  const { mediaSocket, telephonySocket } = useSocket();

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
        const target = prev.find(a => a.id === data.agentId || a.userId === data.agentId);
        if (!target || target.status === data.status) return prev;
        return prev.map(a =>
          a.id === data.agentId || a.userId === data.agentId
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
        phone: 'Internal',
        urgency: 'NORMAL',
        category: agent.department,
        isCaller: true,
        accepted: false
      });

      if (mediaSocket) {
        let currentAgentName = 'Super Admin';
        try {
          const stored = localStorage.getItem('crm_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            let rawName = parsed.name || parsed.email || 'Super Admin';
            if (rawName.includes('@')) rawName = rawName.split('@')[0];
            currentAgentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          }
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

        mediaSocket.emit('initiateCall', {
          targetAgentId: agent.id, // Ensure this matches what backend redis is storing
          callSid: roomName,
          customerName: currentAgentName
        });
      }
    } catch (e) {
      console.error('Failed to initiate WebRTC call:', e);
    }
  };

  const handleOutboundDial = async () => {
    if (!dialNumber) return;
    setIsDialing(true);
    try {
      let currentAgentId = null;
      try {
        const stored = localStorage.getItem('crm_user');
        if (stored) {
          currentAgentId = JSON.parse(stored).agentId;
        }
      } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

      const res = await apiFetch('/telephony/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: dialNumber,
          agentId: currentAgentId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.success) {
          alert(data.message || 'Capacity limit reached: unable to initiate call.');
          return;
        }
        const finalRoomName = data.roomName || data.callSid || `room_${Date.now()}`;
        setActiveCall({
          callSid: finalRoomName,
          roomName: finalRoomName,
          customerName: 'Customer',
          phone: dialNumber,
          urgency: 'NORMAL',
          category: 'Outbound',
          direction: 'OUTBOUND',
          status: 'DIALING',
          isCaller: true,
          accepted: true,
          token: data.token,
          serverUrl: data.serverUrl || data.wsUrl
        });
      } else {
        console.error('Failed to dial outbound');
        alert('Failed to initiate outbound call.');
      }
    } catch (e) {
      console.error('Error dialing out:', e);
      alert('Error initiating call.');
    } finally {
      setIsDialing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <header className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Call Center</h1>
          <p className="text-slate-500 mt-1">Manage active WebRTC calls, queue board, and live interactions.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#111] border border-[#222] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('inbound')}
            className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'inbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Phone className="w-4 h-4" /> Inbound
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'outbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <PhoneOutgoing className="w-4 h-4" /> Outbound
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'internal' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Users className="w-4 h-4" /> Internal
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'queue' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Activity className="w-4 h-4 text-emerald-400" /> Queue Engine
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">

        {/* Left Side: Dynamic Content based on Tab */}
        <div className="w-1/2 flex flex-col bg-[#050505] border border-[#222] rounded-2xl shadow-lg overflow-hidden">
          {activeTab === 'queue' && (
            <QueueOperationsView />
          )}

          {activeTab === 'internal' && (
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
                          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              {agent.name}
                              {(agent.role === 'ADMIN' || agent.role === 'SUPER_ADMIN') && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {agent.role ? agent.role.replace('_', ' ') : 'Agent'} â€¢ {agent.department || 'General'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
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
          )}

          {activeTab === 'inbound' && (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-[#222] bg-[#0a0a0a] flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" /> Inbound Call Logs
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Recent queued and missed inbound calls</p>
                </div>
                <button onClick={() => fetchDashboardCalls()} className="bg-[#222] hover:bg-[#333] text-white text-xs px-3 py-1.5 rounded transition-colors">Refresh</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                
                {/* Queued Calls */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 mb-3">Currently Ringing / Queued</h3>
                  {(!queuedCalls || queuedCalls.length === 0) ? (
                    <div className="text-center p-6 bg-[#111] border border-[#222] rounded-xl text-slate-500 text-sm">No active inbound calls</div>
                  ) : (
                    <div className="space-y-3">
                      {queuedCalls.map((call: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-[#111] border border-[#222] rounded-xl hover:border-primary/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                              <Phone className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{call.customer?.name || 'Unknown Caller'}</h4>
                              <p className="text-xs text-slate-400">{call.customer?.phone || call.transferHistory?.phone || call.reason || 'Unknown Number'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">RINGING</span>
                            <div className="text-xs text-slate-500 mt-1">{new Date(call.startedAt || call.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missed Calls */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 mb-3">Recent Missed Calls</h3>
                  {(!missedCalls || missedCalls.length === 0) ? (
                    <div className="text-center p-6 bg-[#111] border border-[#222] rounded-xl text-slate-500 text-sm">No recent missed calls</div>
                  ) : (
                    <div className="space-y-3">
                      {missedCalls.map((call: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-[#111] border border-rose-500/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{call.customer?.name || 'Unknown Caller'}</h4>
                              <p className="text-xs text-slate-400">{call.customer?.phone || call.transferHistory?.phone || call.reason || 'Unknown Number'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-xs font-bold">MISSED</span>
                            <div className="text-xs text-slate-500 mt-1">{new Date(call.startedAt || call.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === 'outbound' && (
            <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto custom-scrollbar">
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
                  });
                }}
              />
            </div>
          )}
        </div>

        {/* Right Side: Active WebRTC Phone System */}
        <div className="w-1/2 flex flex-col bg-[#050505] border border-[#222] rounded-2xl shadow-lg p-8 items-center justify-center">
          <CallWidget />
        </div>
      </div>
    </div>
  );
}
