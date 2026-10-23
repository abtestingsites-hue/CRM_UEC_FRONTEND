"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationStore } from '@/store/conversationStore';
import { 
  MessageSquare, Phone, Mail, AlertCircle, Search, Filter, 
  Send, Check, CheckCheck, Paperclip, Mic, Image as ImageIcon,
  ChevronLeft, MoreVertical, LayoutGrid, Zap
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { WhatsAppWorkspace } from './WhatsAppWorkspace';
import { InstagramWorkspace } from './InstagramWorkspace';
import { OmnichannelEnquiryPanel } from './OmnichannelEnquiryPanel';

// Platform Icons
const WhatsAppLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const InstagramLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const MessengerLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.888-3.26-6.559 6.963z"/>
  </svg>
);

const PLATFORMS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: WhatsAppLogo, color: '#25D366', status: 'Connected' },
  { id: 'instagram', name: 'Instagram', icon: InstagramLogo, color: '#E1306C', status: 'Connected' },
  { id: 'messenger', name: 'Messenger', icon: MessengerLogo, color: '#0084FF', status: 'Connected' },
  { id: 'facebook', name: 'Facebook', icon: FacebookLogo, color: '#1877F2', status: 'Disconnected' },
  { id: 'sms', name: 'SMS', icon: MessageSquare, color: '#F59E0B', status: 'Connected' },
  { id: 'email', name: 'Email', icon: Mail, color: '#EF4444', status: 'Connected' }
];

export function OmnichannelApp() {
  const { conversations, activeConversationId, fetchConversations, fetchMessages, setActiveConversation, markAsRead, addMessage, messages } = useConversationStore();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeMessages = activeConv ? (messages[activeConv.id] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setActiveConversation(null as any);
  };

  const filteredConversations = conversations
    .filter(c => !selectedPlatform || selectedPlatform === 'all' || c.channel === selectedPlatform)
    .slice(0, 20); // Show only top 20 recent chats

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv) return;
    
    const messageContent = inputText.trim();
    setInputText('');

    const tempId = `temp_${Date.now()}`;
    const tempMsg: any = {
      id: tempId,
      sender: 'agent',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    addMessage(activeConv.id, tempMsg);
    
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('paramantra_access_token') : '';
      const res = await apiFetch(`/api/v1/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: activeConv.id,
          content: messageContent,
          senderType: 'AGENT'
        })
      });

      if (res.ok) {
        const persisted = await res.json();
        addMessage(activeConv.id, {
          id: persisted.id,
          sender: 'agent',
          content: persisted.content || messageContent,
          timestamp: new Date(persisted.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered'
        });
      }
    } catch (err) {
      console.error('Failed to dispatch omnichannel message:', err);
    }
  };

  const getPlatformColors = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return { bg: 'bg-[#25D366]/10', border: 'border-[#25D366]/20', text: 'text-[#25D366]', primary: 'bg-[#25D366]' };
      case 'instagram': return { bg: 'bg-[#E1306C]/10', border: 'border-[#E1306C]/20', text: 'text-[#E1306C]', primary: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]' };
      case 'messenger': return { bg: 'bg-[#0084FF]/10', border: 'border-[#0084FF]/20', text: 'text-[#0084FF]', primary: 'bg-[#0084FF]' };
      case 'facebook': return { bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]/20', text: 'text-[#1877F2]', primary: 'bg-[#1877F2]' };
      case 'sms': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', primary: 'bg-amber-500' };
      case 'email': return { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500', primary: 'bg-rose-500' };
      default: return { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', primary: 'bg-primary' };
    }
  };

  const PlatformWorkspace = () => {
    if (!selectedPlatform || selectedPlatform === 'all') return null;
    const platformDef = PLATFORMS.find(p => p.id === selectedPlatform);
    if (!platformDef) return null;
    
    const colors = getPlatformColors(selectedPlatform);

    // If it's WhatsApp, render the dedicated WhatsApp adapter
    if (selectedPlatform === 'whatsapp') {
      return <WhatsAppWorkspace platformDef={platformDef} colors={colors} onBack={() => setSelectedPlatform(null)} />;
    }

    // If it's Instagram, render the dedicated Instagram Direct adapter
    if (selectedPlatform === 'instagram') {
      return <InstagramWorkspace platformDef={platformDef} colors={colors} onBack={() => setSelectedPlatform(null)} />;
    }

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col h-full bg-[#030303] relative"
      >
        {/* Workspace Header */}
        <div className={`h-16 border-b border-[#1c1c1c] flex items-center justify-between px-6 shrink-0 ${colors.bg}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedPlatform(null)} className="md:hidden mr-2 text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${colors.primary}`}>
              <platformDef.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white leading-tight">{platformDef.name} Workspace</h2>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${colors.text}`}>
                {platformDef.status}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button aria-label="Search conversations" className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-black/20 transition-colors"><Search className="w-4 h-4" /></button>
            <button aria-label="More options" className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-black/20 transition-colors"><MoreVertical className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Conversation Area */}
        {activeConv ? (
          <div className="flex-1 flex h-[calc(100%-4rem)]">
            {/* Thread */}
            <div className="flex-1 flex flex-col border-r border-[#1c1c1c]">
              {/* Active Conversation Header */}
              <div className="h-14 border-b border-[#1c1c1c] bg-[#080808] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#222] overflow-hidden flex items-center justify-center text-slate-300 font-bold border border-[#333]">
                    {activeConv.customerAvatar ? <img src={activeConv.customerAvatar} alt="avatar" /> : (activeConv.customerName?.replace(/^@/, '') || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{activeConv.customerName}</h3>
                    <p className="text-[10px] text-slate-400">{activeConv.channel === 'sms' ? activeConv.customerName : (activeConv.channel === 'email' ? activeConv.customerEmail : 'Online')}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#020202]">
                <AnimatePresence>
                  {activeMessages.map((msg) => (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${msg.sender === 'agent'
                        ? `${colors.primary} text-white rounded-br-sm`
                        : 'bg-[#141414] border border-[#222] text-slate-200 rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'agent' && (
                          msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </AnimatePresence>
              </div>

              {/* Composer */}
              <div className="p-4 bg-[#080808] border-t border-[#1c1c1c] shrink-0">
                <div className="flex items-end gap-2 bg-[#141414] border border-[#262626] rounded-xl p-2 focus-within:border-slate-500 transition-colors">
                  <button aria-label="Attach file" className="p-2 text-slate-400 hover:text-white"><Paperclip className="w-4 h-4" /></button>
                  <textarea aria-label="Message input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={`Reply via ${platformDef.name}...`}
                    className="flex-1 max-h-32 min-h-[36px] bg-transparent resize-none outline-none text-sm text-white py-2 px-1 placeholder-slate-500"
                    rows={1}
                  />
                  <button aria-label="Attach image" className="p-2 text-slate-400 hover:text-white"><ImageIcon className="w-4 h-4" /></button>
                  <button aria-label="Send message" onClick={handleSend} disabled={!inputText.trim()} className={`p-2 rounded-lg text-white disabled:opacity-50 transition-colors ${colors.primary}`}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Omnichannel Enquiry Intelligence Panel */}
            <OmnichannelEnquiryPanel
              conversation={activeConv}
              className="w-80 md:w-96 hidden lg:flex"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${colors.bg} ${colors.text}`}>
              <platformDef.icon className="w-8 h-8 opacity-50" />
            </div>
            <p>Select a {platformDef.name} conversation to view</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex h-full w-full bg-[#000] text-white overflow-hidden">
      
      {/* 1. RECENT CHATS PANEL (Left) */}
      <div className="w-80 md:w-96 flex flex-col border-r border-[#1a1a1a] bg-[#050505] shrink-0 z-10">
        <div className="p-5 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Chats</h2>
            {selectedPlatform && selectedPlatform !== 'all' && (
              <button 
                onClick={() => setSelectedPlatform('all')}
                className="text-[10px] font-bold uppercase tracking-wider bg-[#1a1a1a] hover:bg-[#262626] text-slate-300 px-2 py-1 rounded transition-colors"
              >
                View All
              </button>
            )}
          </div>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" />
            <input aria-label="Search conversations"
              type="text" 
              id="search-workspace-conversations"
              placeholder="Search conversations..." 
              className="w-full bg-[#111] border border-[#222] focus:border-slate-500 rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <AnimatePresence>
            {filteredConversations.map((conv) => {
              const platform = PLATFORMS.find(p => p.id === conv.channel) || PLATFORMS[0];
              const Icon = platform.icon;
              const isActive = activeConversationId === conv.id;
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv.id);
                    if (selectedPlatform !== conv.channel) setSelectedPlatform(conv.channel);
                    markAsRead(conv.id);
                  }}
                  className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[#1a1a1a] shadow-sm' : 'hover:bg-[#0f0f0f]'}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-[#222] overflow-hidden flex items-center justify-center text-slate-400 font-bold border border-[#333]">
                      {conv.customerAvatar ? <img src={conv.customerAvatar} alt="av" className="w-full h-full object-cover" /> : (conv.customerName?.replace(/^@/, '') || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div 
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050505]"
                      style={{ backgroundColor: platform.color }}
                    >
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-sm text-slate-100 truncate">{conv.customerName}</span>
                      <span className="text-[10px] text-slate-500">{conv.timestamp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate pr-2 ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-slate-500'}`}>
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="w-4 h-4 flex items-center justify-center bg-orange-500 text-white text-[9px] font-bold rounded-full shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredConversations.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-10">No recent conversations found.</div>
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE / PLATFORM HUB */}
      <div className="flex-1 flex flex-col bg-[#030303] relative overflow-hidden">
        {(!selectedPlatform || selectedPlatform === 'all') ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="flex-1 overflow-y-auto custom-scrollbar p-10"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <LayoutGrid className="w-6 h-6 text-orange-500" />
                <h1 className="text-3xl font-bold text-white tracking-tight">Connected Platforms</h1>
              </div>
              <p className="text-slate-400 mb-10">Manage and access all your omnichannel communication streams in one place.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PLATFORMS.map((platform) => (
                  <div 
                    key={platform.id}
                    onClick={() => handlePlatformSelect(platform.id)}
                    className="group relative bg-[#0a0a0a] border border-[#1c1c1c] hover:border-[#333] rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500" style={{ backgroundColor: platform.color }}></div>
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: platform.color }}>
                        <platform.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${platform.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {platform.status}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-white mb-1">{platform.name}</h3>
                      <p className="text-xs text-slate-500">
                        {platform.status === 'Connected' 
                          ? `View recent ${platform.name} conversations and manage active chats.` 
                          : `Connect your ${platform.name} account to start receiving messages.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <PlatformWorkspace />
        )}
      </div>

    </div>
  );
}
