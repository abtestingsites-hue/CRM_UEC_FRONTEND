"use client";

import React, { useEffect, useState } from 'react';
import { Users, Target, Activity, CheckCircle2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '@/lib/api';

export default function LeadAnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiFetch(`/api/v1/leads/analytics/dashboard`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAnalytics();
  }, []);

  if (!data) return <div className="h-screen bg-[#050505] flex items-center justify-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Enterprise lead performance and conversion statistics.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold">{data.totalLeads}</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Total Leads</p>
          </div>

          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold">{data.claimedLeads}</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Claimed Leads</p>
          </div>

          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold">{data.convertedLeads}</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Converted Leads</p>
          </div>

          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold">{data.positiveLeads}</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Positive AI Sentiment</p>
          </div>

          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <TrendingUp className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <h3 className="text-3xl font-bold">{data.conversionRate}%</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">Conversion Rate</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-6">Service Interest Breakdown</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={data.services}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="service" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
