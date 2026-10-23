"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User, Clock, Loader2, Circle, Pause, ArrowRight, FileText, PhoneForwarded, History } from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';
import { useSocket } from '@/providers/SocketProvider';
import { PostCallFeedbackModal } from '@/components/call-center/PostCallFeedbackModal';
import { LeadConversionModal } from '@/components/leads/LeadConversionModal';
import { CallIntakeFormModal } from '@/components/call-center/CallIntakeFormModal';
import { CallTransferModal } from '@/components/call-center/CallTransferModal';
import { CustomerHistoryDrawer } from '@/components/call-center/CustomerHistoryDrawer';
import { useMediasoup } from '@/hooks/useMediasoup';
import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useRoomContext, useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
function LiveKitManager({ setCallState, setWebrtcConnected, callSid, isMuted, isSpeaker, callCategory, telephonySocket }: any) {
  const room = useRoomContext();
  const state = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  useEffect(() => {
    console.log('[LK-MANAGER]', 'mounted', { callSid, roomState: room?.state });
    return () => console.log('[LK-MANAGER]', 'unmounted', { callSid });
  }, [callSid]);

  const hasStartedRecording = useRef(false);

  // Helper to mark call as CONNECTED and trigger recording once
  const markConnectedAndRecord = () => {
    setCallState('CONNECTED');
    setWebrtcConnected(true);
    if (telephonySocket && room && !hasStartedRecording.current) {
      hasStartedRecording.current = true;
      console.log(`[CALL-RECORDING] Emitting startRecording callSid=${callSid} roomName=${room.name}`);
      telephonySocket.emit('startRecording', { callSid, roomName: room.name });
    }
  };

  // Autoplay unlock
  useEffect(() => {
    if (room && typeof (room as any).startAudio === 'function') {
      (room as any).startAudio().catch((e: any) => console.log('[LK-ROOT] startAudio autoplay wait:', e));
    }
  }, [room, state]);

  useEffect(() => {
    console.log('[LK-MANAGER]', 'room_context_available', { callSid, roomName: room?.name, state: room?.state });
    if (!room) return;

    const logEvent = (eventName: string, ...args: any[]) => {
      console.log('[LK-ROOT]', JSON.stringify({
        callId: callSid,
        roomName: room.name,
        roomState: room.state,
        eventName: eventName,
        args: args.map(a => a?.identity || a?.message || a?.name || typeof a)
      }));
    };

    const checkSipStatus = (participantIdentity: string, status: string) => {
      console.log(`[CALL-LIVEKIT-SIP-STATE] callSessionId=${callSid} participantIdentity=${participantIdentity} sip.callStatus=${status}`);
      if (status === 'active') {
        markConnectedAndRecord();
      } else if (status === 'hangup' || status === 'disconnect') {
        setCallState('ENDED');
      }
    };

    const events = {
      connected: () => {
        logEvent('connected');
        if (typeof (room as any).startAudio === 'function') {
          (room as any).startAudio().catch(() => {});
        }
      },
      disconnected: (reason: any) => logEvent('disconnected', reason),
      reconnecting: () => logEvent('reconnecting'),
      reconnected: () => logEvent('reconnected'),
      mediaDevicesError: (e: any) => logEvent('media_devices_error', e),
      participantConnected: (p: any) => {
        logEvent('participant_connected', p);
        if (!p.isLocal) {
          markConnectedAndRecord();
        }
      },
      participantDisconnected: (p: any) => logEvent('participant_disconnected', p),
      participantAttributesChanged: (changedAttributes: any, participant: any) => {
        if (participant.identity.startsWith('sip_') && changedAttributes['sip.callStatus']) {
          checkSipStatus(participant.identity, changedAttributes['sip.callStatus']);
        }
      },
      localTrackPublished: (t: any) => logEvent('local_track_published', t),
      localTrackUnpublished: (t: any) => logEvent('local_track_unpublished', t)
    };

    room.on('connected', events.connected);
    room.on('disconnected', events.disconnected);
    room.on('reconnecting', events.reconnecting);
    room.on('reconnected', events.reconnected);
    room.on('mediaDevicesError', events.mediaDevicesError);
    room.on('participantConnected', events.participantConnected);
    room.on('participantDisconnected', events.participantDisconnected);
    room.on('participantAttributesChanged', events.participantAttributesChanged);
    room.on('localTrackPublished', events.localTrackPublished);
    room.on('localTrackUnpublished', events.localTrackUnpublished);

    return () => {
      room.off('connected', events.connected);
      room.off('disconnected', events.disconnected);
      room.off('reconnecting', events.reconnecting);
      room.off('reconnected', events.reconnected);
      room.off('mediaDevicesError', events.mediaDevicesError);
      room.off('participantConnected', events.participantConnected);
      room.off('participantDisconnected', events.participantDisconnected);
      room.off('participantAttributesChanged', events.participantAttributesChanged);
      room.off('localTrackPublished', events.localTrackPublished);
      room.off('localTrackUnpublished', events.localTrackUnpublished);
    };
  }, [room, callSid]);

  useEffect(() => {
    if (!room || state !== 'connected') return;
    
    // Explicitly scan remote participants in case they joined before listeners attached
    if (remoteParticipants.length > 0) {
      const hasActive = remoteParticipants.some(p => {
        const isSipActive = p.attributes?.['sip.callStatus'] === 'active';
        const hasAudio = p.audioTrackPublications?.size > 0;
        return isSipActive || hasAudio || p.identity.startsWith('sip_');
      });
      if (hasActive) {
        markConnectedAndRecord();
      }
    }
  }, [remoteParticipants, room, state]);

  useEffect(() => {
    if (state === 'connected') {
      if (callCategory === 'Inbound') {
        markConnectedAndRecord();
        console.log('[WEBRTC-DIAGNOSTIC]', JSON.stringify({
          event: 'room_connected_inbound',
          callId: callSid,
          roomName: room?.name,
          connectionState: state,
          reason: 'LiveKit Room is fully connected (Inbound).'
        }));
      } else {
        // Outbound call
        if (remoteParticipants.length > 0) {
          markConnectedAndRecord();
        } else {
          setCallState('RINGING');
        }
        setWebrtcConnected(true);
      }
    } else if (state === 'connecting') {
      setCallState('CONNECTING');
    } else if (state === 'disconnected') {
      console.log('[WEBRTC-DIAGNOSTIC]', JSON.stringify({
        event: 'room_disconnected',
        callId: callSid,
        roomName: room?.name,
        connectionState: state,
        participantIdentity: room?.localParticipant?.identity,
        reason: 'LiveKit Room disconnected.'
      }));
    }
  }, [state, room, callSid, setCallState, setWebrtcConnected, callCategory, remoteParticipants.length]);

  // Handle Microphone Lifecycle safely without causing redundant renegotiation
  useEffect(() => {
    if (state !== 'connected' || !room || !localParticipant) return;

    const manageMicrophone = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log('[WEBRTC-DIAGNOSTIC]', JSON.stringify({
            event: 'microphone_permission',
            callId: callSid,
            roomName: room.name,
            connectionState: state,
            participantIdentity: localParticipant.identity,
            error: 'navigator.mediaDevices.getUserMedia is not supported or not available (HTTPS required)'
          }));
          return;
        }

        // Only toggle if microphone state differs from desired state
        if (localParticipant.isMicrophoneEnabled === isMuted) {
          console.log('[WEBRTC-DIAGNOSTIC]', JSON.stringify({
            event: 'microphone_publish_start',
            callId: callSid,
            roomName: room.name,
            connectionState: state,
            participantIdentity: localParticipant.identity,
            reason: `Syncing mic state: desired=${!isMuted}`
          }));

          await localParticipant.setMicrophoneEnabled(!isMuted);

          console.log('[WEBRTC-DIAGNOSTIC]', JSON.stringify({
            event: 'microphone_publish_success',
            callId: callSid,
            roomName: room.name,
            connectionState: state,
            participantIdentity: localParticipant.identity,
            reason: `Microphone synced successfully, muted: ${isMuted}`
          }));
          console.log('[INBOUND-AUDIO] local_microphone_published | muted=' + isMuted);
        }
      } catch (err: any) {
        console.error('[WEBRTC-DIAGNOSTIC]', JSON.stringify({
          event: 'microphone_publish_failure',
          callId: callSid,
          roomName: room.name,
          connectionState: state,
          participantIdentity: localParticipant.identity,
          error: err.message
        }));
      }
    };

    manageMicrophone();
  }, [state, room, localParticipant, isMuted, callSid]);

  // Handle remote audio subscriptions
  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      if (track.kind === 'audio') {
        if (typeof (room as any).startAudio === 'function') {
          (room as any).startAudio().catch(() => {});
        }
        try {
          track.attach();
        } catch (_) {}
        console.log('[WEBRTC-DIAGNOSTIC]', JSON.stringify({
          event: 'remote_audio_subscribed',
          callId: callSid,
          roomName: room.name,
          connectionState: room.state,
          participantIdentity: participant.identity,
          trackSid: track.sid,
          trackKind: track.kind,
          isMuted: track.isMuted
        }));
        console.log('[INBOUND-AUDIO] remote_audio_subscribed | callId=' + callSid);
        markConnectedAndRecord();
      }
    };

    room.on('trackSubscribed', handleTrackSubscribed);

    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
    };
  }, [room, callSid]);

  return null;
}


function CallControlsInner({ 
  duration, 
  endCall, 
  connectionState,
  isSpeaker,
  toggleSpeaker,
  onTransferClick,
}: { 
  duration: number; 
  endCall: () => void; 
  connectionState: string;
  isSpeaker: boolean;
  toggleSpeaker: () => void;
  onTransferClick?: () => void;
}) {
  const { isMuted, toggleMute } = useCallStore();

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-center gap-4 mt-6">
        <button 
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          disabled={connectionState !== 'CONNECTED'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            connectionState !== 'CONNECTED' ? 'bg-[#111] text-slate-600 cursor-not-allowed opacity-50' :
            isMuted ? 'bg-white text-black hover:bg-slate-200' : 'bg-[#222] text-white hover:bg-[#333] border border-[#333]'
          }`}
          title="Mute"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={toggleSpeaker}
          aria-label={isSpeaker ? 'Disable speaker' : 'Enable speaker'}
          disabled={connectionState !== 'CONNECTED' && connectionState !== 'RINGING'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            connectionState !== 'CONNECTED' && connectionState !== 'RINGING' ? 'bg-[#111] text-slate-600 cursor-not-allowed opacity-50' :
            !isSpeaker ? 'bg-white text-black hover:bg-slate-200' : 'bg-[#222] text-white hover:bg-[#333] border border-[#333]'
          }`}
          title="Speaker"
        >
          {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Live Call Transfer Button */}
        <button 
          onClick={onTransferClick}
          aria-label="Transfer Call"
          disabled={connectionState !== 'CONNECTED'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            connectionState !== 'CONNECTED' 
              ? 'bg-[#111] text-slate-600 cursor-not-allowed opacity-50' 
              : 'bg-[#1a232a] text-cyan-400 hover:bg-[#20303a] border border-cyan-500/40 hover:border-cyan-400 shadow-md shadow-cyan-500/10'
          }`}
          title="Transfer Call to Department or Agent"
        >
          <PhoneForwarded className="w-5 h-5" />
        </button>

        <button 
          onClick={endCall}
          aria-label="End call"
          className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 transition-transform active:scale-95 border-2 border-rose-400"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}

export function CallWidget() {
  const { activeCall, status, setStatus, setWebrtcConnected, connectedAt, setActiveCall, updateActiveCallStatus } = useCallStore();
  const { telephonySocket, mediaSocket } = useSocket();
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [duration, setDuration] = useState(0);
  
  const callState = activeCall?.status || 'IDLE';

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Prevent duplicate endCall requests
  const endCallRequestedRef = useRef(false);

  // Track sessions where Call Intake was already opened to prevent duplicate auto-openings on rerenders/reconnects
  const autoOpenedSessionsRef = useRef<Set<string>>(new Set());

  // Canonical customer phone number resolution (Inbound caller ID vs Outbound dialed destination)
  const resolvedCustomerPhone = React.useMemo(() => {
    if (!activeCall) return '';
    // Outbound calls: use the customer destination number that the agent dialed
    if (activeCall.isCaller || activeCall.direction === 'OUTBOUND') {
      return activeCall.phone || '';
    }
    // Inbound calls: use the provider's actual caller ID rather than agent answering trunk/DID
    return (activeCall as any).caller || (activeCall as any).from || activeCall.phone || '';
  }, [activeCall]);

  const resolvedCustomerName = React.useMemo(() => {
    if (!activeCall) return '';
    if (activeCall.customerName && activeCall.customerName !== 'Customer' && activeCall.customerName !== 'Unknown Caller') {
      return activeCall.customerName;
    }
    return (activeCall as any).callerName || activeCall.customerName || '';
  }, [activeCall]);

  // Automatically open Call Intake modal when a real call is answered/connected with valid session ID
  useEffect(() => {
    const currentSessionId = activeCall?.callSid || activeCall?.roomName;
    if (callState === 'CONNECTED' && currentSessionId) {
      // Avoid opening intake modal for internal directory calls
      const isInternal = Boolean(
        activeCall?.isInternal || 
        activeCall?.callCategory === 'INTERNAL' ||
        activeCall?.type === 'INTERNAL' ||
        (activeCall?.phone && activeCall.phone.toLowerCase() === 'internal') ||
        (activeCall?.phone && activeCall.phone.startsWith('ext_'))
      );

      if (!isInternal && !autoOpenedSessionsRef.current.has(currentSessionId)) {
        autoOpenedSessionsRef.current.add(currentSessionId);
        setShowIntakeModal(true);
      }
    }
  }, [callState, activeCall?.callSid, activeCall?.roomName, activeCall?.isInternal, activeCall?.callCategory, activeCall?.type, activeCall?.phone]);

  useEffect(() => {
    // Reset guard when activeCall changes
    endCallRequestedRef.current = false;
  }, [activeCall?.callSid]);

  useEffect(() => {
    console.log('[LK-ROOT]', 'render', {
      callId: activeCall?.callSid,
      roomName: activeCall?.roomName,
      hasToken: !!activeCall?.token
    });
    console.log(`[INBOUND-E2E] CALLWIDGET_ACTIVE_CALL | hasActiveCall=${!!activeCall} callId=${activeCall?.callSid} roomName=${activeCall?.roomName} hasToken=${!!activeCall?.token}`);
    console.log('[INBOUND-CALL] call_widget_rendered | callId=' + activeCall?.callSid + ' caller=' + activeCall?.phone);
  });

  useEffect(() => {
    return () => {
      console.log('[LK-ROOT]', 'component_unmount', {
        callId: activeCall?.callSid
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync initial call state when activeCall changes
  useEffect(() => {
    if (activeCall && !activeCall.status && !activeCall.accepted) {
      updateActiveCallStatus(activeCall.isCaller ? 'CONNECTING' : 'RINGING');
    }
  }, [activeCall, updateActiveCallStatus]);

  // Call Timer
  useEffect(() => {
    if (callState === 'CONNECTED' || connectedAt) {
      timerRef.current = setInterval(() => {
        if (connectedAt) {
          setDuration(Math.floor((Date.now() - connectedAt) / 1000));
        } else {
          setDuration(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState, connectedAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Determine if this is a LiveKit call
  const isLiveKit = !!activeCall?.token;

  // Use Mediasoup via custom hook when call is accepted (and not LiveKit)
  const { isMuted } = useCallStore();
  const { micState } = useMediasoup(
    (activeCall?.accepted && !isLiveKit) ? mediaSocket : null, 
    activeCall?.callSid,
    isMuted,
    isSpeaker
  );

  useEffect(() => {
    if (isLiveKit) return; // Handled by LiveKitConnectionSync
    if (micState === 'CONNECTED') {
      updateActiveCallStatus('CONNECTED');
      setWebrtcConnected(true);
    } else if (micState === 'CONNECTING') {
      updateActiveCallStatus('CONNECTING');
    } else if (micState === 'ERROR') {
      endCallLocally();
    }
  }, [micState, isLiveKit, updateActiveCallStatus]);



  useEffect(() => {
    if (activeCall?.status === 'ENDED') {
      endCallLocally();
    }
  }, [activeCall?.status]);

  const endCallLocally = () => {
    const currentCall = useCallStore.getState().activeCall;
    
    // updateActiveCallStatus('ENDED') is already handled by SocketProvider or endCall()
    setWebrtcConnected(false);
    setStatus('AVAILABLE');
    
    // Release pre-warmed microphone stream to turn off the hardware
    if ((window as any)._prewarmedAudioStream) {
      (window as any)._prewarmedAudioStream.getTracks().forEach((track: any) => track.stop());
      (window as any)._prewarmedAudioStream = null;
    }
    
    setTimeout(() => {
      if (currentCall?.category === 'Outbound') {
        if (currentCall.leadId) {
          setShowConversionModal(true);
        } else {
          setShowFeedbackModal(true);
        }
      } else {
        handleFeedbackComplete(currentCall?.callSid);
      }
    }, 2000);
  };

  const endCall = () => {
    if (telephonySocket && activeCall) {
      if (endCallRequestedRef.current) {
        console.log('[END-CALL-FLOW]', JSON.stringify({
          callId: activeCall.callSid,
          source: 'explicit_user_end',
          event: 'ignored_duplicate'
        }));
        return;
      }
      
      endCallRequestedRef.current = true;
      console.log('[END-CALL-FLOW]', JSON.stringify({
        callId: activeCall.callSid,
        source: 'explicit_user_end',
        event: 'request'
      }));

      // Notify backend to teardown Exotel SIP if necessary
      let agentId = null;
      try {
        const stored = localStorage.getItem('crm_user');
        if (stored) agentId = JSON.parse(stored).agentId;
      } catch (e) { console.warn('[UI Exception Swallowed Fixed]:', e); }

      if ((activeCall.phone === 'Internal' || activeCall.phone === 'Internal Directory Call') && mediaSocket) {
        mediaSocket.emit('endCall', {
          callSid: activeCall.callSid,
          roomName: activeCall.roomName,
          isCaller: activeCall.isCaller,
          category: activeCall.category,
          agentId: agentId
        });
      } else if (telephonySocket) {
        telephonySocket.emit('endCall', { 
          callSid: activeCall.callSid,
          roomName: activeCall.roomName,
          isCaller: activeCall.isCaller,
          category: activeCall.category,
          agentId: agentId,
          duration: duration || 1
        });
      }
      
      console.log('[CALL-LIFECYCLE]', JSON.stringify({
        event: 'explicit_user_end',
        sessionID: activeCall.callSid,
        roomName: activeCall.roomName,
        currentCRMStatus: useCallStore.getState().status,
        reason: 'User explicitly clicked End Call in CRM',
      }));
      // DO NOT call endCallLocally() here! Wait for backend to emit callEnded.
    }
  };

  const handleFeedbackComplete = (endedCallSid?: string) => {
    setShowFeedbackModal(false);
    setShowConversionModal(false);
    
    const currentCall = useCallStore.getState().activeCall;
    if (!currentCall || currentCall.callSid === endedCallSid) {
      setActiveCall(null);
      setDuration(0);
    }
  };

  if (!activeCall && callState === 'IDLE' && !showFeedbackModal && !showConversionModal) {
    return (
      <div className="text-center w-full max-w-md">
        <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-black/50 border border-[#222]">
           <Phone className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Ready for Calls</h2>
        <p className="text-slate-500 mb-8 text-sm">Select an agent or wait for incoming calls.</p>
        <div className="flex justify-center gap-2 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className={`w-2 h-2 rounded-full ${telephonySocket ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></div>
            <span className={`text-xs font-bold ${telephonySocket ? 'text-emerald-500' : 'text-amber-500'}`}>
              {telephonySocket ? 'System Online' : 'Connecting to System...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const customerData = activeCall?.customerContext?.customer;

  return (
    <>
      <div className="w-full max-w-sm bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#222] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background Glow Effect */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000 ${
          callState === 'CONNECTED' ? 'bg-emerald-500' : 
          callState === 'RINGING' ? 'bg-primary' : 
          callState === 'ENDED' ? 'bg-rose-500' : 'bg-blue-500'
        }`}></div>

        <div className="relative z-10">
          {/* Header Status */}
          <div className="flex justify-between items-center mb-8">
            <span className={`text-xs font-bold tracking-wider px-3 py-1 rounded-full uppercase flex items-center gap-2 ${
              callState === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
              callState === 'RINGING' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' : 
              callState === 'ENDED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
              'bg-blue-500/10 text-blue-500 border border-blue-500/20'
            }`}>
              {callState === 'CONNECTED' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
              {callState}
            </span>
            {callState === 'CONNECTED' && (
              <span className="font-mono font-bold text-white tracking-widest text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                {formatTime(duration)}
              </span>
            )}
          </div>

          {/* Profile / Caller Info */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="relative mb-4">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold border-4 shadow-lg transition-all duration-500 ${
                callState === 'CONNECTED' ? 'border-emerald-500/50 bg-[#111] text-emerald-400 shadow-emerald-500/20' : 
                callState === 'RINGING' ? 'border-primary/50 bg-[#111] text-primary shadow-primary/20 animate-bounce' : 
                'border-[#333] bg-[#111] text-white shadow-black'
              }`}>
                {activeCall?.customerName?.substring(0, 1).toUpperCase() || 'U'}
              </div>
              
              {/* Recording Indicator */}
              {callState === 'CONNECTED' && (
                <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-rose-400 shadow-lg animate-pulse">
                  <Circle className="w-3 h-3 fill-current" /> REC
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1 truncate w-full text-center">
              {customerData?.name || activeCall?.customerName || 'Unknown Caller'}
            </h2>
            <p className="text-slate-400 flex items-center gap-2 mb-2">
              {callState === 'CONNECTING' && <Loader2 className="w-3 h-3 animate-spin" />}
              {customerData?.phone || activeCall?.phone || 'VoIP WebRTC Link'}
            </p>
            
          {/* LiveKit Connection */}
          {activeCall?.accepted && isLiveKit && (
            <div className="mt-4 w-full">
              <LiveKitRoom
                serverUrl={activeCall?.serverUrl || activeCall?.wsUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://23jy3gv6xcs.livekit.cloud'}
                token={activeCall.token}
                connect={callState !== 'ENDED'}
                audio={!isMuted} // Pre-warms and publishes audio on initial connection to avoid 2-5s delay
                video={false}
              >
                <RoomAudioRenderer volume={1} muted={!isSpeaker} />
                <LiveKitManager 
                  setCallState={updateActiveCallStatus} 
                  setWebrtcConnected={setWebrtcConnected} 
                  callSid={activeCall.callSid}
                  isMuted={isMuted}
                  isSpeaker={isSpeaker}
                  callCategory={activeCall.category}
                  telephonySocket={telephonySocket}
                />
              </LiveKitRoom>
              <CallControlsInner 
                duration={duration} 
                endCall={endCall}
                connectionState={callState}
                isSpeaker={isSpeaker}
                toggleSpeaker={() => setIsSpeaker(!isSpeaker)}
                onTransferClick={() => setShowTransferModal(true)}
              />
            </div>
          )}

          {/* Mediasoup Connection State */}
          {activeCall?.accepted && !isLiveKit && (
            <div className="mt-4 w-full">
              <CallControlsInner 
                duration={duration} 
                endCall={endCall}
                connectionState={callState}
                isSpeaker={isSpeaker}
                toggleSpeaker={() => setIsSpeaker(!isSpeaker)}
                onTransferClick={() => setShowTransferModal(true)}
              />
            </div>
          )}
          {/* Action triggers: Pre-Call/Active-Call Customer History & Intake */}
          {activeCall && (
            <div className="w-full flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowCustomerHistory(true)}
                className="flex-1 py-2 px-2.5 rounded-xl bg-orange-950/40 hover:bg-orange-900/50 border border-orange-500/40 text-orange-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                title="View customer cross-unit interaction history, previous enquiries and recordings"
              >
                <History className="w-4 h-4 text-orange-400" />
                <span>Customer History</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIntakeModal(true)}
                className="flex-1 py-2 px-2.5 rounded-xl bg-[#141e26] hover:bg-[#1b2934] border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Intake & Notes</span>
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {showIntakeModal && (
        <CallIntakeFormModal
          callSid={activeCall?.callSid || activeCall?.roomName || 'unknown'}
          customerName={resolvedCustomerName}
          phoneNumber={resolvedCustomerPhone}
          leadId={activeCall?.leadId}
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onSuccess={() => setShowIntakeModal(false)}
        />
      )}

      {showTransferModal && (
        <CallTransferModal
          callSid={activeCall?.callSid || activeCall?.roomName || 'unknown'}
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            setActiveCall(null);
            setStatus('AVAILABLE');
          }}
          callerName={resolvedCustomerName}
          callerPhone={resolvedCustomerPhone}
        />
      )}

      {showFeedbackModal && (
        <PostCallFeedbackModal 
          callSid={activeCall?.callSid || 'unknown'} 
          onClose={handleFeedbackComplete} 
          onSubmit={handleFeedbackComplete} 
        />
      )}

      {showConversionModal && (
        <LeadConversionModal 
          leadId={activeCall?.leadId || ''} 
          onClose={handleFeedbackComplete} 
          onSubmit={handleFeedbackComplete} 
        />
      )}

      {showCustomerHistory && (
        <CustomerHistoryDrawer
          identifier={resolvedCustomerPhone || resolvedCustomerName || ''}
          isOpen={showCustomerHistory}
          onClose={() => setShowCustomerHistory(false)}
        />
      )}
    </>
  );
}

