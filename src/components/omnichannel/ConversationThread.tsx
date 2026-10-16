"use client";

import { useState, useEffect, useRef } from 'react';
import { useConversationStore } from '@/store/conversationStore';
import { Send, PhoneCall, Check, CheckCheck, FileText, Sparkles, Mic, Paperclip, MoreVertical, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversationThread() {
  const { activeConversationId, conversations, messages, typingStatus, isMessagesLoading, addMessage, setActiveConversation } = useConversationStore();
  const [inputText, setInputText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeMessages = activeConv ? (messages[activeConv.id] || []) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv) return;

    // Optimistic UI update
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
      let res: Response;

      // If channel is Email, send an actual email
      if (activeConv.channel === 'email') {
        res = await apiFetch(`/api/messages/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConv.id,
            customerEmail: activeConv.customerEmail || 'testingforcompany.0@gmail.com',
            subject: 'Reply from Support',
            message: tempMsg.content,
            agentId: 'agent_placeholder'
          })
        });
      } else if (activeConv.channel === 'whatsapp') {
        // Send actual WhatsApp via Twilio
        res = await apiFetch(`/api/messages/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConv.id,
            message: tempMsg.content
          })
        });
      } else if (activeConv.channel === 'chat' || activeConv.channel === 'instagram' || activeConv.channel === 'messenger') {
        // Send actual Instagram message via Meta Graph API
        res = await apiFetch(`/api/messages/send-instagram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConv.id,
            message: tempMsg.content
          })
        });
      } else {
        // Standard WebRTC/Internal message
        res = await apiFetch(`/api/v1/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConv.id,
            content: tempMsg.content,
            senderType: 'AGENT'
          })
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error || errJson.message || `Provider failed with status ${res.status}`;
        setSendError(errMsg);
        addMessage(activeConv.id, { ...tempMsg, status: 'failed' as any });
      } else {
        setSendError(null);
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setSendError(err.message || 'Network error sending message');
      addMessage(activeConv.id, { ...tempMsg, status: 'failed' as any });
    }
  };

  if (!activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }

  // Voice Call specific UI
  if (activeConv.channel === 'voice') {
    return (
      <div className="flex-1 flex flex-col bg-[#000]">
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20"></div>
            <PhoneCall className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Live Call with {activeConv.customerName}</h2>
          <p className="text-slate-500 font-mono text-lg mb-8">03:14</p>

          <div className="flex gap-4">
            <button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-rose-500/30 transition-all">
              End Call
            </button>
            <button className="bg-[#111] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#222] transition-all">
              Mute
            </button>
            <button className="bg-[#111] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#222] transition-all">
              Hold
            </button>
          </div>
        </div>

        {/* Live Transcription Box */}
        <div className="h-64 border-t border-[#222] bg-[#050505] p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Live AI Transcription</span>
          </div>
          <p className="text-sm text-slate-400 italic">
            Customer: "Yes, I am looking at the billing statement right now..."
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#000]">
      {/* Header */}
      <div className="h-16 border-b border-[#222] bg-[#050505] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveConversation(null as any)}
            className="md:hidden p-2 -ml-4 mr-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="relative shrink-0 w-8 h-8">
            {activeConv.customerAvatar ? (
              <img alt={activeConv.customerName || "Customer avatar"} src={activeConv.customerAvatar}
                className="w-8 h-8 rounded-full object-cover border border-[#222]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`absolute inset-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${activeConv.customerAvatar ? 'hidden' : ''} ${activeConv.channel === 'instagram' ? 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]' : 'bg-[#111] border border-[#222] text-slate-400'}`}>
              {activeConv.customerName === 'Instagram Contact' ? 'IG' : activeConv.customerName.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="font-bold text-white flex items-center gap-1.5">
            {activeConv.customerName}
            {activeConv.channel === 'instagram' && activeConv.customerName !== 'Instagram Contact' && activeConv.customerName !== 'Pending' && (
              <span title="Verified Identity"><CheckCheck className="w-3.5 h-3.5 text-blue-500" /></span>
            )}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#111] border border-[#222] text-slate-300 uppercase tracking-wide">
            {activeConv.channel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <button aria-label="Initiate voice call" className="p-2 hover:bg-[#111] hover:text-white rounded-lg transition-colors"><PhoneCall className="w-4 h-4" /></button>
          <button aria-label="Conversation options" className="p-2 hover:bg-[#111] hover:text-white rounded-lg transition-colors"><MoreVertical className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {isMessagesLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Decrypting conversation history...</p>
          </div>
        ) : (
          <AnimatePresence>
            {activeMessages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'} ${msg.isAiSuggested ? 'mb-8' : ''}`}
              >
                {msg.isAiSuggested && (
                  <div className="text-xs font-bold text-orange-500 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Suggested Reply
                  </div>
                )}

                <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender === 'agent' && !msg.isAiSuggested
                  ? 'bg-primary text-white rounded-br-sm'
                  : msg.isAiSuggested
                    ? 'bg-[#1a1308] border border-orange-500/30 text-orange-50 rounded-bl-sm shadow-sm'
                    : 'bg-[#111] border border-[#222] text-slate-200 rounded-bl-sm shadow-sm'
                  }`}>

                  {msg.attachmentType === 'audio' ? (
                    <div className="flex flex-col gap-3 min-w-[250px]">
                      {/* Audio Player */}
                      {msg.attachmentUrl ? (
                        <audio controls src={msg.attachmentUrl} className="w-full max-w-[250px] h-10 rounded-lg outline-none" />
                      ) : (
                        <div className="flex items-center gap-3 bg-[#0a0a0a] p-2 rounded-lg border border-[#222]">
                          <span className="text-xs text-slate-400">Loading audio...</span>
                        </div>
                      )}

                      {msg.transcript && (
                        <div className="text-sm">
                          <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
                            <span>Transcript ({msg.detectedLanguage || 'Unknown'})</span>
                          </div>
                          <p className="italic text-slate-400">{msg.transcript}</p>
                        </div>
                      )}

                      {msg.translation && (
                        <div className="text-sm pt-2 border-t border-[#222]">
                          <div className="text-xs text-blue-400 mb-1">English Translation</div>
                          <p>{msg.translation}</p>
                        </div>
                      )}

                      {msg.aiIntent && (
                        <div className="mt-1 flex gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333] text-slate-300 font-bold uppercase tracking-wider">
                            Intent: {msg.aiIntent}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : msg.attachmentType === 'image' ? (
                    <div className="flex flex-col gap-2">
                      <img src={msg.attachmentUrl} alt="Attached Image" className="max-w-[250px] max-h-[250px] rounded-lg object-contain bg-[#050505] border border-[#222]" />
                      {msg.content && msg.content !== '[Attachment/Media]' && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                    </div>
                  ) : msg.attachmentType === 'video' ? (
                    <div className="flex flex-col gap-2">
                      <video controls src={msg.attachmentUrl} className="max-w-[250px] rounded-lg object-cover bg-[#050505] border border-[#222]" />
                      {msg.content && msg.content !== '[Attachment/Media]' && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                    </div>
                  ) : msg.attachmentType === 'file' || msg.attachmentUrl ? (
                    <div className="flex flex-col gap-2">
                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#222] hover:bg-[#111] transition-colors">
                        <div className="w-10 h-10 rounded bg-[#1a1a1a] flex items-center justify-center text-slate-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold truncate text-white">Attachment</p>
                          <p className="text-xs text-slate-500 uppercase">Click to view</p>
                        </div>
                      </a>
                      {msg.content && msg.content !== '[Attachment/Media]' && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words break-all">{msg.content && msg.content !== '[Attachment/Media]' ? msg.content : 'Message Processing...'}</p>
                  )}

                  {msg.isAiSuggested && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-orange-500/20">
                      <button
                        onClick={async () => {
                          const actualMsg: any = { ...msg, isAiSuggested: false, id: Date.now().toString(), sender: 'agent' };
                          addMessage(activeConv.id, actualMsg);
                          
                          // Send via appropriate channel (reusing handleSend logic structure)
                          try {
                            const endpoint = activeConv.channel === 'whatsapp' ? '/api/messages/send-whatsapp' : 
                                             (activeConv.channel === 'instagram' || activeConv.channel === 'messenger' ? '/api/messages/send-instagram' : '/api/v1/messages/send');
                            
                            await apiFetch(`${endpoint}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                conversationId: activeConv.id,
                                content: msg.content,
                                message: msg.content,
                                senderType: 'AGENT'
                              })
                            });
                          } catch (err) {
                            console.error('Failed to send AI suggestion:', err);
                          }
                        }}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-1.5 rounded transition-colors text-center"
                      >
                        Approve & Send
                      </button>
                      <button className="flex-1 bg-[#222] hover:bg-[#333] text-white text-xs font-bold py-1.5 rounded transition-colors text-center">
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'agent' && !msg.isAiSuggested && (
                    (msg.status as string) === 'failed' ? (
                      <span className="flex items-center gap-0.5 text-rose-500 font-medium" title="Message delivery rejected by provider">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    ) : msg.status === 'read' ? (
                      <CheckCheck className="w-3 h-3 text-blue-500" />
                    ) : msg.status === 'delivered' ? (
                      <CheckCheck className="w-3 h-3 text-slate-400" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {activeConversationId && typingStatus[activeConversationId] && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start"
              >
                <div className="bg-[#111] border border-[#222] p-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </AnimatePresence>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#050505] border-t border-[#222] shrink-0">
        {sendError && (
          <div className="mb-2 p-2 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sendError}</span>
            </div>
            <button onClick={() => setSendError(null)} className="text-slate-400 hover:text-white ml-2 text-xs">✕</button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-[#111] border border-[#222] rounded-2xl p-2 focus-within:border-primary transition-all">
          <button aria-label="Attach file" className="p-2 text-slate-400 hover:text-white transition-colors"><Paperclip className="w-5 h-5" /></button>
          <textarea aria-label="Message input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message..."
            className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none text-sm text-white py-2 px-1 placeholder-slate-500"
            rows={1}
          />
          <button
            onClick={() => {
              if (!activeConv) return;
              alert('Voice recording requires configured media storage. Please use text messaging for current conversation.');
            }}
            aria-label="Record voice note"
            className="p-2 text-slate-400 hover:text-orange-500 transition-colors"
            title="Voice Note"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            aria-label="Send message"
            disabled={!inputText.trim()}
            className="p-2 bg-primary text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { MessageCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
