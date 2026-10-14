import React from 'react';
import { MapPin } from 'lucide-react';

export function GeoWidget() {
  // Styles coordinates for cities
  const locations = [
    { city: 'New York', count: 184, x: '25%', y: '30%', color: 'bg-orange-500' },
    { city: 'San Francisco', count: 95, x: '75%', y: '45%', color: 'bg-blue-500' },
    { city: 'London Hub', count: 142, x: '45%', y: '25%', color: 'bg-emerald-500' },
    { city: 'Tokyo Branch', count: 68, x: '85%', y: '20%', color: 'bg-purple-500' },
  ];

  return (
    <div className="w-full h-full bg-[#0d0d0d] rounded-xl border border-[#1e1e1e]/60 p-4 flex flex-col justify-between">
      {/* Map Graphic Canvas */}
      <div className="flex-1 bg-[#121212] rounded-lg border border-[#1c1c1c] relative overflow-hidden min-h-[160px]">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:20px_20px] opacity-40"></div>
        
        {/* Render geographic plot points */}
        {locations.map((loc, idx) => (
          <div 
            key={idx} 
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: loc.x, top: loc.y }}
          >
            <span className="flex h-5 w-5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${loc.color}`}></span>
              <span className={`relative inline-flex rounded-full h-5 w-5 items-center justify-center text-white border border-[#222] shadow ${loc.color}`}>
                <MapPin className="w-3 h-3 text-white" />
              </span>
            </span>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#090909] border border-[#222] text-white px-2.5 py-1 rounded-md text-[10px] whitespace-nowrap z-30 font-bold">
              {loc.city}: {loc.count} Active Records
            </div>
          </div>
        ))}
      </div>

      {/* Legend Stats footer */}
      <div className="grid grid-cols-4 gap-2 mt-4 text-center shrink-0">
        {locations.map((loc, idx) => (
          <div key={idx} className="p-2 bg-[#121212] border border-[#1c1c1c] rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider truncate">{loc.city}</span>
            <span className="text-xs font-black text-white block mt-0.5">{loc.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
