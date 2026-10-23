"use client";

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export function OmnichannelEnquiriesChart() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnquiries = async (selectedPeriod = period) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('paramantra_access_token') || localStorage.getItem('crm_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await apiFetch(`/api/v1/super-admin/omnichannel-enquiries?period=${selectedPeriod}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.warn('[Enquiries Chart Fetch]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(period);
  }, [period]);

  const channelColors = {
    whatsapp: '#25D366',
    instagram: '#E1306C',
    email: '#3b82f6',
    voice: '#f97316',
    website: '#06b6d4',
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl shadow-sm flex flex-col h-[280px]">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-white">Total Messaging Hub Enquiries</h3>
          {data && typeof data.totalEnquiries === 'number' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              {data.totalEnquiries} Total
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEnquiries(period)}
            title="Refresh"
            aria-label="Refresh enquiries data"
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Enquiries period selection"
            className="bg-[#111] border border-[#333] text-xs text-slate-300 rounded-md px-2 py-1 outline-none focus:border-primary"
          >
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
            <option value="today">Today</option>
          </select>
        </div>
      </div>

      {/* Channel summary badges */}
      {data?.channels && (
        <div className="flex flex-wrap gap-2 mb-2 text-[10px]">
          <span className="flex items-center gap-1 text-slate-300 bg-[#161616] px-2 py-0.5 rounded border border-[#282828]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColors.whatsapp }} />
            WhatsApp: <strong className="text-white">{data.channels.whatsapp || 0}</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-[#161616] px-2 py-0.5 rounded border border-[#282828]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColors.instagram }} />
            Instagram: <strong className="text-white">{data.channels.instagram || 0}</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-[#161616] px-2 py-0.5 rounded border border-[#282828]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColors.email }} />
            Email: <strong className="text-white">{data.channels.email || 0}</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-[#161616] px-2 py-0.5 rounded border border-[#282828]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColors.website }} />
            Website: <strong className="text-white">{data.channels.website || 0}</strong>
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-[#161616] px-2 py-0.5 rounded border border-[#282828]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColors.voice }} />
            Voice: <strong className="text-white">{data.channels.voice || 0}</strong>
          </span>
        </div>
      )}

      {/* Main Chart Area */}
      <div className="flex-1 w-full min-h-0 relative">
        {isLoading && !data ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            <span className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" />
            Loading enquiries...
          </div>
        ) : !data || (data.trend && data.trend.length === 0) ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 italic">
            No enquiry activity recorded in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={data.trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
              <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} stroke="#666" dy={5} />
              <YAxis allowDecimals={false} fontSize={9} tickLine={false} axisLine={false} stroke="#666" />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Bar dataKey="whatsapp" stackId="a" fill={channelColors.whatsapp} name="WhatsApp" />
              <Bar dataKey="instagram" stackId="a" fill={channelColors.instagram} name="Instagram" />
              <Bar dataKey="email" stackId="a" fill={channelColors.email} name="Email" />
              <Bar dataKey="website" stackId="a" fill={channelColors.website} name="Website" />
              <Bar dataKey="voice" stackId="a" fill={channelColors.voice} name="Voice" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
