"use client";

import { useEffect, useState } from 'react';
import { ClientTimeline } from '@/components/customers/ClientTimeline';
import { LeadNotesPanel } from '@/components/leads/LeadNotesPanel';
import { ReportPanel } from '@/components/reports/ReportPanel';
import { LeadHistoryPanel } from '@/components/leads/LeadHistoryPanel';
import { useSearchParams } from 'next/navigation';
import { useLeadStore } from '@/store/useLeadStore';
import Link from 'next/link';
import { FileText, Clock, FileEdit, ArrowLeft, History } from 'lucide-react';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('id');
  const { leads, fetchLeads, isLoading } = useLeadStore();
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'reports' | 'history'>('timeline');

  useEffect(() => {
    if (!leadId) {
      const token = localStorage.getItem('paramantra_access_token') || '';
      fetchLeads(token, '');
    }
  }, [leadId, fetchLeads]);

  return (
    <div className="h-full flex flex-col p-6 text-white max-w-7xl mx-auto">
      {leadId ? (
        <div className="flex-1 flex flex-col h-full max-h-[85vh]">
          {/* Header & Tab Navigation */}
          <div className="flex flex-col gap-4 mb-4">
            <Link href="/customers" className="text-slate-400 hover:text-white flex items-center gap-2 transition w-fit">
              <ArrowLeft className="w-4 h-4" /> Back to Leads
            </Link>
            
            <div className="flex space-x-2 border-b border-[#333]">
              <button 
                onClick={() => setActiveTab('timeline')} 
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition ${
                  activeTab === 'timeline' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-[#1a1a1a] rounded-t-lg'
                }`}
              >
                <Clock className="w-4 h-4" /> Timeline
              </button>
              <button 
                onClick={() => setActiveTab('notes')} 
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition ${
                  activeTab === 'notes' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-[#1a1a1a] rounded-t-lg'
                }`}
              >
                <FileEdit className="w-4 h-4" /> Notes
              </button>
              <button 
                onClick={() => setActiveTab('reports')} 
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition ${
                  activeTab === 'reports' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-[#1a1a1a] rounded-t-lg'
                }`}
              >
                <FileText className="w-4 h-4" /> Reports
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition ${
                  activeTab === 'history' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-[#1a1a1a] rounded-t-lg'
                }`}
              >
                <History className="w-4 h-4" /> History
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            {activeTab === 'timeline' && (
              <div className="flex flex-col h-full bg-[#111] rounded-3xl border border-[#222] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#222] bg-[#1a1a1a]">
                  <h3 className="text-xl font-bold text-white">Leads Timeline</h3>
                  <p className="text-sm text-slate-400">Permanent audit trail of every interaction</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <ClientTimeline entityId={leadId} type="lead" />
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="h-full">
                <LeadNotesPanel leadId={leadId} />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="h-full">
                <ReportPanel leadId={leadId} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="h-full">
                <LeadHistoryPanel entityId={leadId} type="lead" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-[#111] rounded-3xl border border-[#222] shadow-sm p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-6">Select a Lead to view timeline</h2>
            {isLoading ? (
              <div className="text-slate-500 animate-pulse">Loading leads...</div>
            ) : leads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map(lead => (
                  <Link href={`/customers?id=${lead.id}`} key={lead.id}>
                    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333] hover:border-[#555] hover:bg-[#222] transition-colors cursor-pointer flex flex-col gap-2">
                      <div className="font-bold text-lg text-white">{lead.customerName}</div>
                      <div className="text-sm text-slate-400">{lead.phoneNumber}</div>
                      {lead.email && <div className="text-sm text-slate-400 truncate">{lead.email}</div>}
                      <div className="mt-2 text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-400 rounded w-fit">
                        {lead.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-10">No leads available.</div>
            )}
          </div>
        )}
    </div>
  );
}
