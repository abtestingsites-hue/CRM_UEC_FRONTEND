"use client";

import { useState, useEffect } from 'react';
import { useConversationStore } from '@/store/conversationStore';
import { Phone, MessageCircle, Mail, MessageSquare, AlertCircle, Filter, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const InstagramLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const WhatsAppLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const ChannelIcon = ({ channel }: { channel: string }) => {
  switch (channel) {
    case 'whatsapp': return <WhatsAppLogo className="w-4 h-4 text-[#25D366]" />;
    case 'voice': return <Phone className="w-4 h-4 text-blue-500" />;
    case 'email': return <Mail className="w-4 h-4 text-rose-500" />;
    case 'chat': return <InstagramLogo className="w-4 h-4 text-[#E1306C]" />;
    case 'instagram': return <InstagramLogo className="w-4 h-4 text-[#E1306C]" />;
    case 'messenger': return <MessageSquare className="w-4 h-4 text-[#0084FF]" />;
    case 'sms': return <MessageSquare className="w-4 h-4 text-amber-500" />;
    default: return <MessageCircle className="w-4 h-4 text-slate-500" />;
  }
};

export function ConversationSidebar() {
  const { conversations, activeConversationId, isLoading, fetchConversations, fetchMessages, setActiveConversation, markAsRead } = useConversationStore();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    markAsRead(id);
    fetchMessages(id);
  };

  return (
    <div className="w-80 h-full border-r border-[#222] bg-[#050505] flex flex-col shrink-0">
      <div className="p-4 border-b border-[#222] space-y-4">
        <h2 className="font-bold text-lg text-white">Unified Inbox</h2>
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full bg-[#111] border border-[#222] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all text-white placeholder-slate-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-[#222] text-white' : 'bg-[#111] border border-[#333] text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${activeTab === 'whatsapp' ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30' : 'bg-[#111] border border-[#333] text-slate-400 hover:text-white'}`}
          >
            WhatsApp
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${activeTab === 'email' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-[#111] border border-[#333] text-slate-400 hover:text-white'}`}
          >
            Mail
          </button>
          <button 
            onClick={() => setActiveTab('instagram')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${activeTab === 'instagram' ? 'bg-[#E1306C]/20 text-[#E1306C] border border-[#E1306C]/30' : 'bg-[#111] border border-[#333] text-slate-400 hover:text-white'}`}
          >
            Instagram
          </button>
          <button 
            onClick={() => setActiveTab('messenger')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${activeTab === 'messenger' ? 'bg-[#0084FF]/20 text-[#0084FF] border border-[#0084FF]/30' : 'bg-[#111] border border-[#333] text-slate-400 hover:text-white'}`}
          >
            Messenger
          </button>
          <button className="p-1 text-slate-500 hover:text-white ml-auto transition-colors"><Filter className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Syncing with CRM...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <span className="text-sm">No active conversations</span>
          </div>
        ) : (
          conversations.filter(c => activeTab === 'all' || c.channel === activeTab).map((conv) => (
            <motion.div
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`p-4 border-b border-[#222] cursor-pointer transition-colors relative hover:bg-[#111] flex gap-3 ${activeConversationId === conv.id ? 'bg-[#111] border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
            >
              {/* Avatar Section */}
              <div className="relative shrink-0 w-10 h-10">
                {conv.customerAvatar ? (
                  <img
                    src={conv.customerAvatar}
                    alt={conv.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-[#222]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                {/* Fallback Avatar */}
                <div className={`absolute inset-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${conv.customerAvatar ? 'hidden' : ''} ${conv.channel === 'instagram' ? 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]' : 'bg-[#111] border border-[#222] text-slate-400'}`}>
                  {conv.customerName === 'Instagram Contact' ? 'IG' : conv.customerName.charAt(0).toUpperCase()}
                </div>
                
                {/* Channel Icon Badge */}
                <div className="absolute -bottom-1 -right-1 z-10 bg-black rounded-full p-1 border border-[#222] flex items-center justify-center">
                  <ChannelIcon channel={conv.channel} />
                </div>
              </div>

              {/* Text Info Section */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-sm text-slate-200 truncate">{conv.customerName}</span>
                    {conv.priority === 'emergency' && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{conv.timestamp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate pr-4 ${conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
