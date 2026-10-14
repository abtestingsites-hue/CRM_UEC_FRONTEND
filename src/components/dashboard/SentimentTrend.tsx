import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function SentimentTrend({ data }: { data?: any }) {
  const sentiment = data?.customerFeedback || { positive: 65, neutral: 25, negative: 10 };
  const score = (sentiment.positive * 10 + sentiment.neutral * 5) / 100;
  // Fallback to static for chart if we only have aggregate data
  const chartData = [
    { day: 'Mon', score: 6 },
    { day: 'Tue', score: 7 },
    { day: 'Wed', score: 6.5 },
    { day: 'Thu', score: 8 },
    { day: 'Fri', score: score > 0 ? score : 7.5 },
    { day: 'Sat', score: score > 0 ? score : 8.5 },
    { day: 'Sun', score: score > 0 ? score : 9 },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm h-[220px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white">Sentiment Trend</h3>
        <select className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
            <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} stroke="#666" dy={10} />
            <YAxis domain={[0, 10]} ticks={[0, 2.5, 5, 7.5, 10]} fontSize={10} tickLine={false} axisLine={false} stroke="#666" />
            <Tooltip 
              cursor={{ stroke: '#333', strokeWidth: 1 }}
              contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
              itemStyle={{ color: '#f97316' }}
            />
            <Line 
              type="linear" 
              dataKey="score" 
              stroke="#f97316" 
              strokeWidth={2} 
              dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
