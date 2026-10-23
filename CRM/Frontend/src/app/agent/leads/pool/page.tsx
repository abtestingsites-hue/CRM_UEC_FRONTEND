"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useLeadStore } from '@/store/useLeadStore';
import { useCallStore } from '@/store/useCallStore';
import { CallIntakeFormModal } from '@/components/call-center/CallIntakeFormModal';
import { CustomerHistoryDrawer } from '@/components/call-center/CustomerHistoryDrawer';
import {
  Phone,
  Users,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  Plus,
  Globe,
  MessageCircle,
  ThumbsUp,
  Camera,
  Mail,
  UserPlus,
  Store,
  PhoneCall,
  FileText,
  History,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export default function AgentLeadsPage() {
  const { leads, fetchLeads, claimLead, isLoading } = useLeadStore();
  const { setActiveCall } = useCallStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Intake Form Modal (Manual Entry & Edit Details)
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedLeadForIntake, setSelectedLeadForIntake] = useState<any | null>(null);

  // Customer History Intelligence Drawer
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Action notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getSourceIcon = (source?: string | null) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('whatsapp')) return <MessageCircle className="w-4 h-4 text-emerald-400" />;
    if (s.includes('facebook')) return <ThumbsUp className="w-4 h-4 text-blue-500" />;
    if (s.includes('instagram')) return <Camera className="w-4 h-4 text-pink-500" />;
    if (s.includes('email')) return <Mail className="w-4 h-4 text-rose-400" />;
    if (s.includes('referral')) return <UserPlus className="w-4 h-4 text-purple-400" />;
    if (s.includes('walk-in') || s.includes('walkin')) return <Store className="w-4 h-4 text-amber-400" />;
    if (s.includes('inbound') || s.includes('incoming')) return <PhoneCall className="w-4 h-4 text-emerald-400" />;
    if (s.includes('outbound') || s.includes('outgoing')) return <Phone className="w-4 h-4 text-blue-400" />;
    if (s.includes('manual')) return <FileText className="w-4 h-4 text-cyan-400" />;
    return <Globe className="w-4 h-4 text-slate-400" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/30">NEW</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/30">CONTACTED</span>;
      case 'QUALIFIED':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold border border-purple-500/30">QUALIFIED</span>;
      case 'CONVERTED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">CONVERTED</span>;
      case 'FOLLOWUP_REQUIRED':
        return <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/30">FOLLOW-UP</span>;
      case 'LOST':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/30">LOST</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-[#333]">{status}</span>;
    }
  };

  const reloadLeads = () => {
    const token = localStorage.getItem('paramantra_access_token') || '';
    fetchLeads(token, '');
  };

  useEffect(() => {
    reloadLeads();
  }, [fetchLeads]);

  const handleClaim = async (leadId: string) => {
    let agentId = null;
    try {
      const stored = localStorage.getItem('crm_user');
      if (stored) {
        agentId = JSON.parse(stored).agentId;
      }
    } catch (e) {
      console.warn('[UI Exception Swallowed Fixed]:', e);
    }

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
      setToastMessage("Lead claimed! Outbound call initiated.");
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      alert("Failed to claim lead. It might be locked by another agent.");
    }
  };

  const handleCallLead = (lead: any) => {
    setActiveCall({
      callSid: `outbound-${Date.now()}`,
      phone: lead.phoneNumber,
      customerName: lead.customerName,
      category: 'Outbound',
      isCaller: true,
      status: 'RINGING',
      leadId: lead.id,
    });
    setToastMessage(`Initiating outbound call to ${lead.customerName}...`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEditIntake = (lead: any) => {
    setSelectedLeadForIntake(lead);
    setIsIntakeOpen(true);
  };

  const handleOpenManualEntry = () => {
    setSelectedLeadForIntake(null);
    setIsIntakeOpen(true);
  };

  const handleOpenCustomerHistory = (phone: string) => {
    setHistoryPhone(phone);
    setIsHistoryOpen(true);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (!l) return false;
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;

      const q = searchTerm.toLowerCase();
      const name = (l.customerName || '').toLowerCase();
      const phone = (l.phoneNumber || '').toLowerCase();
      const service = (l.primaryService || l.serviceInterest || '').toLowerCase();
      const patient = (l.patientName || '').toLowerCase();
      const summary = (l.enquirySummary || '').toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        service.includes(q) ||
        patient.includes(q) ||
        summary.includes(q)
      );
    });
  }, [leads, searchTerm, statusFilter]);

  return (
    <div className="p-4 md:p-6 bg-[#050505] min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3 px-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Agent Lead Pool
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Lead Data</h1>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Active client enquiries, service requirements, and disposition logs assigned to telecallers.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={reloadLeads}
              className="p-2.5 bg-[#141416] hover:bg-[#1e1e22] text-slate-400 hover:text-white border border-[#222] rounded-xl transition-colors"
              title="Refresh Leads"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
            <button 
              onClick={handleOpenManualEntry}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20"
            >
              <Plus className="w-4 h-4" />
              Manual Enquiry Entry
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#0c0c0e] border border-[#222] p-3 rounded-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              aria-label="Search leads by name, phone, or service" 
              type="text"
              placeholder="Search enquiries by customer name, phone, service, or patient details..."
              className="w-full bg-[#141416] border border-[#222] rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              aria-label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141416] border border-[#222] text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-orange-500"
            >
              <option value="ALL">All Statuses ({leads.length})</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONVERTED">Converted</option>
              <option value="FOLLOWUP_REQUIRED">Follow-up Required</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </div>

        {/* Primary Lead Data Table — 6 Columns */}
        <div className="hidden md:block bg-[#0f0f11] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
          <table aria-label="Lead Data Table" className="w-full text-left text-xs">
            <thead className="bg-[#141416] border-b border-[#222] text-slate-400 uppercase font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Enquiry Name</th>
                <th scope="col" className="px-5 py-3.5">What Are They Looking For?</th>
                <th scope="col" className="px-5 py-3.5">Contact</th>
                <th scope="col" className="px-5 py-3.5">Source</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e22]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading structured lead records...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-300">No lead records found</p>
                    <p className="text-[11px] text-slate-500 mt-1">Try clearing your filters or create a new structured enquiry.</p>
                  </td>
                </tr>
              ) : filteredLeads.map((lead) => {
                const serviceLabel = lead.primaryService || lead.serviceInterest || null;
                const subServices = lead.subServices || [];
                const summaryText = lead.enquirySummary || (serviceLabel ? `Service: ${serviceLabel}` : 'Details not recorded');

                return (
                  <tr key={lead.id} className="hover:bg-[#141416]/80 transition-colors group">
                    {/* Enquiry Name */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">
                          {lead.customerName || 'Unknown Contact'}
                        </span>
                        {lead.patientName && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <HeartPulse className="w-3 h-3 text-rose-400" />
                            Patient: <strong className="text-slate-300">{lead.patientName}</strong>
                            {lead.patientAge ? ` (${lead.patientAge} yrs)` : ''}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Created: {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* What Are They Looking For? */}
                    <td className="px-5 py-4 max-w-md">
                      {summaryText === 'Details not recorded' ? (
                        <span className="text-slate-500 italic text-xs">Details not recorded</span>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {serviceLabel && (
                              <span className="px-2.5 py-0.5 rounded-md bg-orange-950/40 text-orange-400 text-[11px] font-semibold border border-orange-500/30">
                                {serviceLabel}
                              </span>
                            )}
                            {lead.careDurationCategory && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-300 text-[10px] font-medium border border-purple-500/30">
                                {lead.careDurationCategory}
                              </span>
                            )}
                            {lead.careSchedule && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-950/40 text-blue-300 text-[10px] font-medium border border-blue-500/30">
                                {lead.careSchedule}
                              </span>
                            )}
                          </div>

                          {subServices.length > 0 && (
                            <p className="text-[11px] text-slate-300 truncate font-medium">
                              Req: <span className="text-slate-400">{subServices.join(', ')}</span>
                            </p>
                          )}

                          {lead.patientConditions && (
                            <p className="text-[10px] text-slate-400 truncate">
                              Cond: {lead.patientConditions}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 font-mono">
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-semibold">{lead.phoneNumber}</span>
                        {lead.email && <span className="text-[10px] text-slate-500">{lead.email}</span>}
                        {lead.cityDistrict && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {lead.cityDistrict}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {getSourceIcon(lead.source)}
                        <span className="text-xs text-slate-300">{lead.source || 'Website'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {getStatusBadge(lead.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View/Edit Structured Intake */}
                        <button
                          onClick={() => handleOpenEditIntake(lead)}
                          className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#222] text-slate-300 hover:text-white border border-[#2a2a2d] hover:border-orange-500/40 transition-colors"
                          title="View / Edit Enquiry Details"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                        </button>

                        {/* Customer History Drawer */}
                        <button
                          onClick={() => handleOpenCustomerHistory(lead.phoneNumber)}
                          className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#222] text-slate-300 hover:text-white border border-[#2a2a2d] hover:border-blue-500/40 transition-colors"
                          title="Customer Call History & Messaging Timeline"
                        >
                          <History className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {/* Call / Claim */}
                        {lead.status === 'NEW' ? (
                          <button
                            onClick={() => handleClaim(lead.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm shadow-orange-600/20"
                            title="Claim and Call"
                          >
                            <Phone className="w-3 h-3" />
                            Claim
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCallLead(lead)}
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
                            title="Call Lead"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-12 bg-[#111] border border-[#222] rounded-2xl text-slate-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 bg-[#111] border border-[#222] rounded-2xl text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-300">No leads found</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-[#0f0f11] border border-[#222] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-white">{lead.customerName}</h3>
                    <p className="font-mono text-xs text-slate-400">{lead.phoneNumber}</p>
                    {lead.patientName && (
                      <p className="text-[11px] text-rose-400 mt-0.5">Patient: {lead.patientName}</p>
                    )}
                  </div>
                  <div>{getStatusBadge(lead.status)}</div>
                </div>

                <div className="bg-[#141416] p-2.5 rounded-xl border border-[#222] text-[11px] space-y-1">
                  <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                    What Are They Looking For?
                  </span>
                  <p className="text-slate-200">
                    {lead.enquirySummary || lead.primaryService || 'Details not recorded'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1e1e22]">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {getSourceIcon(lead.source)}
                    <span>{lead.source || 'Website'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditIntake(lead)}
                      className="px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#333] hover:border-orange-500/40 text-xs text-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCallLead(lead)}
                      className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Structured Intake Form Modal (Manual Entry or Edit Lead) */}
      {isIntakeOpen && (
        <CallIntakeFormModal
          isOpen={isIntakeOpen}
          onClose={() => {
            setIsIntakeOpen(false);
            setSelectedLeadForIntake(null);
          }}
          leadId={selectedLeadForIntake?.id}
          customerName={selectedLeadForIntake?.customerName}
          phoneNumber={selectedLeadForIntake?.phoneNumber}
          initialData={selectedLeadForIntake}
          onSuccess={() => {
            reloadLeads();
            setToastMessage("Enquiry intake saved and persisted successfully.");
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Customer History Drawer */}
      <CustomerHistoryDrawer
        identifier={historyPhone}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryPhone(null);
        }}
      />
    </div>
  );
}
