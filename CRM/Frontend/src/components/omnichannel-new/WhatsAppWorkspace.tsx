"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MoreVertical, Paperclip, Smile, Mic, Send, 
  Check, CheckCheck, Phone, Video, Download, Image as ImageIcon,
  FileText, Plus, ChevronLeft
} from 'lucide-react';
import { useConversationStore } from '@/store/conversationStore';
import { apiFetch } from '@/lib/api';

export function WhatsAppWorkspace({ platformDef, colors, onBack }: any) {
  const { 
    conversations, activeConversationId, messages, 
    addMessage, activeCustomerProfile 
  } = useConversationStore();
  
  const [inputText, setInputText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeMessages = activeConv ? (messages[activeConv.id] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv) return;
    
    const tempId = Date.now().toString();
    const tempMsg: any = {
      id: tempId,
      sender: 'agent',
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    addMessage(activeConv.id, tempMsg);
    setInputText('');
    
    try {
      await apiFetch(`/api/messages/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConv.id,
          message: tempMsg.content
        })
      });
    } catch (err) {
      console.error('Failed to send WhatsApp message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // WhatsApp Dark Mode specific colors
  const waBg = '#0b141a'; // Chat background
  const waIncoming = '#202c33'; // Incoming bubble
  const waOutgoing = '#005c4b'; // Outgoing bubble
  const waPanel = '#202c33'; // Header/Composer bg
  const waText = '#e9edef'; // Text color
  const waMuted = '#8696a0'; // Timestamps, icons

  if (!activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-slate-500">
        <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center mb-4">
          <platformDef.icon className="w-8 h-8 text-[#00a884]" />
        </div>
        <h2 className="text-xl text-[#e9edef] font-light">WhatsApp Web</h2>
        <p className="mt-2 text-sm text-[#8696a0]">Select a conversation to start messaging</p>
      </div>
    );
  }

  // Group messages
  const groupedMessages = [];
  let currentGroup: any = [];
  
  activeMessages.forEach((msg, idx) => {
    const prev = activeMessages[idx - 1];
    if (prev && prev.sender === msg.sender) {
      currentGroup.push(msg);
    } else {
      if (currentGroup.length > 0) groupedMessages.push(currentGroup);
      currentGroup = [msg];
    }
  });
  if (currentGroup.length > 0) groupedMessages.push(currentGroup);

  return (
    <div className="flex-1 flex h-full" style={{ backgroundColor: waBg }}>
      {/* 1. MAIN CHAT THREAD */}
      <div className="flex-1 flex flex-col border-r border-[#222d34]">
        
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-[#222d34]" style={{ backgroundColor: waPanel }}>
          <div className="flex items-center gap-3 cursor-pointer">
            <button onClick={onBack} className="md:hidden p-1 mr-1 text-[#8696a0] hover:text-[#d1d7db]">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-[#303f46] overflow-hidden flex items-center justify-center text-slate-300 font-bold">
              {activeConv.customerAvatar ? <img src={activeConv.customerAvatar} alt="avatar" /> : activeConv.customerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-base text-[#e9edef] leading-tight">{activeConv.customerName}</span>
              <span className="text-xs text-[#8696a0]">online</span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-[#8696a0]">
            <button aria-label="Start video call" className="hover:text-[#d1d7db]"><Video className="w-5 h-5" /></button>
            <button aria-label="Search WhatsApp messages" className="hover:text-[#d1d7db]"><Search className="w-5 h-5" /></button>
            <button aria-label="More options" className="hover:text-[#d1d7db]"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* CHAT AREA WITH SUBTLE PATTERN */}
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 custom-scrollbar relative"
          style={{ 
            backgroundColor: waBg,
            backgroundImage: 'radial-gradient(#ffffff0a 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          <div className="flex justify-center mb-6">
            <span className="bg-[#182229] text-[#8696a0] text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm">
              TODAY
            </span>
          </div>

          <AnimatePresence>
            {groupedMessages.map((group: any, gIdx: number) => {
              const isOutgoing = group[0].sender === 'agent';
              
              return (
                <div key={gIdx} className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} mb-3 space-y-0.5`}>
                  {group.map((msg: any, mIdx: number) => {
                    const isFirst = mIdx === 0;
                    const isLast = mIdx === group.length - 1;
                    
                    let roundedClass = 'rounded-lg';
                    if (isOutgoing) {
                      roundedClass = isFirst ? 'rounded-l-lg rounded-br-lg' : (isLast ? 'rounded-l-lg rounded-tr-lg' : 'rounded-l-lg');
                      if (group.length === 1) roundedClass = 'rounded-l-lg rounded-br-lg';
                    } else {
                      roundedClass = isFirst ? 'rounded-r-lg rounded-bl-lg' : (isLast ? 'rounded-r-lg rounded-tl-lg' : 'rounded-r-lg');
                      if (group.length === 1) roundedClass = 'rounded-r-lg rounded-bl-lg';
                    }

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`relative max-w-[75%] px-2.5 py-1.5 shadow-sm group ${roundedClass}`}
                        style={{ backgroundColor: isOutgoing ? waOutgoing : waIncoming }}
                      >
                        {/* Optional Tail for first message */}
                        {isFirst && (
                          <div 
                            className={`absolute top-0 w-2 h-2 ${isOutgoing ? '-right-2' : '-left-2'}`}
                            style={{ 
                              backgroundColor: isOutgoing ? waOutgoing : waIncoming,
                              clipPath: isOutgoing ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' 
                            }}
                          />
                        )}

                        {/* Content Area */}
                        <div className="flex flex-col text-[#e9edef] text-[15px] leading-snug">
                          {msg.attachmentType === 'image' && (
                            <img src={msg.attachmentUrl} alt="media" className="rounded mb-1 max-w-full max-h-[250px] object-cover cursor-pointer" />
                          )}
                          
                          <div className="flex items-end flex-wrap gap-x-2">
                            <span className="whitespace-pre-wrap break-words min-w-0 flex-1">{msg.content}</span>
                            
                            {/* Timestamp & Status tucked into bottom right */}
                            <div className="flex items-center gap-1 shrink-0 self-end ml-2 -mb-1 mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                              <span>{msg.timestamp}</span>
                              {isOutgoing && (
                                <span className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-inherit'}>
                                  {msg.status === 'sent' ? <Check className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Hover Action Menu */}
                        <button className="absolute top-1 right-1 p-0.5 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        {/* COMPOSER */}
        <div className="min-h-[62px] flex items-end px-4 py-3 gap-2" style={{ backgroundColor: waPanel }}>
          <button className="p-2 text-[#8696a0] hover:text-[#d1d7db] shrink-0">
            <Smile className="w-6 h-6" />
          </button>
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowAttachments(!showAttachments)}
              className="p-2 text-[#8696a0] hover:text-[#d1d7db]"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            {/* Attachment Menu Popover */}
            <AnimatePresence>
              {showAttachments && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-12 left-0 bg-[#233138] rounded-2xl shadow-xl p-2 flex flex-col gap-2 z-50 w-48"
                >
                  <button className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-xl text-[#d1d7db] text-sm"><FileText className="w-5 h-5 text-indigo-400" /> Document</button>
                  <button className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-xl text-[#d1d7db] text-sm"><ImageIcon className="w-5 h-5 text-blue-500" /> Photos & Videos</button>
                  <button className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-xl text-[#d1d7db] text-sm"><Phone className="w-5 h-5 text-emerald-500" /> Contact</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex-1 bg-[#2a3942] rounded-lg border-none min-h-[40px] flex items-center">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="w-full bg-transparent resize-none outline-none text-[15px] text-[#e9edef] px-4 py-2 placeholder-[#8696a0]"
              rows={1}
            />
          </div>
          
          <button 
            onClick={inputText.trim() ? handleSend : undefined}
            className="p-2 text-[#8696a0] hover:text-[#d1d7db] shrink-0"
          >
            {inputText.trim() ? <Send className="w-6 h-6 text-[#00a884]" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 2. CUSTOMER PROFILE / APPOINTMENT PANEL */}
      <div className="w-80 border-l border-[#222d34] flex flex-col overflow-y-auto custom-scrollbar" style={{ backgroundColor: waBg }}>
        <div className="h-16 flex items-center px-6 shrink-0 border-b border-[#222d34]" style={{ backgroundColor: waPanel }}>
          <h3 className="text-[#e9edef] font-medium">Contact info</h3>
        </div>
        
        <div className="flex flex-col items-center p-6 border-b border-[#222d34] bg-[#111b21]">
          <div className="w-48 h-48 rounded-full bg-[#303f46] overflow-hidden flex items-center justify-center text-slate-300 font-bold text-5xl mb-4">
            {activeConv.customerAvatar ? <img src={activeConv.customerAvatar} alt="avatar" className="w-full h-full object-cover" /> : activeConv.customerName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl text-[#e9edef] font-medium">{activeConv.customerName}</h2>
          <p className="text-[#8696a0] text-sm mt-1">{activeConv.customerName || '+91 98765 43210'}</p>
        </div>

        <div className="p-4 border-b border-[#222d34] bg-[#111b21] mt-2">
          <p className="text-[#8696a0] text-sm mb-2">About and phone number</p>
          <p className="text-[#e9edef]">CRM Lead - {activeConv.priority.toUpperCase()}</p>
        </div>

        {/* BOOKING INTEGRATION */}
        <div className="p-6 mt-2 bg-[#111b21]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-[#e9edef]">Appointments</h4>
            <span className="text-xs text-[#00a884]">View All</span>
          </div>
          <button className="w-full py-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Book Appointment
          </button>
          
          <div className="mt-4 p-3 rounded-lg border border-[#222d34] bg-[#0b141a]">
            <p className="text-xs text-[#8696a0] mb-1">Last Appointment</p>
            <p className="text-sm text-[#e9edef]">Dr. Smith - Gen Checkup</p>
            <p className="text-[10px] text-[#8696a0] mt-1">12 Sept 2026</p>
          </div>
        </div>

        <div className="p-6 mt-2 bg-[#111b21] flex-1">
          <h4 className="text-sm font-medium text-[#e9edef] mb-3">AI Insights</h4>
          <p className="text-xs text-[#8696a0] leading-relaxed">
            Patient prefers evening appointments. High engagement on WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
