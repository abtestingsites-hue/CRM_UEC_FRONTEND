"use client";

import React, { useEffect, useState } from 'react';
import { useCallStore } from '@/store/useCallStore';

interface CallTimerProps {
  isActive: boolean;
}

export const CallTimer: React.FC<CallTimerProps> = ({ isActive }) => {
  const { connectedAt } = useCallStore();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && connectedAt) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - connectedAt) / 1000));
      }, 1000);
    } else if (isActive) {
      interval = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, connectedAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="text-3xl font-mono font-light text-slate-700 dark:text-slate-300 tracking-wider">
      {formatTime(duration)}
    </div>
  );
};
