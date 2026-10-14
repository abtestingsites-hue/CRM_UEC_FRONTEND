import React from 'react';
import { useCallStore } from '../../store/useCallStore';

export const FloatingCallWidget: React.FC = () => {
  const { status, activeCall, isMuted, isHold, toggleMute, toggleHold } = useCallStore();

  if (status === 'OFFLINE' || status === 'AVAILABLE' && !activeCall) {
    return null;
  }

  return (
    <div className="absolute bottom-6 right-6 w-80 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl p-4 backdrop-blur-md bg-opacity-90">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-white">Active Call</h3>
        <span className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${status === 'ON_CALL' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
          <span className="text-xs text-gray-400 font-medium">{status}</span>
        </span>
      </div>

      {activeCall && (
        <div className="mb-4">
          <p className="text-sm text-gray-300">Caller ID: {activeCall.phone}</p>
          <p className="text-xs text-gray-500">Queue: {activeCall.queueType || 'Direct'}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={toggleMute}
          className={`py-2 rounded-lg text-sm font-medium transition-colors ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button 
          onClick={toggleHold}
          className={`py-2 rounded-lg text-sm font-medium transition-colors ${isHold ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          {isHold ? 'Resume' : 'Hold'}
        </button>
        <button 
          className="py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
          onClick={() => console.log('End Call')}
        >
          End
        </button>
      </div>
    </div>
  );
};
