import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function OmnichannelTrends() {
  const data = [
    { name: 'WhatsApp', value: 345, color: '#25D366' },
    { name: 'Instagram', value: 210, color: '#E1306C' },
    { name: 'Voice Calls', value: 180, color: '#f97316' },
    { name: 'Emails', value: 85, color: '#3b82f6' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm h-[220px] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-white">Omnichannel Engagement</h3>
        <select className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
          <option>Today</option>
          <option>This Week</option>
        </select>
      </div>
      
      <div className="flex-1 flex items-center justify-between">
        <div className="relative w-[100px] h-[100px] shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-[10px] text-slate-400">Total</span>
             <span className="text-lg font-bold text-white">{total.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 ml-4 space-y-2">
          {data.map((item) => {
            const percent = total === 0 ? 0 : Math.round((item.value / total) * 100);
            return (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{percent}%</span>
                  <span className="text-slate-500 w-8 text-right">({item.value})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
