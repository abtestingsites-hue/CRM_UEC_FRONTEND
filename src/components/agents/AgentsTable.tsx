import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Shield, Phone, MapPin, Eye, Clock, Users } from 'lucide-react';
import { EditAgentModal } from './EditAgentModal';
import { DeleteAgentModal } from './DeleteAgentModal';

interface AgentsTableProps {
  agents: any[];
  onRefresh: () => void;
}

export function AgentsTable({ agents, onRefresh }: AgentsTableProps) {
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [deletingAgent, setDeletingAgent] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Online</span>;
      case 'OFFLINE': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Offline</span>;
      case 'BUSY': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Busy</span>;
      default: return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500 bg-[#111] uppercase border-b border-[#222] sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-semibold">Agent</th>
              <th className="px-6 py-4 font-semibold">Contact Info</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Joined / Active</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {agents.length > 0 ? agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-[#111] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={agent.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0D8ABC&color=fff`} 
                      alt={agent.name} 
                      className="w-10 h-10 rounded-full border border-[#333]" 
                    />
                    <div>
                      <p className="font-bold text-white">{agent.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {agent.employeeId || 'No Emp ID'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400">
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-300">{agent.user?.email}</p>
                    {agent.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {agent.phone}</p>}
                    {agent.city && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {agent.city}, {agent.country}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium bg-[#222] w-max px-2 py-1 rounded">
                    <Shield className="w-3 h-3 text-primary" />
                    {agent.user?.role || agent.department || 'AGENT'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(agent.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>Joined: {new Date(agent.joinedAt).toLocaleDateString()}</p>
                    <p className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" /> Last Active: {agent.lastActive ? new Date(agent.lastActive).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingAgent(agent)} className="p-2 border border-[#333] text-slate-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingAgent(agent)} className="p-2 border border-rose-500/30 text-rose-500 hover:text-white hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500">
                  <div className="flex flex-col items-center">
                    <Users className="w-12 h-12 mb-4 text-slate-700 opacity-50" />
                    <p className="text-base font-medium text-white mb-1">No agents found</p>
                    <p className="text-sm">Click "Add Agent" to register a new user to the platform.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-4">
        {agents.length > 0 ? agents.map((agent) => (
          <div key={agent.id} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 space-y-3 shadow-sm text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={agent.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0D8ABC&color=fff`} 
                  alt={agent.name} 
                  className="w-10 h-10 rounded-full border border-[#333]" 
                />
                <div>
                  <p className="font-bold text-white">{agent.name}</p>
                  <p className="text-xs text-slate-400">{agent.employeeId || 'No Emp ID'}</p>
                </div>
              </div>
              <div>
                {getStatusBadge(agent.status)}
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] p-3 rounded-xl space-y-1.5 text-xs text-white">
              <p className="font-medium text-primary">{agent.user?.email}</p>
              {agent.phone && (
                <p className="flex items-center gap-1.5 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {agent.phone}
                </p>
              )}
              {agent.city && (
                <p className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {agent.city}, {agent.country}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#222]">
              <span className="flex items-center gap-1.5 text-primary text-xs font-semibold bg-primary/10 px-2.5 py-1 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-primary" />
                {agent.user?.role || agent.department || 'AGENT'}
              </span>
              <span className="text-[10px] text-slate-500">
                Joined: {new Date(agent.joinedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#222]">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Active: {agent.lastActive ? new Date(agent.lastActive).toLocaleDateString() : 'N/A'}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingAgent(agent)} 
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center border border-[#333] hover:bg-[#222] text-slate-400 hover:text-white rounded-xl transition-all shadow-sm"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeletingAgent(agent)} 
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center border border-rose-950 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 rounded-xl transition-all shadow-sm"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-16 bg-[#111] border border-[#222] rounded-2xl text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-base font-medium text-white mb-1">No agents found</p>
          </div>
        )}
      </div>

      {editingAgent && (
        <EditAgentModal 
          agent={editingAgent} 
          onClose={() => setEditingAgent(null)} 
          onSuccess={() => {
            setEditingAgent(null);
            onRefresh();
          }} 
        />
      )}

      {deletingAgent && (
        <DeleteAgentModal 
          agent={deletingAgent} 
          onClose={() => setDeletingAgent(null)} 
          onSuccess={() => {
            setDeletingAgent(null);
            onRefresh();
          }} 
        />
      )}
    </>
  );
}
