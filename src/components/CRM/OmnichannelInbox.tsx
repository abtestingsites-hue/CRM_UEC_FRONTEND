import React from 'react';

export const OmnichannelInbox: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex border-b border-gray-700 bg-gray-800">
        <button className="flex-1 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-400">All</button>
        <button className="flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">WhatsApp</button>
        <button className="flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-white">Email</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Placeholder for unified chat threads */}
        <div className="p-4 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-white">John Doe</h4>
            <span className="text-xs text-gray-500">10:42 AM</span>
          </div>
          <p className="text-sm text-gray-400 truncate">Can you help me with my mobility plan?</p>
          <div className="mt-2 flex space-x-2">
            <span className="text-[10px] uppercase font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded">WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
};
