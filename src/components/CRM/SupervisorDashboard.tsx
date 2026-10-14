import React from 'react';
import { useQueueStore } from '../../store/queueStore';

export const SupervisorDashboard: React.FC = () => {
  const { queues, alerts } = useQueueStore();

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Supervisor Command Center</h1>
        <p className="text-gray-400">Live queue monitoring and SLA tracking</p>
      </header>

      {/* SLA Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-8 bg-red-900/50 border border-red-500 rounded-lg p-4">
          <h2 className="text-red-400 font-bold mb-2">SLA Breaches Detected!</h2>
          <ul>
            {alerts.map((alert: any, idx: any) => (
              <li key={idx} className="text-red-200">
                🚨 {alert.message} (Queue: {alert.queueId})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Queue Heatmaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {queues.map((q: any) => (
          <div key={q.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{q.name}</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Waiting Calls</span>
                <span className={`text-2xl font-bold ${q.waitingCount > 5 ? 'text-red-500' : 'text-green-500'}`}>
                  {q.waitingCount}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Longest Wait Time</span>
                <span className="text-xl font-medium">{q.longestWait}s</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Available Agents</span>
                <span className="text-xl font-medium text-blue-400">{q.availableAgents}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium transition-colors">
                Manage Queue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
