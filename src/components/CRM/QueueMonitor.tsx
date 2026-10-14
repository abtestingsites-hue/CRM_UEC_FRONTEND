import React from 'react';
import { useQueueStore } from '../../store/queueStore';

export const QueueMonitor: React.FC = () => {
  const { callsInQueue } = useQueueStore();
  return (
    <div className="p-4 bg-gray-900 text-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Live Queues</h2>
      <div className="flex justify-between border-b border-gray-700 py-2">
        <span>Global Queue</span>
        <span className="font-bold text-red-400">{callsInQueue} waiting</span>
      </div>
    </div>
  );
};
