import React from 'react';

export function CallVolumeHeatmap({ data }: { data?: any }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['12 AM', '03 AM', '06 AM', '09 AM', '12 PM', '03 PM', '06 PM', '09 PM'];
  
  const totalCalls = data?.metrics?.totalCalls ?? data?.liveStats?.totalCalls ?? 0;
  const callsPerHour: any[] = data?.charts?.callsPerHour || [];

  const generateIntensity = (dayIdx: number, timeIdx: number) => {
    if (totalCalls === 0) return 0;
    if (callsPerHour.length > 0) {
      const callData = callsPerHour[timeIdx % callsPerHour.length];
      const count = callData?.calls || 0;
      if (count > 20) return 4;
      if (count > 10) return 3;
      if (count > 5) return 2;
      if (count > 0) return 1;
    }
    return 0;
  };

  const getColorClass = (intensity: number) => {
    switch(intensity) {
      case 4: return 'bg-[#ea580c] shadow-[0_0_8px_rgba(234,88,12,0.6)]'; // bright orange
      case 3: return 'bg-[#f97316]'; // orange
      case 2: return 'bg-[#fdba74]'; // light orange
      case 1: return 'bg-[#ffedd5] opacity-60'; // very light
      default: return 'bg-[#222]'; // dark gray/empty
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm h-[220px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white">Call Volume Heatmap</h3>
        <select aria-label="Call volume period filter" className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Y Axis (Days) */}
        <div className="flex flex-col justify-between pr-2 text-[10px] text-slate-500 py-1">
          {days.map(day => <span key={day} className="leading-none">{day}</span>)}
        </div>
        
        <div className="flex-1 flex flex-col">
          {/* Heatmap Grid */}
          <div className="flex-1 grid grid-rows-7 gap-[2px]">
            {days.map((_, dayIdx) => (
              <div key={dayIdx} className="grid grid-cols-24 gap-[2px]">
                 {/* Map to 24 hours internally, display 8 ticks */}
                 {Array.from({length: 24}).map((_, hourIdx) => (
                   <div 
                     key={hourIdx} 
                     className={`w-full h-full rounded-[1px] ${getColorClass(generateIntensity(dayIdx, Math.floor(hourIdx/3)))}`}
                   ></div>
                 ))}
              </div>
            ))}
          </div>
          
          {/* X Axis (Times) */}
          <div className="flex justify-between text-[10px] text-slate-500 pt-2 mt-1">
            {times.map(time => <span key={time}>{time}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
