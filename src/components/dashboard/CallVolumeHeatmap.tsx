import React from 'react';

export function CallVolumeHeatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['12 AM', '03 AM', '06 AM', '09 AM', '12 PM', '03 PM', '06 PM', '09 PM'];
  
  // Generate mock heatmap data (0-4 intensity) deterministically to avoid hydration errors
  const generateIntensity = (dayIdx: number, timeIdx: number) => {
    // Peak times are weekdays 9AM - 3PM
    const isWeekday = dayIdx < 5;
    const isPeakTime = timeIdx >= 3 && timeIdx <= 5;
    
    // Deterministic pseudo-random based on indices
    const rand = Math.sin(dayIdx * 10 + timeIdx) * 10000;
    const pseudoRandom = rand - Math.floor(rand);
    
    if (isWeekday && isPeakTime) return Math.floor(pseudoRandom * 2) + 3; // 3-4 (high)
    if (isWeekday && timeIdx >= 2 && timeIdx <= 6) return Math.floor(pseudoRandom * 2) + 2; // 2-3 (medium)
    return 0; // 0-1 (very low)
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
        <select className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
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
