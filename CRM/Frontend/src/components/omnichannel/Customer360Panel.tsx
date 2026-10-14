"use client";

import React from 'react';
import { useConversationStore } from '@/store/conversationStore';
import { User, ShieldAlert, Activity, FileText, HeartPulse, CheckCircle, RefreshCw } from 'lucide-react';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export function Customer360Panel() {
  const { activeConversationId, conversations, activeCustomerProfile, isCustomerLoading } = useConversationStore();
  const activeConv = conversations.find(c => c.id === activeConversationId);

  if (!activeConv) {
    return <div className="w-80 h-full border-l border-[#222] bg-[#050505] shrink-0"></div>;
  }

  const isInstagram = activeConv.channel === 'instagram';
  const profilePic = activeCustomerProfile?.instagramProfilePic || '';

  return (
    <div className="w-80 h-full border-l border-[#222] bg-[#050505] flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      {/* Profile Header */}
      <div className="p-6 border-b border-[#222] text-center relative bg-gradient-to-b from-[#111]/50 to-transparent backdrop-blur-sm">
        {isInstagram && (
          <div className="absolute top-4 right-4 text-pink-500 bg-pink-500/10 p-1.5 rounded-full border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
            <InstagramIcon className="w-4 h-4" />
          </div>
        )}
        <div className="relative inline-block mt-2">
          {profilePic ? (
            <img 
              src={profilePic} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-[#222] object-cover shadow-lg bg-[#111]" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          <div className={`w-24 h-24 rounded-full mx-auto mb-4 border-2 border-[#222] shadow-lg flex items-center justify-center text-white text-3xl font-bold ${profilePic ? 'hidden' : ''} ${isInstagram ? 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]' : 'bg-[#111]'}`}>
            {(activeCustomerProfile?.name || activeConv.customerName) === 'Instagram Contact' ? 'IG' : (activeCustomerProfile?.name || activeConv.customerName)?.charAt(0).toUpperCase()}
          </div>
          
          {isInstagram && activeCustomerProfile?.profileEnriched && (
            <span className="absolute bottom-4 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-[#050505] shadow-md z-10" title="Verified Identity">
              <CheckCircle className="w-5 h-5 fill-blue-500 text-white" />
            </span>
          )}
        </div>
        <h3 className="font-bold text-lg text-white flex items-center justify-center gap-1.5">
          {activeCustomerProfile?.name || activeConv.customerName}
        </h3>
        
        {isCustomerLoading && (
          <div className="animate-pulse w-32 h-4 bg-[#222] mx-auto mt-2 rounded"></div>
        )}
        
        <div className="flex gap-2 justify-center mt-3">
          {isInstagram ? (
            activeCustomerProfile?.profileEnriched ? (
              <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-500/20 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-400" /> Meta Enriched
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-500/20 flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" /> Identity Syncing...
              </span>
            )
          ) : null}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Contact Info */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <User className="w-3 h-3" /> Details
          </h4>
          
          {isCustomerLoading ? (
            <div className="space-y-2 animate-pulse">
               <div className="h-4 bg-[#111] rounded"></div>
               <div className="h-4 bg-[#111] rounded"></div>
               <div className="h-4 bg-[#111] rounded"></div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {isInstagram ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Platform</span>
                    <span className="font-medium text-pink-400 flex items-center gap-1">
                      <InstagramIcon className="w-3.5 h-3.5" /> Instagram
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IG Handle</span>
                    <span className="font-medium text-slate-200">
                      {activeCustomerProfile?.instagramUsername || activeCustomerProfile?.name || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IG User ID</span>
                    <span className="font-mono text-xs text-slate-400 truncate max-w-[150px]">
                      {activeCustomerProfile?.phone || 'N/A'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-slate-200">
                      {activeCustomerProfile?.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-200 truncate ml-4">
                      {activeCustomerProfile?.email || activeConv.customerEmail || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID</span>
                    <span className="font-mono text-xs text-slate-400 truncate max-w-[150px]">
                      CUST-{activeCustomerProfile?.id?.split('-')[0] || activeConv.customerId?.split('-')[0] || 'UNKNOWN'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Medical Notes */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-2">
            <HeartPulse className="w-3 h-3" /> Care Notes
          </h4>
          <div className="bg-[#111] p-3 rounded-xl border border-[#222] text-sm">
            {isCustomerLoading ? (
              <div className="h-10 bg-[#222] animate-pulse rounded"></div>
            ) : activeCustomerProfile?.notes && activeCustomerProfile.notes.length > 0 ? (
              <div className="space-y-2">
                {activeCustomerProfile.notes.map((note, idx) => (
                  <p key={idx} className="text-slate-400">• {note.content}</p>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-xs">No specific care notes found.</p>
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
            <Activity className="w-3 h-3" /> AI Analysis
          </h4>
          <div className="space-y-3">
            <div className="bg-[#111] p-3 rounded-xl border border-[#222]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-500">Sentiment</span>
                <span className={`text-xs font-bold ${
                  activeCustomerProfile?.aiSummary?.sentimentScore === 'NEGATIVE' ? 'text-rose-500' :
                  activeCustomerProfile?.aiSummary?.sentimentScore === 'POSITIVE' ? 'text-emerald-500' : 'text-primary'
                }`}>
                  {activeCustomerProfile?.aiSummary?.sentimentScore || 'Neutral'}
                </span>
              </div>
              <div className="w-full bg-[#222] rounded-full h-1.5">
                <div className={`h-1.5 rounded-full w-[${activeCustomerProfile?.aiSummary?.sentimentScore === 'NEGATIVE' ? '20' : activeCustomerProfile?.aiSummary?.sentimentScore === 'POSITIVE' ? '80' : '50'}%] ${
                  activeCustomerProfile?.aiSummary?.sentimentScore === 'NEGATIVE' ? 'bg-rose-500' :
                  activeCustomerProfile?.aiSummary?.sentimentScore === 'POSITIVE' ? 'bg-emerald-500' : 'bg-primary'
                }`}></div>
              </div>
            </div>
            
            <div className="bg-[#111] p-3 rounded-xl border border-[#222] text-xs text-slate-400 leading-relaxed">
              {activeCustomerProfile?.aiSummary ? (
                <>
                  <span className="font-bold text-white">Summary:</span> {activeCustomerProfile.aiSummary.summaryText}
                </>
              ) : (
                <span className="italic text-slate-500">No recent AI summaries available for this customer.</span>
              )}
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <FileText className="w-3 h-3" /> Recent Tickets
          </h4>
          <div className="space-y-2">
            {isCustomerLoading ? (
               <div className="h-12 bg-[#111] rounded animate-pulse"></div>
            ) : activeCustomerProfile?.tickets && activeCustomerProfile.tickets.length > 0 ? (
              activeCustomerProfile.tickets.map(ticket => (
                <div key={ticket.id} className="p-2 hover:bg-[#111] rounded-lg cursor-pointer border border-transparent hover:border-[#222] transition-all">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-200">#{ticket.id.split('-')[0].toUpperCase()}</span> 
                    <span className={`text-xs ${ticket.status === 'CLOSED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{ticket.category} - {ticket.priority}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-2 bg-[#111] rounded-lg border border-[#222]">No tickets found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
