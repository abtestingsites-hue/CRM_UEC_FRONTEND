"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Mic, Clock, ShieldAlert, AlertCircle, RefreshCw, VolumeX } from 'lucide-react';
import { apiFetch, sanitizeRecordingUrl } from '@/lib/api';

interface HeaderAudioControlProps {
  callId?: string;
  initialRecordingUrl?: string | null;
  initialStatus?: string | null;
  duration?: number;
}

export function HeaderAudioControl({
  callId,
  initialRecordingUrl,
  initialStatus,
  duration = 0,
}: HeaderAudioControlProps) {
  const [status, setStatus] = useState<string>(initialStatus || (initialRecordingUrl ? 'READY' : 'NOT_AVAILABLE'));
  const [recordingUrl, setRecordingUrl] = useState<string | null>(sanitizeRecordingUrl(initialRecordingUrl) || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(duration || 0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const cleanUrl = sanitizeRecordingUrl(initialRecordingUrl);
    if (cleanUrl && cleanUrl !== recordingUrl) {
      setRecordingUrl(cleanUrl);
      setStatus('READY');
    } else if (initialStatus && initialStatus !== status) {
      setStatus(initialStatus);
    }
  }, [initialRecordingUrl, initialStatus]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRefreshToken = async (): Promise<string | null> => {
    if (!callId) return null;
    setIsRefreshing(true);
    try {
      const res = await apiFetch(`/telephony/calls/${callId}/playback-url`);
      const data = await res.json();
      if (data.success && data.recordingUrl) {
        const clean = sanitizeRecordingUrl(data.recordingUrl);
        setRecordingUrl(clean);
        setStatus('READY');
        if (data.duration) setAudioDuration(data.duration);
        return clean;
      } else if (data.recordingStatus) {
        setStatus(data.recordingStatus);
      }
    } catch (err) {
      console.error('[HeaderAudioControl] Refresh failed:', err);
      setStatus('ERROR');
    } finally {
      setIsRefreshing(false);
    }
    return null;
  };

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card collapse/expand toggle

    if (status !== 'READY') {
      if (status === 'EXPIRED' || status === 'ERROR') {
        const freshUrl = await handleRefreshToken();
        if (!freshUrl) return;
      } else {
        return;
      }
    }

    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      };
      audio.onerror = async () => {
        setIsPlaying(false);
        // If playback failed, attempt token refresh once
        const freshUrl = await handleRefreshToken();
        if (freshUrl && audioRef.current) {
          audioRef.current.src = freshUrl;
          audioRef.current.play().catch(() => {});
        } else {
          setStatus('EXPIRED');
        }
      };
    }

    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
    } else {
      let currentUrl = recordingUrl;
      if (!currentUrl) {
        currentUrl = await handleRefreshToken();
      }
      if (currentUrl) {
        if (audio.src !== currentUrl) {
          audio.src = currentUrl;
        }
        audio.play().catch(async () => {
          const fresh = await handleRefreshToken();
          if (fresh && audioRef.current) {
            audioRef.current.src = fresh;
            audioRef.current.play().catch(() => {});
          }
        });
      }
    }
  };

  if (status === 'READY') {
    return (
      <button
        type="button"
        onClick={togglePlay}
        disabled={isRefreshing}
        aria-label={isPlaying ? 'Pause audio playback' : 'Play call recording audio'}
        title={isPlaying ? 'Click to pause recording' : 'Click to play call recording'}
        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
          isPlaying
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20 animate-pulse'
            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:scale-105'
        }`}
      >
        {isRefreshing ? (
          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
        ) : isPlaying ? (
          <Pause className="w-3 h-3 text-emerald-400 fill-emerald-400" />
        ) : (
          <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
        )}
        <span>
          {isPlaying
            ? `${formatTime(currentTime)} / ${formatTime(audioDuration)}`
            : `Play Audio (${formatTime(audioDuration || duration)})`}
        </span>
      </button>
    );
  }

  if (status === 'PROCESSING') {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
        <Clock className="w-3 h-3 animate-spin" />
        Processing Audio
      </span>
    );
  }

  if (status === 'EXPIRED') {
    return (
      <button
        type="button"
        onClick={togglePlay}
        className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
      >
        <ShieldAlert className="w-3 h-3 text-purple-400" />
        {isRefreshing ? 'Refreshing...' : 'Renew Token'}
      </button>
    );
  }

  if (status === 'FAILED') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
        <AlertCircle className="w-3 h-3" />
        Audio Failed
      </span>
    );
  }

  // Fallback: NOT_AVAILABLE
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] text-slate-500 border border-[#222] rounded text-[10px] font-bold uppercase tracking-wider">
      <Mic className="w-3 h-3 text-slate-600" />
      No Recording
    </span>
  );
}
