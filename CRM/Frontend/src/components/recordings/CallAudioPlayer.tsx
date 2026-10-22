"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle, RefreshCw, Mic, MicOff, Clock, ShieldAlert } from 'lucide-react';
import { apiFetch, sanitizeRecordingUrl } from '@/lib/api';

interface CallAudioPlayerProps {
  callId?: string;
  initialRecordingUrl?: string | null;
  initialStatus?: string | null;
  duration?: number;
  customerName?: string;
}

export function CallAudioPlayer({
  callId,
  initialRecordingUrl,
  initialStatus,
  duration = 0,
  customerName,
}: CallAudioPlayerProps) {
  const [status, setStatus] = useState<string>(initialStatus || (initialRecordingUrl ? 'READY' : 'NOT_AVAILABLE'));
  const [recordingUrl, setRecordingUrl] = useState<string | null>(sanitizeRecordingUrl(initialRecordingUrl) || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoRefreshedRef = useRef<boolean>(false);

  // Sync state if initial props change
  useEffect(() => {
    const cleanUrl = sanitizeRecordingUrl(initialRecordingUrl);
    if (cleanUrl && cleanUrl !== recordingUrl) {
      setRecordingUrl(cleanUrl);
      setStatus('READY');
    } else if (initialStatus && initialStatus !== status) {
      setStatus(initialStatus);
    }
  }, [initialRecordingUrl, initialStatus]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Refresh playback token / url securely from backend
  const handleRefreshPlayback = async () => {
    if (!callId) {
      setErrorMessage('No call ID associated with this summary.');
      setStatus('ERROR');
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch(`/telephony/calls/${callId}/playback-url`);
      const data = await res.json();

      if (data.success && data.recordingUrl) {
        setRecordingUrl(sanitizeRecordingUrl(data.recordingUrl));
        setStatus('READY');
        if (data.duration) {
          setAudioDuration(data.duration);
        }
      } else if (data.recordingStatus) {
        setStatus(data.recordingStatus);
        if (data.recordingStatus === 'PROCESSING') {
          setErrorMessage('Recording is still being finalized. Please check back shortly.');
        } else if (data.recordingStatus === 'NOT_AVAILABLE') {
          setErrorMessage('No recording is available for this call.');
        } else {
          setErrorMessage(data.error || 'Recording not ready.');
        }
      } else {
        setStatus('ERROR');
        setErrorMessage(data.error || 'Unable to retrieve playback authorization.');
      }
    } catch (err: any) {
      console.error('[CallAudioPlayer] Refresh failed:', err);
      setStatus('ERROR');
      setErrorMessage('Network error while refreshing playback authorization.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('[CallAudioPlayer] Playback failed:', err);
        if (!hasAutoRefreshedRef.current && callId) {
          hasAutoRefreshedRef.current = true;
          handleRefreshPlayback();
        } else {
          setStatus('EXPIRED');
          setErrorMessage('Playback token may have expired. Please refresh authorization.');
        }
      });
    }
  };

  // Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Reset to beginning
  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().catch(() => {});
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            status === 'READY' ? 'bg-emerald-500/10 text-emerald-400' :
            status === 'PROCESSING' ? 'bg-amber-500/10 text-amber-400' :
            status === 'EXPIRED' ? 'bg-purple-500/10 text-purple-400' :
            status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
            'bg-slate-500/10 text-slate-400'
          }`}>
            {status === 'READY' ? <Mic className="w-4 h-4" /> :
             status === 'PROCESSING' ? <Clock className="w-4 h-4 animate-spin" /> :
             status === 'EXPIRED' ? <ShieldAlert className="w-4 h-4" /> :
             <MicOff className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Call Audio Recording
            </span>
            <span className="text-[11px] text-slate-500">
              {customerName ? `Session with ${customerName}` : 'Session recording'}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {status === 'READY' && (
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready
            </span>
          )}
          {status === 'PROCESSING' && (
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Processing
            </span>
          )}
          {status === 'NOT_AVAILABLE' && (
            <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
              No Recording
            </span>
          )}
          {status === 'EXPIRED' && (
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Auth Expired
            </span>
          )}
          {status === 'FAILED' && (
            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Failed
            </span>
          )}
          {status === 'ERROR' && (
            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              Error
            </span>
          )}
        </div>
      </div>

      {/* STATE: READY */}
      {status === 'READY' && recordingUrl && (
        <div className="flex flex-col gap-2 pt-1">
          {/* Hidden Audio Tag */}
          <audio
            ref={audioRef}
            src={recordingUrl}
            preload="metadata"
            crossOrigin="anonymous"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
                setAudioDuration(audioRef.current.duration);
              }
            }}
            onError={(e) => {
              console.error('[CallAudioPlayer] Media element error:', e.currentTarget.error);
              if (!hasAutoRefreshedRef.current && callId) {
                hasAutoRefreshedRef.current = true;
                handleRefreshPlayback();
              } else {
                setStatus('EXPIRED');
                setErrorMessage('Audio token expired or media unreachable. Click Refresh.');
              }
            }}
          />

          {/* Controls Bar */}
          <div className="flex items-center gap-3 bg-[#0a0a0a] border border-[#1e1e1e] p-2.5 rounded-lg">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause call recording' : 'Play call recording'}
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md flex-shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            {/* Restart button */}
            <button
              onClick={handleRestart}
              aria-label="Restart recording"
              title="Restart from beginning"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a1a1a] rounded transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Current Time Display */}
            <span className="text-xs font-mono text-slate-300 w-11 text-right flex-shrink-0">
              {formatTime(currentTime)}
            </span>

            {/* Scrubber Range Slider */}
            <input
              type="range"
              min={0}
              max={audioDuration > 0 ? audioDuration : 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Seek time"
              className="flex-1 h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-primary"
            />

            {/* Total Duration Display */}
            <span className="text-xs font-mono text-slate-500 w-11 flex-shrink-0">
              {formatTime(audioDuration)}
            </span>

            {/* Volume Mute Toggle */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1a1a1a] rounded transition-colors flex-shrink-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* STATE: PROCESSING */}
      {status === 'PROCESSING' && (
        <div className="bg-[#0a0a0a] border border-amber-500/20 p-3 rounded-lg flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Recording is being finalized by telephony storage. Available shortly.</span>
          </div>
          <button
            onClick={handleRefreshPlayback}
            disabled={isRefreshing}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Check Status'}
          </button>
        </div>
      )}

      {/* STATE: NOT_AVAILABLE */}
      {status === 'NOT_AVAILABLE' && (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-3 rounded-lg flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <MicOff className="w-3.5 h-3.5 text-slate-600" />
            <span>No audio recording exists for this call session.</span>
          </div>
          {callId && (
            <button
              onClick={handleRefreshPlayback}
              disabled={isRefreshing}
              className="px-2 py-0.5 hover:text-slate-300 text-[11px] underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Verify
            </button>
          )}
        </div>
      )}

      {/* STATE: EXPIRED */}
      {status === 'EXPIRED' && (
        <div className="bg-[#0a0a0a] border border-purple-500/20 p-3 rounded-lg flex items-center justify-between text-xs text-purple-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Playback authorization expired. Click refresh to generate a new token.</span>
          </div>
          <button
            onClick={handleRefreshPlayback}
            disabled={isRefreshing}
            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
          </button>
        </div>
      )}

      {/* STATE: FAILED */}
      {status === 'FAILED' && (
        <div className="bg-[#0a0a0a] border border-rose-500/20 p-3 rounded-lg flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Recording failed to capture or upload.</span>
          </div>
          <button
            onClick={handleRefreshPlayback}
            disabled={isRefreshing}
            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* STATE: ERROR */}
      {status === 'ERROR' && (
        <div className="bg-[#0a0a0a] border border-rose-500/20 p-3 rounded-lg flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage || 'Unable to play recording.'}</span>
          </div>
          <button
            onClick={handleRefreshPlayback}
            disabled={isRefreshing}
            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Retrying...' : 'Retry Playback'}
          </button>
        </div>
      )}
    </div>
  );
}
