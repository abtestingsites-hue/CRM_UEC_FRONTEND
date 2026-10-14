"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Ticket } from 'lucide-react';
import { CreateTicketModal } from '@/components/tickets/CreateTicketModal';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      // Mock tickets to prevent 404 API calls
      const mockTickets = [
        { id: 'TKT-001', customerName: 'Raghav', status: 'OPEN', priority: 'HIGH', title: 'Need support with login' },
        { id: 'TKT-002', customerName: 'Mani', status: 'RESOLVED', priority: 'NORMAL', title: 'Billing issue' }
      ];
      setTickets(mockTickets);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchTickets();
  };

  return (
    <div className="flex-1 p-6 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Ticket Management</h1>
          <p className="text-sm text-slate-500">Track and resolve customer issues</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-sm">
          Create Ticket
        </button>
      </header>

      <div className="bg-[#050505] border border-[#222] rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div className="relative group w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all text-white placeholder-slate-500"
            />
          </div>
          <button className="p-2 border border-[#333] text-slate-400 hover:text-white hover:bg-[#111] rounded-lg transition-colors flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-slate-500">
               <div className="w-6 h-6 border-2 border-slate-500/20 border-t-slate-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 bg-[#111] uppercase border-b border-[#222] sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold">Ticket ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {tickets.map((ticket, idx) => (
                  <tr key={ticket.id} className="hover:bg-[#111] transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-300">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-slate-500" />
                        {ticket.id.split('-')[0].toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{ticket.customer}</td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{ticket.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        ticket.status === 'OPEN' ? 'bg-primary/10 text-primary border-primary/20' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-[#222] text-slate-300 border-[#333]'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${
                        ticket.priority === 'HIGH' || ticket.priority === 'EMERGENCY' ? 'text-rose-500' :
                        ticket.priority === 'NORMAL' ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{ticket.updated}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-5 h-5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 italic">No tickets found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleCreateSuccess} 
        />
      )}
    </div>
  );
}
