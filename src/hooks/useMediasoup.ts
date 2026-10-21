import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useMediasoup = (
  socket: Socket | null, 
  activeCallSid: string | undefined,
  isMuted: boolean,
  isSpeaker: boolean
) => {
  const [micState, setMicState] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const speakerRef = useRef(isSpeaker);
  useEffect(() => {
    speakerRef.current = isSpeaker;
    const audioEl = (window as any)[`remoteAudio_${activeCallSid}`];
    if (audioEl) {
      audioEl.muted = !isSpeaker;
    }
  }, [isSpeaker, activeCallSid]);

  // Handle Microphone Mute
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (!socket || !activeCallSid) {
      setMicState('IDLE');
      return;
    }

    let mounted = true;
    setMicState('CONNECTING');
    console.log(`[Pure WebRTC] Initializing connection for call: ${activeCallSid}`);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Handle incoming remote audio stream
    pc.ontrack = (event) => {
      console.log('[Pure WebRTC] Remote track received:', event.track.kind);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = (window as any)[`remoteAudio_${activeCallSid}`];
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          (window as any)[`remoteAudio_${activeCallSid}`] = audioEl;
        }
        audioEl.srcObject = remoteStream;
        audioEl.muted = !speakerRef.current;
        audioEl.play().catch((e: any) => console.error('[Pure WebRTC] Audio play blocked:', e));
      }
    };

    // Forward local ICE candidates to peer via signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.connected) {
        socket.emit('webrtc_ice_candidate', {
          callSid: activeCallSid,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection states
    pc.onconnectionstatechange = () => {
      console.log('[Pure WebRTC] Connection state:', pc.connectionState);
      if (!mounted) return;
      if (pc.connectionState === 'connected') {
        setMicState('CONNECTED');
      } else if (pc.connectionState === 'failed') {
        setError('WebRTC connection failed');
        setMicState('ERROR');
      } else if (pc.connectionState === 'closed') {
        setMicState('IDLE');
      }
    };

    // Setup media & join room
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
          pc.addTrack(track, stream);
        });

        // Join signaling room
        socket.emit('webrtc_join', { callSid: activeCallSid });
        if (mounted) setMicState('CONNECTED');
      } catch (err: any) {
        console.error('[Pure WebRTC] Microphone access error:', err);
        if (mounted) {
          setError(err.message || 'Microphone access denied');
          setMicState('ERROR');
        }
      }
    };

    initAudio();

    // Signaling Handlers
    const handlePeerJoined = async ({ socketId }: { socketId: string }) => {
      try {
        console.log(`[Pure WebRTC] Peer joined (${socketId}), creating offer...`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', {
          callSid: activeCallSid,
          sdp: offer,
          targetSocketId: socketId,
        });
      } catch (err) {
        console.error('[Pure WebRTC] Error creating offer:', err);
      }
    };

    const handleOffer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      try {
        console.log(`[Pure WebRTC] Received offer from ${from}, creating answer...`);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', {
          callSid: activeCallSid,
          sdp: answer,
          targetSocketId: from,
        });
      } catch (err) {
        console.error('[Pure WebRTC] Error handling offer:', err);
      }
    };

    const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      try {
        console.log('[Pure WebRTC] Received answer, applying remote description...');
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      } catch (err) {
        console.error('[Pure WebRTC] Error handling answer:', err);
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        if (candidate && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[Pure WebRTC] Error adding ICE candidate:', err);
      }
    };

    socket.on('webrtc_peer_joined', handlePeerJoined);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      mounted = false;
      socket.off('webrtc_peer_joined', handlePeerJoined);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);

      socket.emit('webrtc_leave', { callSid: activeCallSid });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      pc.close();
      pcRef.current = null;

      const audioEl = (window as any)[`remoteAudio_${activeCallSid}`];
      if (audioEl) {
        audioEl.pause();
        audioEl.srcObject = null;
        delete (window as any)[`remoteAudio_${activeCallSid}`];
      }
    };
  }, [socket, activeCallSid]);

  return { device: null, micState, error };
};
