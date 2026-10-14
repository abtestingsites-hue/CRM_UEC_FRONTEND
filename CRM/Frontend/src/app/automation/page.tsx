"use client";

import React, { useState } from 'react';
import { 
  Settings, Play, Pause, Zap, Workflow, Plus, Search, 
  Filter, Download, MessageSquare, Camera, Globe, 
  Mail, MessageCircle, Phone, ArrowLeft, Check, CheckCircle2,
  ChevronDown, ChevronRight, FileText, Image, Bot, Eye, Edit2,
  Clock, PlayCircle, RefreshCw, Trash2
} from 'lucide-react';

// ==========================================
// 1. NAVIGATION METADATA
// ==========================================
const OMNICHANNEL_NAV = [
  {
    group: 'Automation Rules', id: 'omni-auto', icon: Zap,
    items: [
      { id: 'auto-replies', label: 'Auto Replies', desc: 'Configure global trigger-based replies across all channels' },
      { id: 'chatbot', label: 'Chatbot Brain', desc: 'Enterprise AI conversational flows and human escalation' },
    ]
  },
  {
    group: 'Asset Library', id: 'omni-assets', icon: FileText,
    items: [
      { id: 'templates', label: 'Message Templates', desc: 'Design and manage approved templates for cross-channel use' },
      { id: 'media', label: 'Media Library', desc: 'Central repository for attachments, PDFs, and multimedia' },
    ]
  }
];

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'instagram', label: 'Instagram', icon: Camera, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-600/10' },
  { id: 'livechat', label: 'Live Chat', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { id: 'voice', label: 'Voice IVR', icon: Phone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
            className="bg-[#141414] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-orange-500 w-72 transition-colors"
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
            <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.15)]">
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

const EnterpriseFormWorkspace = ({ children, saveText, testText }: any) => {
  return (
    <div className="max-w-4xl bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl animate-in fade-in">
      <div className="p-6 space-y-6">
        {children}
      </div>
      <div className="p-5 bg-[#101010] border-t border-[#1e1e1e] flex items-center justify-between">
        <button type="button" className="text-xs text-slate-400 hover:text-white transition-colors">Discard Changes</button>
        <div className="flex items-center gap-3">
          {testText && (
            <button type="button" className="px-4 py-2.5 bg-[#1a1a1a] border border-[#333] hover:border-orange-500 text-white rounded-lg text-xs font-bold transition-all">
              {testText}
            </button>
          )}
          <button type="button" className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.15)]">
            {saveText || "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function AutomationPage() {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'omni-auto': true, 'omni-assets': true });
  const [activeSetting, setActiveSetting] = useState<string>('auto-replies');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for Auto Replies workflow creation
  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedChannels, setSelectedChannels] = useState<Record<string, boolean>>({
    whatsapp: true, email: true, instagram: true, livechat: true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActiveSettingInfo = () => {
    for (const group of OMNICHANNEL_NAV) {
      for (const item of group.items) {
        if (item.id === activeSetting) return { group: group.group, label: item.label, desc: item.desc };
      }
    }
    return { group: 'Omnichannel Admin', label: 'Dashboard', desc: 'Overview' };
  };

  const activeInfo = getActiveSettingInfo();

  const renderAutoReplies = () => {
    if (view === 'create') {
      return (
        <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('list')} className="p-2 hover:bg-[#141414] rounded-lg text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Create Auto Reply Rule</h2>
              <p className="text-xs text-slate-400">Define the conditions, message payload, and select which communication channels this rule applies to.</p>
            </div>
          </div>

          <div className="bg-[#101010] border border-[#1e1e1e] rounded-xl p-6 mb-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">1. Rule Configuration</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rule Name</label>
                <input type="text" defaultValue="Global Welcome Message" className="w-full bg-[#141414] border border-[#222] focus:border-orange-500 rounded-lg px-4 py-2 text-sm text-white outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trigger Event</label>
                <select className="w-full bg-[#141414] border border-[#222] focus:border-orange-500 rounded-lg px-4 py-2 text-sm text-white outline-none">
                  <option>New Conversation Started</option>
                  <option>Outside Business Hours</option>
                  <option>Customer Idle &gt; 15 mins</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rule Priority</label>
                <select className="w-full bg-[#141414] border border-[#222] focus:border-orange-500 rounded-lg px-4 py-2 text-sm text-white outline-none">
                  <option>P1 - Critical (Overrides all)</option>
                  <option>P2 - High</option>
                  <option>P3 - Normal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#101010] border border-[#1e1e1e] rounded-xl p-6 mb-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              2. Message Payload
              <button className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded font-bold border border-emerald-500/20">Enable AI Optimization</button>
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reply Content</label>
              <textarea rows={4} defaultValue="Welcome to ElderCare! How can we assist you today? Please reply with your inquiry or type 'Menu' to see our services." className="w-full bg-[#141414] border border-[#222] focus:border-orange-500 rounded-lg px-4 py-3 text-sm text-white outline-none custom-scrollbar" />
            </div>
          </div>

          <div className="bg-[#101010] border border-[#1e1e1e] rounded-xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">3. Channel Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Select the platforms where this auto-reply should be active. The message payload will be automatically formatted for the destination channel.</p>
            <div className="grid grid-cols-2 gap-4">
              {CHANNELS.map(channel => {
                const Icon = channel.icon;
                const isSelected = selectedChannels[channel.id];
                return (
                  <div 
                    key={channel.id} onClick={() => toggleChannel(channel.id)}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'bg-orange-600/5 border-orange-500/50' : 'bg-[#141414] border-[#222] hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${channel.bg}`}><Icon className={`w-4 h-4 ${channel.color}`} /></div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{channel.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-[#444]'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setView('list')} className="px-5 py-2.5 bg-[#141414] border border-[#262626] text-white hover:bg-[#202020] rounded-lg text-sm font-bold transition-colors">Cancel</button>
            <button onClick={() => setView('list')} className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.15)]"><CheckCircle2 className="w-4 h-4" /> Save Automation Rule</button>
          </div>
        </div>
      );
    }

    const workflows = [
      { name: 'Global Welcome Message', trigger: 'New Conversation Started', action: 'Send "Welcome to ElderCare"', channels: ['whatsapp', 'email', 'livechat', 'instagram'], status: 'Active', priority: 'P1' },
      { name: 'After-Hours Auto Reply', trigger: 'Outside Business Hours', action: 'Send "We are currently away"', channels: ['whatsapp', 'facebook', 'instagram', 'sms'], status: 'Active', priority: 'P2' },
      { name: 'VIP Customer SLA Warning', trigger: 'No response > 15 mins', action: 'Escalate to Department Head', channels: ['livechat', 'whatsapp'], status: 'Inactive', priority: 'P1' }
    ];

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex justify-between items-center mb-4 bg-[#101010] p-4 border border-[#1e1e1e] rounded-xl shadow-lg">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search auto-replies..." className="bg-[#141414] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-orange-500 w-72 transition-colors"/>
          </div>
          <button onClick={() => setView('create')} className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.15)]">
            <Plus className="w-3.5 h-3.5" /> Create Auto Reply
          </button>
        </div>

        <div className="space-y-3">
          {workflows.map((wf, idx) => (
            <div key={idx} className="bg-[#101010] border border-[#1e1e1e] p-5 rounded-xl flex items-center justify-between hover:border-[#333] transition-colors group">
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-xl ${wf.status === 'Active' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-[#222] text-slate-500 border border-[#333]'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-white text-sm">{wf.name}</h3>
                    <span className="px-1.5 py-0.5 bg-[#222] border border-[#333] rounded text-[9px] font-bold text-slate-400">{wf.priority}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-500">Trigger: <strong className="text-slate-300">{wf.trigger}</strong></span>
                    <span className="text-slate-600">→</span>
                    <span className="text-slate-500">Action: <strong className="text-slate-300">{wf.action}</strong></span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex -space-x-2">
                  {wf.channels.map(chanId => {
                    const channel = CHANNELS.find(c => c.id === chanId);
                    if (!channel) return null;
                    const Icon = channel.icon;
                    return (
                      <div key={chanId} className={`w-8 h-8 rounded-full ${channel.bg} border-2 border-[#101010] flex items-center justify-center z-10`}>
                        <Icon className={`w-3.5 h-3.5 ${channel.color}`} />
                      </div>
                    );
                  })}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${wf.status === 'Active' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-500 border-[#333] bg-[#222]'}`}>
                  {wf.status}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] text-slate-300 hover:text-white rounded-lg transition-colors">
                    {wf.status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setView('create')} className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] text-slate-300 hover:text-white rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWorkspace = () => {
    switch (activeSetting) {
      case 'auto-replies':
        return renderAutoReplies();

      case 'chatbot':
        return (
          <EnterpriseFormWorkspace saveText="Deploy Bot Configuration" testText="Test in Sandbox">
            <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-6 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Bot className="w-5 h-5 text-orange-500"/> Omnichannel Chatbot Brain</h3>
                <p className="text-xs text-slate-500 mt-1">Configure AI intent mapping, welcome flows, and human escalation rules for all text channels.</p>
              </div>
              <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Active & Routing</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Welcome Message Flow (New Sessions)</label>
                <select className="w-full bg-[#101010] border border-[#222] focus:border-orange-500 rounded-lg px-4 py-2.5 text-sm text-white outline-none">
                  <option>Global Welcome Flow (Interactive Menu)</option>
                  <option>Direct Agent Routing (No Bot)</option>
                  <option>Holiday Away Message</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Human Handover Intent Confidence</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" defaultValue="75" className="flex-1 accent-orange-500" />
                  <span className="text-sm font-bold text-orange-500 w-12">&lt; 75%</span>
                </div>
                <p className="text-[10px] text-slate-500">Route to human if NLP intent confidence is below threshold.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalation Department</label>
                <select className="w-full bg-[#101010] border border-[#222] focus:border-orange-500 rounded-lg px-4 py-2 text-sm text-white outline-none">
                  <option>Customer Support (Default)</option>
                  <option>Sales & Conversions</option>
                  <option>Technical Triage</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#1e1e1e]">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Fallback & Generative AI</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-[#141414] border border-[#222] rounded-xl col-span-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">Enable AI Generative Fallback</h4>
                    <p className="text-xs text-slate-500 mt-1">If no exact intent matches, allow ChatGPT engine to generate a safe response based on KB.</p>
                  </div>
                  <div className="w-12 h-6 bg-orange-600 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </EnterpriseFormWorkspace>
        );

      case 'templates':
        return (
          <EnterpriseTableWorkspace 
            columns={['Template Name', 'Category', 'Language', 'Quality Rating', 'Approval Status', 'Usage 30d', 'Actions']}
            data={[
              [<span className="font-bold text-white">marketing_promo_v1</span>, 'MARKETING', 'en_US', <span className="text-emerald-400 font-bold">High</span>, <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>, '4,231', <div className="flex justify-end gap-2"><button className="p-1 hover:text-orange-500"><Eye className="w-4 h-4"/></button><button className="p-1 hover:text-orange-500"><Edit2 className="w-4 h-4"/></button></div>],
              [<span className="font-bold text-white">ticket_resolution_alert</span>, 'UTILITY', 'en_GB', <span className="text-emerald-400 font-bold">High</span>, <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>, '892', <div className="flex justify-end gap-2"><button className="p-1 hover:text-orange-500"><Eye className="w-4 h-4"/></button><button className="p-1 hover:text-orange-500"><Edit2 className="w-4 h-4"/></button></div>],
              [<span className="font-bold text-white">lead_welcome_video</span>, 'MARKETING', 'es_ES', <span className="text-slate-400 font-bold">-</span>, <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><Clock className="w-3 h-3"/> Pending</span>, '0', <div className="flex justify-end gap-2"><button className="p-1 hover:text-orange-500"><Eye className="w-4 h-4"/></button><button className="p-1 hover:text-orange-500"><Edit2 className="w-4 h-4"/></button></div>],
              [<span className="font-bold text-white">otp_verification_2fa</span>, 'AUTHENTICATION', 'en_US', <span className="text-emerald-400 font-bold">High</span>, <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>, '12,504', <div className="flex justify-end gap-2"><button className="p-1 hover:text-orange-500"><Eye className="w-4 h-4"/></button><button className="p-1 hover:text-orange-500"><Edit2 className="w-4 h-4"/></button></div>],
            ]}
            primaryAction="Create Template"
            searchPlaceholder="Search Omnichannel templates by name or category..."
          />
        );

      case 'media':
        return (
          <EnterpriseTableWorkspace 
            columns={['Media Asset', 'Type', 'Size', 'Linked Templates', 'Last Updated', 'Actions']}
            data={[
              [<div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center"><Image className="w-4 h-4 text-emerald-500"/></div><span className="font-bold text-white">diwali_promo_header.png</span></div>, 'IMAGE', '1.2 MB', 'marketing_promo_v1', 'Oct 15, 2025', <div className="flex justify-end gap-2"><button className="p-1 hover:text-orange-500"><RefreshCw className="w-4 h-4"/></button><button className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>],
              [<div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center"><PlayCircle className="w-4 h-4 text-blue-500"/></div><span className="font-bold text-white">product_demo.mp4</span></div>, 'VIDEO', '14.5 MB', 'lead_welcome_video', 'Nov 02, 2025', <div className="flex justify-end gap-2"><button className="p-1 hover:text-orange-500"><RefreshCw className="w-4 h-4"/></button><button className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>],
              [<div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center"><FileText className="w-4 h-4 text-orange-500"/></div><span className="font-bold text-white">company_brochure.pdf</span></div>, 'DOCUMENT', '4.1 MB', 'brochure_outreach', 'Sep 10, 2025', <div className="flex justify-end gap-2"><button className="p-1 hover:text-orange-500"><RefreshCw className="w-4 h-4"/></button><button className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>],
            ]}
            primaryAction="Upload Media"
            searchPlaceholder="Search media by filename or type..."
          />
        );

      default:
        return (
          <div className="h-64 border-2 border-dashed border-[#1e1e1e] rounded-xl flex flex-col items-center justify-center text-slate-500 animate-in fade-in">
            <Settings className="w-8 h-8 text-[#333] mb-3" />
            <h3 className="text-white font-bold mb-1">{activeInfo.label} Configuration</h3>
            <p className="text-xs">This enterprise module configuration is currently under development.</p>
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
              <Workflow className="text-orange-500 w-5 h-5" /> OMNICHANNEL ADMIN
            </h1>
            <div className="relative mt-4">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search settings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#222] rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {OMNICHANNEL_NAV.map((group) => {
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
                      <group.icon className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
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
                            onClick={() => {
                              setActiveSetting(item.id);
                              setView('list'); // Reset view state when navigating
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                              activeSetting === item.id 
                                ? 'bg-orange-600/10 text-orange-500 font-bold' 
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
                <span>Omnichannel Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span>{activeInfo.group}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{activeInfo.label}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500">{activeInfo.desc}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative">
            {renderWorkspace()}
          </div>
        </div>

      </div>
    </div>
  );
}
