import React from 'react';

export function SlaGauge({ percentage = 94 }: { percentage?: number }) {
  const rotation = (percentage / 100) * 180 - 90; // Calculate rotation for semi-circle

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm h-[220px] flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white">SLA Performance</h3>
        <select className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
          <option>Today</option>
          <option>This Week</option>
        </select>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end pb-8 relative">
        {/* Semi-circle Gauge Background */}
        <div className="relative w-48 h-24 overflow-hidden">
           <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[24px] border-[#222] box-border"></div>
           
           {/* Semi-circle Gauge Foreground (Orange) */}
           <div 
             className="absolute top-0 left-0 w-48 h-48 rounded-full border-[24px] border-primary box-border transition-transform duration-1000 ease-out"
             style={{
               borderBottomColor: 'transparent',
               borderLeftColor: 'transparent',
               transform: `rotate(${rotation}deg)`
             }}
           ></div>
        </div>
        
        {/* Needle/Dot on the edge (optional, but matching simple gauge style) */}
        
        <div className="absolute bottom-8 flex flex-col items-center">
          <span className="text-4xl font-bold text-white leading-none">{percentage}%</span>
          <span className="text-xs text-slate-400 mt-1">SLA Met</span>
        </div>

        {/* Min/Max Labels */}
        <div className="absolute bottom-4 w-56 flex justify-between px-2 text-[10px] text-slate-500 font-medium">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
