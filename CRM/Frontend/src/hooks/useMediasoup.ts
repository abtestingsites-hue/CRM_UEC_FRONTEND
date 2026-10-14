import { useState, useEffect, useRef } from 'react';
import { Device } from 'mediasoup-client';
import { Socket } from 'socket.io-client';

export const useMediasoup = (
  socket: Socket | null, 
  activeCallSid: string | undefined,
  isMuted: boolean,
  isSpeaker: boolean
) => {
  const deviceRef = useRef<Device | null>(null);
  const [micState, setMicState] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const speakerRef = useRef(isSpeaker);
  useEffect(() => {
    speakerRef.current = isSpeaker;
  }, [isSpeaker]);

  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  const audioProducerRef = useRef<any>(null);
  const audioConsumerRef = useRef<any>(null);

  useEffect(() => {
    if (!socket || !activeCallSid) return;

    let mounted = true;

    const initMediasoup = async () => {
      try {
        setMicState('CONNECTING');
        console.log('Initializing Mediasoup device...');
        
        // 1. Get Router Capabilities
        const capabilities = await new Promise<any>((resolve, reject) => {
          socket.emit('getRouterRtpCapabilities', {}, (res: any) => {
            if (res.error) reject(new Error(res.error));
            else resolve(res.capabilities);
          });
        });

        const newDevice = new Device();
        await newDevice.load({ routerRtpCapabilities: capabilities });
        if (mounted) deviceRef.current = newDevice;

        // 2. Create Send Transport
        console.log('Requesting send transport from backend...');
        const sendTransportParams = await new Promise<any>((resolve, reject) => {
          socket.emit('createWebRtcTransport', {}, (res: any) => {
            if (!res) return reject(new Error('No response from createWebRtcTransport'));
            if (res.error) reject(new Error(res.error));
            else resolve(res.params);
          });
        });
        
        console.log('Send transport params received:', sendTransportParams);

        const sendTransport = newDevice.createSendTransport(sendTransportParams);
        sendTransportRef.current = sendTransport;

        sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          console.log('sendTransport connect event fired');
          socket.emit('connectWebRtcTransport', { transportId: sendTransport.id, dtlsParameters }, (res: any) => {
            if (!res) return errback(new Error('No response on connect'));
            if (res.error) errback(new Error(res.error));
            else callback();
          });
        });

        sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          console.log('sendTransport produce event fired');
          socket.emit('produce', { transportId: sendTransport.id, kind, rtpParameters, callSid: activeCallSid }, (res: any) => {
            if (!res) return errback(new Error('No response on produce'));
            if (res.error) errback(new Error(res.error));
            else callback({ id: res.id });
          });
        });

        sendTransport.on('connectionstatechange', (state) => {
          console.log('sendTransport connectionstatechange:', state);
        });

        // 3. Create Receive Transport
        const recvTransportParams = await new Promise<any>((resolve, reject) => {
          socket.emit('createWebRtcTransport', {}, (res: any) => {
            if (res.error) reject(new Error(res.error));
            else resolve(res.params);
          });
        });

        const recvTransport = newDevice.createRecvTransport(recvTransportParams);
        recvTransportRef.current = recvTransport;

        recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          socket.emit('connectWebRtcTransport', { transportId: recvTransport.id, dtlsParameters }, (res: any) => {
            if (res.error) errback(new Error(res.error));
            else callback();
          });
        });

        // 4. Start Mic
        if (!mounted) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = stream.getAudioTracks()[0];
        
        if (!mounted) {
          audioTrack.stop();
          return;
        }

        audioProducerRef.current = await sendTransport.produce({ track: audioTrack });
        if (mounted) setMicState('CONNECTED');

      } catch (err: any) {
        console.error('Mediasoup init error:', err);
        if (mounted) {
          setError(err.message);
          setMicState('ERROR');
        }
      }
    };

    initMediasoup();

    const handleNewProducer = async ({ producerId, callSid }: any) => {
      if (callSid !== activeCallSid) return;
      const currentDevice = deviceRef.current;
      if (!currentDevice || !recvTransportRef.current) return;

      try {
        const consumerParams = await new Promise<any>((resolve, reject) => {
          socket.emit('consume', {
            transportId: recvTransportRef.current.id,
            producerId,
            rtpCapabilities: currentDevice.rtpCapabilities
          }, (res: any) => {
            if (res.error) reject(new Error(res.error));
            else resolve(res.params);
          });
        });

        const consumer = await recvTransportRef.current.consume({
          id: consumerParams.id,
          producerId: consumerParams.producerId,
          kind: consumerParams.kind,
          rtpParameters: consumerParams.rtpParameters,
        });

        audioConsumerRef.current = consumer;

        // Create a global audio element to play the remote stream
        const track = consumer.track;
        const stream = new MediaStream([track]);
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.muted = !speakerRef.current; // Apply initial mute state
        audio.play().catch(e => console.error('Audio play blocked:', e));
        
        // Expose audio globally so it can be cleaned up
        (window as any)[`remoteAudio_${activeCallSid}`] = audio;

      } catch (err) {
        console.error('Error consuming remote stream:', err);
      }
    };

    socket.on('newProducer', handleNewProducer);

    return () => {
      mounted = false;
      socket.off('newProducer', handleNewProducer);
      
      if (audioProducerRef.current) audioProducerRef.current.close();
      if (audioConsumerRef.current) audioConsumerRef.current.close();
      if (sendTransportRef.current) sendTransportRef.current.close();
      if (recvTransportRef.current) recvTransportRef.current.close();
      
      const audioEl = (window as any)[`remoteAudio_${activeCallSid}`];
      if (audioEl) {
        audioEl.pause();
        audioEl.srcObject = null;
        delete (window as any)[`remoteAudio_${activeCallSid}`];
      }
    };
  }, [socket, activeCallSid]); // Removed device to prevent infinite loop

  // Handle Microphone Mute
  useEffect(() => {
    if (audioProducerRef.current) {
      if (isMuted) {
        audioProducerRef.current.pause();
      } else {
        audioProducerRef.current.resume();
      }
    }
  }, [isMuted]);

  // Handle Speaker (Remote Audio Mute)
  useEffect(() => {
    if (!activeCallSid) return;
    const audioEl = (window as any)[`remoteAudio_${activeCallSid}`];
    if (audioEl) {
      audioEl.muted = !isSpeaker;
    }
  }, [isSpeaker, activeCallSid]);

  return { device: deviceRef.current, micState, error };
};
