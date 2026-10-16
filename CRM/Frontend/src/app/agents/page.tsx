"use client";

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Loader2 } from 'lucide-react';
import { AgentsTable } from '@/components/agents/AgentsTable';
import { AddAgentModal } from '@/components/agents/AddAgentModal';
import { apiFetch } from '@/lib/api';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await apiFetch(`/api/v1/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Failed to fetch agents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 h-full flex flex-col overflow-y-auto custom-scrollbar relative">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Users className="text-primary w-6 h-6" /> Agents Management
          </h1>
          <p className="text-sm text-slate-500">Manage support agents, roles, and access credentials</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 shadow-lg shadow-primary/20 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Agent
        </button>
      </header>

      <div className="bg-[#050505] border border-[#222] rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div className="relative group w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input aria-label="Search agents" type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-[#333] focus:border-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 border border-[#333] text-slate-400 hover:text-white hover:bg-[#111] rounded-lg transition-colors flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Loading agents...</p>
            </div>
          ) : (
            <AgentsTable agents={filteredAgents} onRefresh={fetchAgents} />
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <AddAgentModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchAgents();
          }}
        />
      )}
    </div>
  );
}
