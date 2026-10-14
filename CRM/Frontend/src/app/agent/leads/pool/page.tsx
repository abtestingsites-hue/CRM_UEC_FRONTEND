"use client";

import React, { useEffect, useState } from 'react';
import { useLeadStore } from '@/store/useLeadStore';
import { useCallStore } from '@/store/useCallStore';
import { ManualLeadEntryModal } from '@/components/leads/ManualLeadEntryModal';
import { Phone, AlertCircle, Filter, Search, Plus } from 'lucide-react';

export default function AgentLeadsPage() {
  const { leads, fetchLeads, claimLead, isLoading } = useLeadStore();
  const { setActiveCall } = useCallStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('paramantra_access_token') || '';
    fetchLeads(token, '?status=NEW');
  }, [fetchLeads]);

  const handleClaim = async (leadId: string) => {
    // Dynamically retrieve the logged-in user's agentId
    let agentId = null;
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        agentId = JSON.parse(stored).agentId;
      }
    } catch (e) {}

    if (!agentId) {
      alert("Error: Agent profile not found. Please log out and log back in.");
      return;
    }

    const success = await claimLead(leadId, agentId);
    if (success) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setActiveCall({
          callSid: `outbound-${Date.now()}`,
          phone: lead.phoneNumber,
          customerName: lead.customerName,
          category: 'Outbound',
          isCaller: true,
          status: 'RINGING',
          leadId: lead.id
        });
      }
      alert("Lead claimed! Initiating call...");
    } else {
      alert("Failed to claim lead. It might be locked by another agent.");
    }
  };

  const filteredLeads = leads.filter(l => 
    l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-6 bg-[#000] min-h-screen md:min-h-0 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Lead Pool</h1>
            <p className="text-slate-400 text-sm mt-1">Available leads waiting to be claimed and contacted.</p>
          </div>
          <button 
            onClick={() => setIsManualEntryOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-[#222] hover:bg-[#333] border border-[#444] rounded-xl text-sm font-bold text-white transition-colors min-h-[48px] sm:min-h-0 w-full sm:w-auto shadow-sm md:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Manual Entry
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#111] border border-[#222] p-4 rounded-2xl shadow-sm md:shadow-none">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search leads..."
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors min-h-[44px] md:min-h-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] rounded-xl text-sm font-bold text-white transition-colors min-h-[44px] md:min-h-0 shadow-sm md:shadow-none">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] border-b border-[#222] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Service Interest</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading leads...</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    No leads found in the pool.
                  </td>
                </tr>
              ) : filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4 font-medium">{lead.customerName}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">{lead.phoneNumber}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                      {lead.serviceInterest || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {lead.status === 'NEW' ? (
                      <button 
                        onClick={() => handleClaim(lead.id)}
                        className="flex items-center gap-2 ml-auto px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </button>
                    ) : (
                      <span className="text-slate-500 text-xs">Claimed by {lead.agentName}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-16 bg-[#111] border border-[#222] rounded-2xl text-slate-500 shadow-sm animate-pulse">
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
              <p className="text-xs">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-16 bg-[#111] border border-[#222] rounded-2xl text-slate-500 shadow-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50 text-slate-500" />
              <p className="font-bold text-white mb-1">No leads found</p>
              <p className="text-xs">There are no leads in the pool at the moment.</p>
            </div>
          ) : filteredLeads.map(lead => (
            <div key={lead.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 space-y-3 shadow-sm text-white">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-base text-white leading-tight">{lead.customerName}</h3>
                  <p className="font-mono text-sm text-slate-400 mt-1">{lead.phoneNumber}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20 shrink-0">
                  {lead.serviceInterest || 'Unknown'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#222] flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 font-medium bg-[#111] px-2 py-0.5 rounded-md border border-[#222]">
                  Status: {lead.status}
                </span>
                
                {lead.status === 'NEW' ? (
                  <button 
                    onClick={() => handleClaim(lead.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all min-h-[40px] shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Claim & Call
                  </button>
                ) : (
                  <span className="text-slate-400 text-xs font-medium bg-[#111] px-2 py-1 rounded-lg border border-[#222]">Claimed by {lead.agentName}</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
      <ManualLeadEntryModal 
        isOpen={isManualEntryOpen} 
        onClose={() => setIsManualEntryOpen(false)} 
      />
    </div>
  );
}
