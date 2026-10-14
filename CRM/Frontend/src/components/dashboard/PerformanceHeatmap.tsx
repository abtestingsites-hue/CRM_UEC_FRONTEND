import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function PerformanceHeatmap() {
  const data = [
    { hour: '12 AM', calls: 12, waitTime: 1 },
    { hour: '03 AM', calls: 8, waitTime: 0.5 },
    { hour: '06 AM', calls: 45, waitTime: 2 },
    { hour: '09 AM', calls: 120, waitTime: 4 },
    { hour: '12 PM', calls: 155, waitTime: 6 },
    { hour: '03 PM', calls: 130, waitTime: 4 },
    { hour: '06 PM', calls: 90, waitTime: 2.5 },
    { hour: '09 PM', calls: 40, waitTime: 1.5 },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm h-[220px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white">Peak Call Hours & Wait Time</h3>
        <select className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
          <option>Today</option>
          <option>This Week</option>
        </select>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mb-4 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#f97316] rounded-sm"></div>
          <span className="text-[10px] text-slate-400">Calls</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#eab308] rounded-full"></div>
          <span className="text-[10px] text-slate-400">Avg Wait (min)</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ComposedChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
            <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} stroke="#666" dy={10} />
            <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} stroke="#666" />
            <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} stroke="#666" />
            <Tooltip 
              cursor={{ fill: '#111' }}
              contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar yAxisId="left" dataKey="calls" fill="#f97316" radius={[2, 2, 0, 0]} maxBarSize={20} />
            <Line yAxisId="right" type="monotone" dataKey="waitTime" stroke="#eab308" strokeWidth={2} dot={{ r: 3, fill: '#eab308', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
