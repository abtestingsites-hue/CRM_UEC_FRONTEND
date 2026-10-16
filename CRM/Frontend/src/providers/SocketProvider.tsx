"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useConversationStore } from '@/store/conversationStore';
import { useCallStore, CallState } from '@/store/useCallStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface SocketContextProps {
  socket: Socket | null;
  telephonySocket: Socket | null;
  mediaSocket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextProps>({
  socket: null,
  telephonySocket: null,
  mediaSocket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

// Global singleton instance to prevent multiple socket connections
let globalSocket: Socket | null = null;
let globalTelephonySocket: Socket | null = null;
let globalMediaSocket: Socket | null = null;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [telephonySocket, setTelephonySocket] = useState<Socket | null>(null);
  const [mediaSocket, setMediaSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      if (globalTelephonySocket) {
        globalTelephonySocket.disconnect();
        globalTelephonySocket = null;
      }
      if (globalMediaSocket) {
        globalMediaSocket.disconnect();
        globalMediaSocket = null;
      }
      return;
    }

    if (!globalSocket) {
      console.log('[AGENT-SOCKET]', 'created globalSocket');
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      globalSocket = io(`${API_BASE_URL}/`, {
        path: '/socket.io',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        auth: {
          agentId: user.id,
          token: typeof window !== 'undefined' ? (localStorage.getItem('paramantra_access_token') || localStorage.getItem('token') || '') : '',
        }
      });
    }

    if (!globalTelephonySocket) {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || `${API_BASE_URL}/`;
      const mainUrl = `${API_BASE_URL}/`;
      if (socketUrl === mainUrl || socketUrl.replace(/\/$/, '') === mainUrl.replace(/\/$/, '')) {
        console.log('[AGENT-SOCKET] reusing globalSocket for globalTelephonySocket');
        globalTelephonySocket = globalSocket;
      } else {
        console.log('[AGENT-SOCKET] created globalTelephonySocket');
        globalTelephonySocket = io(socketUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          auth: {
            agentId: user.id,
            token: typeof window !== 'undefined' ? (localStorage.getItem('paramantra_access_token') || localStorage.getItem('token') || '') : '',
          }
        });
      }
    }

    if (!globalMediaSocket) {
      const mediaSocketUrl = process.env.NEXT_PUBLIC_MEDIA_URL || `${API_BASE_URL}/`;
      const mainUrl = `${API_BASE_URL}/`;
      if (mediaSocketUrl === mainUrl || mediaSocketUrl.replace(/\/$/, '') === mainUrl.replace(/\/$/, '')) {
        console.log('[AGENT-SOCKET] reusing globalSocket for globalMediaSocket');
        globalMediaSocket = globalSocket;
      } else {
        console.log('[AGENT-SOCKET] created globalMediaSocket');
        globalMediaSocket = io(mediaSocketUrl, {
          transports: ['websocket'],
          reconnection: true,
          auth: {
            agentId: user.id,
            token: typeof window !== 'undefined' ? (localStorage.getItem('paramantra_access_token') || localStorage.getItem('token') || '') : '',
          }
        });
      }
    }

    const socketInstance = globalSocket;
    const telephonySocketInstance = globalTelephonySocket;
    const mediaSocketInstance = globalMediaSocket;

    const handleConnect = () => {
      setIsConnected(true);
      console.log('[AGENT-SOCKET]', 'connected globalSocket');

      const displayName = user.name || (user.email ? user.email.split('@')[0] : 'Agent');
      const token = typeof window !== 'undefined' ? (localStorage.getItem('paramantra_access_token') || localStorage.getItem('token') || '') : '';

      socketInstance.emit('agent_login', {
        agentId: user.agentId || user.id,
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        department: user.department || 'General',
        token,
      });
    };

    const handleTelephonyConnect = () => {
      console.log(`[INBOUND-SOCKET-AUDIT] telephonySocket connected socketId=${telephonySocketInstance.id}`);
      console.log(`[INBOUND-SOCKET-AUDIT] agentId=${user?.id} agentName=${user?.name} socketId=${telephonySocketInstance.id} socketType=telephony`);
      
      if (telephonySocketInstance !== socketInstance) {
        console.log('[AGENT-SOCKET]', 'connected globalTelephonySocket');
        const token = typeof window !== 'undefined' ? (localStorage.getItem('paramantra_access_token') || localStorage.getItem('token') || '') : '';
        telephonySocketInstance.emit('agent_login', {
          agentId: user.agentId || user.id,
          name: user.name || user.email,
          department: user.department || 'General',
          token,
        });
      }
    };

    const handleMediaConnect = () => {
      if (mediaSocketInstance !== socketInstance) {
        console.log('[AGENT-SOCKET]', 'connected globalMediaSocket');
        const token = typeof window !== 'undefined' ? (localStorage.getItem('paramantra_access_token') || localStorage.getItem('token') || '') : '';
        mediaSocketInstance.emit('agent_login', {
          agentId: user.agentId || user.id,
          name: user.name || user.email,
          department: user.department || 'General',
          token,
        });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('[AGENT-SOCKET]', 'disconnected globalSocket');
    };

    const handleTelephonyDisconnect = () => {
      if (telephonySocketInstance !== socketInstance) console.log('[AGENT-SOCKET]', 'disconnected globalTelephonySocket');
    }

    const handleMediaDisconnect = () => {
      if (mediaSocketInstance !== socketInstance) console.log('[AGENT-SOCKET]', 'disconnected globalMediaSocket');
    }

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    telephonySocketInstance.on('connect', handleTelephonyConnect);
    telephonySocketInstance.on('disconnect', handleTelephonyDisconnect);
    mediaSocketInstance.on('connect', handleMediaConnect);
    mediaSocketInstance.on('disconnect', handleMediaDisconnect);

    // Initial Login Emission (Only if already connected and not triggering onConnect listener)
    if (socketInstance.connected) {
      setIsConnected(true);
      socketInstance.emit('agent_login', {
        agentId: user.agentId || user.id,
        name: user.name || user.email,
        department: user.department || 'General'
      });
    }

    if (telephonySocketInstance.connected && telephonySocketInstance !== socketInstance) {
      telephonySocketInstance.emit('agent_login', {
        agentId: user.agentId || user.id,
        name: user.name || user.email,
        department: user.department || 'General'
      });
    }

    if (mediaSocketInstance.connected && mediaSocketInstance !== socketInstance) {
      mediaSocketInstance.emit('agent_login', {
        agentId: user.agentId || user.id,
        name: user.name || user.email,
        department: user.department || 'General'
      });
    }

    const handleNewWhatsAppMessage = (payload: any) => useConversationStore.getState().handleIncomingMessage(payload);
    const handleNewEmailMessage = (payload: any) => useConversationStore.getState().handleIncomingMessage(payload);
    const handleCustomerTyping = (data: any) => useConversationStore.getState().setTypingStatus(data.conversationId, data.isTyping);
    const handleInstagramProfileUpdated = (payload: any) => {
      console.log('socket event: instagram_profile_updated', payload);
      useConversationStore.getState().updateCustomerIdentity(payload);
    };
    const handleCustomerIdentityUpdated = (payload: any) => {
      console.log('socket event: customer_identity_updated', payload);
      useConversationStore.getState().updateCustomerIdentity(payload);
    };

    // Unified entrypoint for all Omnichannel events matching `{ conversation, message, customer }`
    const handleNewMessage = (payload: any) => {
      console.log('General new_message received:', payload);
      if (payload.conversation && payload.message && payload.customer) {
        useConversationStore.getState().handleIncomingMessage(payload);
      } else if (payload.conversationId && payload.message) {
        useConversationStore.getState().addMessage(payload.conversationId, payload.message);
      }
    };

    const handleConversationUpdated = (conv: any) => {
      console.log('Conversation updated:', conv);
      useConversationStore.getState().fetchConversations();
    };

    const handleIncomingCall = (data: any) => {
      console.log(`[INBOUND-E2E] STEP=FRONTEND_INCOMING_CALL_RECEIVED | event=incoming_call callId=${data.callSid || data.callId} roomName=${data.roomName} direction=${data.direction} provider=${data.provider || data.source} caller=${data.caller}`);
      console.log(`[INBOUND-CALL] frontend_event_received | data:`, data);
      const { status, fetchDashboardCalls } = useCallStore.getState();

      fetchDashboardCalls();

      if (status === 'AVAILABLE') {
        console.log(`[INBOUND-CALL] incoming_call_state_set | roomName=${data.roomName} caller=${data.caller} direction=${data.direction || 'INBOUND'} token_exists=${!!data.token}`);
        console.log(`[INBOUND-E2E] STEP=SETTING_ACTIVE_CALL`);
        useCallStore.getState().setIncomingCall(data);
        console.log(`[INBOUND-E2E] STEP=ACTIVE_CALL_PAYLOAD_PREPARED`);
      } else {
        console.log('Agent is not available, ignoring call.');
      }
    };

    const handleIncomingEmergencyCall = (data: any) => {
      console.log('Incoming EMERGENCY WebRTC Call:', data);
      useCallStore.getState().setIncomingCall(data);
    };

    const handleAgentAssigned = (data: any) => {
      const { incomingCall } = useCallStore.getState();
      if (incomingCall && incomingCall.callSid === data.callSid) {
        useCallStore.getState().setIncomingCall(null);
      }
    };

    const handleCallConnected = (data: any) => {
      console.log(`[SOCKET] callConnected received | callSid=${data.callSid}`);
      const { activeCall, updateActiveCallStatus } = useCallStore.getState();
      if (activeCall && activeCall.callSid === data.callSid) {
        updateActiveCallStatus('CONNECTED');
      }
    };

    const handleCallEnded = (data: any) => {
      console.log(`[INBOUND-E2E] CALL_ENDED_RECEIVED | sourceSocket=telephony callSid=${data.callSid} activeCallId=${useCallStore.getState().activeCall?.callSid}`);
      console.log('Call ended', data);
      const { setIncomingCall, setWebrtcConnected, fetchDashboardCalls, activeCall, updateActiveCallStatus } = useCallStore.getState();
      
      setIncomingCall(null);
      setWebrtcConnected(false);
      fetchDashboardCalls();

      if (activeCall && activeCall.callSid === data.callSid) {
        console.log(`[INBOUND-E2E] ACTIVE_CALL_DELEGATED | callId=${data.callSid} reason=updating_status_to_ended`);
        updateActiveCallStatus('ENDED');
      }
    };

    const handleCallRejected = (data: any) => {
      console.log('Call rejected', data);
      const { setIncomingCall, fetchDashboardCalls } = useCallStore.getState();
      setIncomingCall(null);
      fetchDashboardCalls();
    };

    useCallStore.subscribe((state, prevState) => {
      if (state.status !== prevState.status) {
        if (socketInstance.connected) {
          socketInstance.emit('status_update', { status: state.status });
        }
        if (mediaSocketInstance.connected) {
          mediaSocketInstance.emit('status_update', { status: state.status });
        }
      }
    });

    const handleAnalyticsUpdate = (data: any) => useAnalyticsStore.getState().setMetrics(data);

    const handleAiAnalysisUpdated = (data: any) => {
      console.log('AI Analysis Updated:', data);
      const store = useConversationStore.getState();
      if (store.activeCustomerProfile?.id === data.customerId) {
        store.fetchCustomerProfile(data.customerId);
      }
    };

    // Attach listeners
    socketInstance.on('new_whatsapp_message', handleNewWhatsAppMessage);
    socketInstance.on('new_email_message', handleNewEmailMessage);
    socketInstance.on('instagram_profile_updated', handleInstagramProfileUpdated);
    socketInstance.on('customer_identity_updated', handleCustomerIdentityUpdated);
    socketInstance.on('customer_typing', handleCustomerTyping);
    socketInstance.on('new_message', handleNewMessage);
    socketInstance.on('conversationUpdated', handleConversationUpdated);
    socketInstance.on('analyticsUpdate', handleAnalyticsUpdate);
    socketInstance.on('ai_analysis_updated', handleAiAnalysisUpdated);

    console.log(`[INBOUND-E2E] FRONTEND_SOCKET_LISTENER_REGISTERED | socketType=telephony socketId=${socketInstance.id} event=incoming_call`);
    telephonySocketInstance.on('incoming_call', handleIncomingCall);
    telephonySocketInstance.on('incomingEmergencyCall', handleIncomingEmergencyCall);
    telephonySocketInstance.on('agentAssigned', handleAgentAssigned);
    telephonySocketInstance.on('callConnected', handleCallConnected);
    telephonySocketInstance.on('callEnded', handleCallEnded);
    telephonySocketInstance.on('callRejected', handleCallRejected);
    telephonySocketInstance.on('agent_status_change', (data: any) => console.log('agent status changed', data));

    mediaSocketInstance.on('incomingCall', handleIncomingCall);
    mediaSocketInstance.on('agentAssigned', handleAgentAssigned);
    mediaSocketInstance.on('callEnded', (data: any) => {
      console.log(`[INBOUND-E2E] IGNORING LEGACY CALL_ENDED | sourceSocket=media callSid=${data.callSid} (Telephony socket is authoritative)`);
      return;
    });
    mediaSocketInstance.on('callRejected', handleCallRejected);
    mediaSocketInstance.on('callAccepted', (data: any) => {
      console.log('Call accepted (Mediasoup)', data);
      const { activeCall, setActiveCall } = useCallStore.getState();
      if (activeCall && activeCall.callSid === data.callSid) {
        setActiveCall({ ...activeCall, accepted: true });
      }
    });
    mediaSocketInstance.on('agent_status_change', (data: any) => console.log('agent status changed (Mediasoup)', data));

    useCallStore.getState().fetchDashboardCalls();

    setSocket(socketInstance);
    setTelephonySocket(telephonySocketInstance);
    setMediaSocket(mediaSocketInstance);

    const pollInterval = setInterval(async () => {
      const { status, incomingCall, setIncomingCall } = useCallStore.getState();
      if (status === 'AVAILABLE' && !incomingCall && user?.id) {
        try {
          let baseUrl = process.env.NEXT_PUBLIC_API_URL || `${API_BASE_URL}`;
          if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
          const apiUrl = `${baseUrl}/telephony/my-ringing-call?agentId=${user.id}`;

          const res = await apiFetch(apiUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.call) {
              console.log('Polling found incoming call:', data.call);
              setIncomingCall(data.call);
            }
          }
        } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('new_whatsapp_message', handleNewWhatsAppMessage);
      socketInstance.off('new_email_message', handleNewEmailMessage);
      socketInstance.off('instagram_profile_updated', handleInstagramProfileUpdated);
      socketInstance.off('customer_identity_updated', handleCustomerIdentityUpdated);
      socketInstance.off('customer_typing', handleCustomerTyping);
      socketInstance.off('new_message', handleNewMessage);
      socketInstance.off('conversationUpdated', handleConversationUpdated);
      socketInstance.off('analyticsUpdate', handleAnalyticsUpdate);
      socketInstance.off('ai_analysis_updated', handleAiAnalysisUpdated);

      telephonySocketInstance.off('connect', handleTelephonyConnect);
      telephonySocketInstance.off('disconnect', handleTelephonyDisconnect);
      telephonySocketInstance.off('incoming_call', handleIncomingCall);
      telephonySocketInstance.off('incomingEmergencyCall', handleIncomingEmergencyCall);
      telephonySocketInstance.off('agentAssigned', handleAgentAssigned);
      telephonySocketInstance.off('callEnded', handleCallEnded);
      telephonySocketInstance.off('callRejected', handleCallRejected);
      telephonySocketInstance.off('agent_status_change');

      mediaSocketInstance.off('connect', handleMediaConnect);
      mediaSocketInstance.off('disconnect', handleMediaDisconnect);
      mediaSocketInstance.off('incomingCall', handleIncomingCall);
      mediaSocketInstance.off('agentAssigned', handleAgentAssigned);
      mediaSocketInstance.off('callEnded', handleCallEnded);
      mediaSocketInstance.off('callRejected', handleCallRejected);
      mediaSocketInstance.off('callAccepted');
      mediaSocketInstance.off('agent_status_change');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.agentId]);

  return (
    <SocketContext.Provider value={{ socket, telephonySocket, mediaSocket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
