"use client";

import React, { useState } from 'react';
import { Ticket, Search, Filter, Plus } from 'lucide-react';
import { CreateTicketModal } from '@/components/tickets/CreateTicketModal';

export default function AgentTickets() {
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar relative">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Ticket className="text-primary w-6 h-6" /> Assigned Tickets
          </h1>
          <p className="text-sm text-slate-500">Manage and resolve tickets assigned to you.</p>
        </div>
        <button onClick={() => setIsCreateTicketModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 shadow-lg shadow-primary/20 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Create Ticket
        </button>
      </header>

      <div className="bg-[#0a0a0a] border border-[#222] rounded-xl flex-1 flex flex-col">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search assigned tickets..." 
              className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none text-white transition-all placeholder-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-[#333] rounded-lg text-slate-400 hover:text-white hover:bg-[#111] transition-colors text-sm">
            <Filter className="w-4 h-4" /> Filter Status
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-16 h-16 rounded-2xl bg-[#111] flex items-center justify-center border border-[#222] mb-4">
            <Ticket className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Tickets</h3>
          <p className="text-slate-500 max-w-md text-center text-sm">
            You currently do not have any unresolved tickets assigned to your queue. Enjoy the quiet time or assist other queues!
          </p>
        </div>
      </div>

      {isCreateTicketModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsCreateTicketModalOpen(false)} 
          onSuccess={() => setIsCreateTicketModalOpen(false)} 
        />
      )}
    </div>
  );
}
