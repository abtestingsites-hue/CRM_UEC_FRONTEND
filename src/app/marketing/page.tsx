"use client";

import React, { useState } from 'react';
import { 
  Search, Download, Filter, Plus, ChevronDown, ChevronRight, CheckCircle2,
  Megaphone, Target, Users, BarChart2, Mail, MessageSquare, Globe, MessageCircle,
  PlayCircle, RefreshCw, Trash2, Edit2, Play, Pause, TrendingUp, DollarSign
} from 'lucide-react';

// ==========================================
// 1. NAVIGATION METADATA
// ==========================================
const MARKETING_NAV = [
  {
    group: 'Growth Engine', id: 'growth', icon: Megaphone,
    items: [
      { id: 'campaigns', label: 'Campaigns', desc: 'Enterprise multi-channel campaign management' },
      { id: 'advertising', label: 'Advertising', desc: 'Centralized ad platform performance' },
    ]
  },
  {
    group: 'Lead Acquisition', id: 'acquisition', icon: Target,
    items: [
      { id: 'lead-capture', label: 'Lead Capture', desc: 'Ingestion engine for forms and landing pages' },
      { id: 'audience', label: 'Audience Management', desc: 'Dynamic segments and marketing lists' },
    ]
  },
  {
    group: 'Insights & Comms', id: 'insights', icon: BarChart2,
    items: [
      { id: 'analytics', label: 'Analytics', desc: 'Funnel, traffic, and attribution tracking' },
      { id: 'communication', label: 'Communication Center', desc: 'Broadcast messaging control panel' },
    ]
  }
];

// ==========================================
// 2. GENERIC ENTERPRISE WORKSPACE LAYOUTS
// ==========================================
const EnterpriseTableWorkspace = ({ columns, data, primaryAction, searchPlaceholder, emptyMessage }: any) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-4 bg-[#101010] p-4 border border-[#1e1e1e] rounded-xl shadow-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={searchPlaceholder || "Search records..."}
            className="bg-[#141414] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-rose-500 w-72 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#141414] border border-[#262626] text-white hover:bg-[#202020] rounded-lg text-xs font-semibold transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#141414] border border-[#262626] text-white hover:bg-[#202020] rounded-lg text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          {primaryAction && (
            <button className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.15)]">
              <Plus className="w-3.5 h-3.5" /> {primaryAction}
            </button>
          )}
        </div>
      </div>

      <div className="border border-[#1e1e1e] rounded-xl overflow-hidden bg-[#0c0c0c] shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#121212] border-b border-[#1e1e1e]">
            <tr>
              {columns.map((col: string, idx: number) => (
                <th key={idx} className={`px-5 py-3 font-bold text-slate-400 uppercase tracking-wider ${idx === columns.length - 1 ? 'text-right' : ''}`}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e1e]">
            {data.length > 0 ? data.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-[#141414] transition-colors">
                {row.map((cell: any, cellIdx: number) => (
                  <td key={cellIdx} className={`px-5 py-4 ${cellIdx === row.length - 1 ? 'text-right' : 'text-slate-300 font-medium'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-500 font-medium border-dashed">
                  {emptyMessage || "No data records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function MarketingHubPage() {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'growth': true, 'acquisition': true, 'insights': true });
  const [activeSetting, setActiveSetting] = useState<string>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getActiveSettingInfo = () => {
    for (const group of MARKETING_NAV) {
      for (const item of group.items) {
        if (item.id === activeSetting) return { group: group.group, label: item.label, desc: item.desc };
      }
    }
    return { group: 'Marketing Hub', label: 'Dashboard', desc: 'Overview' };
  };

  const activeInfo = getActiveSettingInfo();

  const renderWorkspace = () => {
    switch (activeSetting) {
      case 'campaigns':
        return (
          <EnterpriseTableWorkspace 
            columns={['Campaign Name', 'Channels', 'Audience Segment', 'Cost', 'ROI', 'Status', 'Actions']}
            data={[
              [<span className="font-bold text-white">Q4 Winter Promotion</span>, <div className="flex gap-2"><Mail className="w-4 h-4 text-blue-500"/><MessageCircle className="w-4 h-4 text-emerald-500"/></div>, 'High-Value Leads', '$4,200', <span className="text-emerald-400 font-bold">+240%</span>, <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase">Active</span>, <button className="text-rose-500 hover:underline">Manage</button>],
              [<span className="font-bold text-white">Black Friday Reactivation</span>, <div className="flex gap-2"><Globe className="w-4 h-4 text-blue-600"/></div>, 'Dormant Customers', '$1,850', <span className="text-emerald-400 font-bold">+180%</span>, <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-[9px] font-bold uppercase">Draft</span>, <button className="text-rose-500 hover:underline">Manage</button>],
            ]}
            primaryAction="Create Campaign"
            searchPlaceholder="Search campaigns by name..."
          />
        );

      case 'advertising':
        return (
          <div className="space-y-6 animate-in fade-in">
            {/* Ad Account Summaries */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { platform: 'Google Ads', spend: '$12,450', conversions: 432, costPerConv: '$28.81', color: 'blue', icon: Globe },
                { platform: 'Meta Ads', spend: '$8,200', conversions: 512, costPerConv: '$16.01', color: 'indigo', icon: Globe },
                { platform: 'LinkedIn Ads', spend: '$4,100', conversions: 89, costPerConv: '$46.06', color: 'sky', icon: Globe },
              ].map((ad, i) => (
                <div key={i} className="bg-[#101010] border border-[#1e1e1e] p-5 rounded-xl shadow-lg relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-${ad.color}-500 opacity-80`} />
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2"><ad.icon className={`w-4 h-4 text-${ad.color}-400`} /> {ad.platform}</h3>
                    <span className="text-xs text-slate-500 font-medium">Last 30 Days</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ad Spend</p>
                      <p className="text-xl font-black text-white">{ad.spend}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Conversions</p>
                      <p className="text-xl font-black text-white">{ad.conversions}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#1e1e1e] flex justify-between items-center">
                    <span className="text-xs text-slate-400">Cost/Conv: <span className="text-white font-bold">{ad.costPerConv}</span></span>
                    <button className={`text-[10px] font-bold uppercase tracking-wider text-${ad.color}-400 hover:underline`}>Sync Now</button>
                  </div>
                </div>
              ))}
            </div>

            <EnterpriseTableWorkspace 
              columns={['Ad Campaign', 'Platform', 'Status', 'Impressions', 'Clicks', 'Spend', 'Conversions']}
              data={[
                [<span className="font-bold text-white">Search - Generic Keywords</span>, 'Google Ads', <span className="text-emerald-400 font-bold">Running</span>, '124,592', '4,102', '$3,240', '142'],
                [<span className="font-bold text-white">Retargeting - Site Visitors</span>, 'Meta Ads', <span className="text-emerald-400 font-bold">Running</span>, '89,231', '2,491', '$1,850', '210'],
              ]}
              primaryAction="Connect Ad Account"
              searchPlaceholder="Search active ad campaigns..."
            />
          </div>
        );

      case 'lead-capture':
        return (
          <EnterpriseTableWorkspace 
            columns={['Source Name', 'Type', 'Destination Queue', 'Validation Rules', 'Leads (30d)', 'Status', 'Actions']}
            data={[
              [<span className="font-bold text-white">Main Website Form</span>, 'Web Form', 'General Pool', <span className="text-emerald-400 font-bold">Strict</span>, '842', <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase">Active</span>, <button className="text-rose-500 hover:underline">Edit Form</button>],
              [<span className="font-bold text-white">FB Lead Gen - Q4</span>, 'Facebook Native', 'Sales Team A', <span className="text-amber-400 font-bold">Standard</span>, '1,204', <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase">Active</span>, <button className="text-rose-500 hover:underline">Edit Form</button>],
              [<span className="font-bold text-white">Partner Referral Portal</span>, 'API Endpoint', 'Partner Queue', <span className="text-emerald-400 font-bold">Strict</span>, '145', <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-[9px] font-bold uppercase">Paused</span>, <button className="text-rose-500 hover:underline">Edit Form</button>],
            ]}
            primaryAction="Create Lead Form"
            searchPlaceholder="Search lead capture sources..."
          />
        );

      case 'audience':
        return (
          <EnterpriseTableWorkspace 
            columns={['Audience Segment', 'Type', 'Match Conditions', 'Total Size', 'Growth (30d)', 'Last Refresh', 'Actions']}
            data={[
              [<span className="font-bold text-white">High Intent Web Visitors</span>, 'Dynamic', 'Visited pricing page > 2 times', '14,231', <span className="text-emerald-400 font-bold">+4.2%</span>, '2 mins ago', <button className="text-rose-500 hover:underline">Analyze</button>],
              [<span className="font-bold text-white">Churn Risk Customers</span>, 'Predictive (AI)', 'Engagement drop > 50%', '3,842', <span className="text-rose-400 font-bold">+1.8%</span>, '1 hour ago', <button className="text-rose-500 hover:underline">Analyze</button>],
              [<span className="font-bold text-white">Q3 Webinar Attendees</span>, 'Static List', 'Manual Import', '850', <span className="text-slate-500 font-bold">0.0%</span>, 'Oct 1, 2025', <button className="text-rose-500 hover:underline">Analyze</button>],
            ]}
            primaryAction="Build Segment"
            searchPlaceholder="Search audiences and segments..."
          />
        );

      case 'analytics':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Total Acquired Leads', value: '4,291', trend: '+12.5%', isUp: true, icon: Users },
                { label: 'Avg Cost per Lead', value: '$18.42', trend: '-2.4%', isUp: true, icon: DollarSign },
                { label: 'MQL to SQL Rate', value: '32.4%', trend: '+4.1%', isUp: true, icon: Target },
                { label: 'Pipeline Generated', value: '$842K', trend: '+18.2%', isUp: true, icon: TrendingUp },
              ].map((metric, i) => (
                <div key={i} className="bg-[#101010] border border-[#1e1e1e] p-5 rounded-xl shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-[#141414] rounded-lg"><metric.icon className="w-5 h-5 text-rose-500" /></div>
                    <span className={`text-xs font-bold ${metric.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{metric.trend}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{metric.label}</p>
                  <p className="text-2xl font-black text-white">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-[#101010] border border-[#1e1e1e] rounded-xl p-6 shadow-lg h-80 flex flex-col items-center justify-center">
                <BarChart2 className="w-12 h-12 text-[#222] mb-4" />
                <h3 className="text-white font-bold">Conversion Funnel Analytics</h3>
                <p className="text-xs text-slate-500 text-center mt-2 max-w-sm">Connect Google Analytics 4 to unlock multi-touch attribution and full funnel visualization here.</p>
                <button className="mt-4 px-4 py-2 bg-[#141414] border border-[#333] hover:border-rose-500 text-white rounded-lg text-xs font-bold transition-all">Connect GA4 Integration</button>
              </div>
              <div className="bg-[#101010] border border-[#1e1e1e] rounded-xl p-6 shadow-lg h-80 flex flex-col">
                <h3 className="text-white font-bold mb-4">Top Traffic Sources</h3>
                <div className="space-y-4 flex-1">
                  {[
                    { source: 'Organic Search', pct: 45, color: 'bg-emerald-500' },
                    { source: 'Direct', pct: 25, color: 'bg-blue-500' },
                    { source: 'Paid Social (Meta)', pct: 15, color: 'bg-indigo-500' },
                    { source: 'Paid Search (Google)', pct: 10, color: 'bg-rose-500' },
                    { source: 'Referral', pct: 5, color: 'bg-amber-500' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className="text-slate-300">{s.source}</span>
                        <span className="text-white">{s.pct}%</span>
                      </div>
                      <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'communication':
        return (
          <EnterpriseTableWorkspace 
            columns={['Broadcast Name', 'Channel', 'Target Audience', 'Sent Time', 'Delivery Rate', 'Open Rate', 'Actions']}
            data={[
              [<span className="font-bold text-white">Q4 Promo Announcement</span>, <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-500"/> Email</span>, 'All Customers', 'Oct 12, 09:00 AM', <span className="text-emerald-400 font-bold">99.2%</span>, <span className="text-white font-bold">42.1%</span>, <button className="text-rose-500 hover:underline">View Report</button>],
              [<span className="font-bold text-white">Urgent System Update</span>, <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-emerald-500"/> WhatsApp</span>, 'Active Users (30d)', 'Oct 10, 14:30 PM', <span className="text-emerald-400 font-bold">98.5%</span>, <span className="text-white font-bold">89.4%</span>, <button className="text-rose-500 hover:underline">View Report</button>],
            ]}
            primaryAction="New Broadcast"
            searchPlaceholder="Search communication history..."
          />
        );

      default:
        return (
          <div className="h-64 border-2 border-dashed border-[#1e1e1e] rounded-xl flex flex-col items-center justify-center text-slate-500 animate-in fade-in">
            <Megaphone className="w-8 h-8 text-[#333] mb-3" />
            <h3 className="text-white font-bold mb-1">{activeInfo.label} Workspace</h3>
            <p className="text-xs">This enterprise marketing workspace is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050505] text-white overflow-hidden p-4">
      {/* Centralized Workspace Container */}
      <div className="flex-1 flex border border-[#1e1e1e] rounded-2xl bg-[#090909] overflow-hidden shadow-2xl">
        
        {/* LEFT NAV PANEL */}
        <div className="w-[280px] bg-[#0c0c0c] border-r border-[#1e1e1e] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#1e1e1e]">
            <h1 className="text-base font-black text-white flex items-center gap-2 tracking-wide">
              <Megaphone className="text-rose-500 w-5 h-5" /> MARKETING HUB
            </h1>
            <div className="relative mt-4">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search marketing features..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#222] rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {MARKETING_NAV.map((group) => {
              const isExpanded = expandedGroups[group.id];
              const matchesSearch = searchQuery === '' || 
                                    group.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    group.items.some(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
              
              if (!matchesSearch) return null;

              return (
                <div key={group.id} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-[#141414] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <group.icon className="w-4 h-4 text-slate-500 group-hover:text-rose-500 transition-colors" />
                      {group.group}
                    </div>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-[#222] space-y-0.5">
                      {group.items.map((item) => {
                        if (searchQuery !== '' && !item.label.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveSetting(item.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                              activeSetting === item.id 
                                ? 'bg-rose-600/10 text-rose-500 font-bold' 
                                : 'text-slate-400 hover:text-white hover:bg-[#141414]'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090909]">
          
          <div className="h-20 border-b border-[#1e1e1e] p-6 shrink-0 flex items-center justify-between bg-[#0a0a0a]">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <span>Marketing Hub</span>
                <ChevronRight className="w-3 h-3" />
                <span>{activeInfo.group}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{activeInfo.label}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500">{activeInfo.desc}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {renderWorkspace()}
          </div>
        </div>

      </div>
    </div>
  );
}
