import React, { useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { FloatingCallWidget } from './FloatingCallWidget';

export const AgentWorkspace: React.FC = () => {
  const { status, setStatus, activeCalls } = useAgentStore();

  useEffect(() => {
    // Initialization logic for WebSocket connection
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 p-4">
        <h2 className="text-xl font-bold mb-6">CRM Workspace</h2>
        
        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-2">My Status</label>
          <select 
            className="w-full bg-gray-800 p-2 rounded border border-gray-700"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="AVAILABLE">🟢 Available</option>
            <option value="BUSY">🔴 Busy</option>
            <option value="BREAK">🟡 Break</option>
            <option value="WRAP_UP">🟠 Wrap Up</option>
            <option value="OFFLINE">⚫ Offline</option>
          </select>
        </div>

        <div className="mt-auto">
          <p className="text-sm text-gray-400">Active Calls: {activeCalls}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 relative">
        <header className="mb-6 border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-semibold">Omnichannel Inbox</h1>
        </header>

        {/* 
          Split pane for Customer 360 and Chat can go here 
        */}
        <div className="grid grid-cols-2 gap-6 h-full">
          <div className="bg-gray-800 rounded-lg p-4">Chat Thread</div>
          <div className="bg-gray-800 rounded-lg p-4">Customer 360 Profile</div>
        </div>

        {/* Persistent Floating Widget */}
        <FloatingCallWidget />
      </main>
    </div>
  );
};
