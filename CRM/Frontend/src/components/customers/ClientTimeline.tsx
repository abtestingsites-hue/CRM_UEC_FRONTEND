import React, { useEffect, useState } from 'react';
import { Phone, MessageCircle, Calendar, FileText, Activity, User, Briefcase, Mail, Filter } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  department: string | null;
  communication: string | null;
  status: string;
  source: string;
  createdAt: string;
  user: { name: string; id: string } | null;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'ENQUIRY_CREATED': return <User className="w-5 h-5 text-blue-500" />;
    case 'ASSIGNED': return <Briefcase className="w-5 h-5 text-purple-500" />;
    case 'AI_BOT_CALL': return <Phone className="w-5 h-5 text-indigo-500" />;
    case 'FOLLOW_UP': return <MessageCircle className="w-5 h-5 text-green-500" />;
    case 'CALL': return <Phone className="w-5 h-5 text-blue-500" />;
    case 'MEETING': return <Calendar className="w-5 h-5 text-yellow-500" />;
    case 'QUOTATION': return <FileText className="w-5 h-5 text-orange-500" />;
    case 'EMAIL': return <Mail className="w-5 h-5 text-red-500" />;
    default: return <Activity className="w-5 h-5 text-slate-400" />;
  }
};

export const ClientTimeline = ({ entityId, type = 'lead' }: { entityId: string, type?: 'lead' | 'customer' }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const { socket } = useSocket();

  const filters = ['All', 'Calls', 'WhatsApp', 'Email', 'Meetings', 'Notes', 'System'];

  const API_URL = process.env.NEXT_PUBLIC_API_URL 
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/') ? process.env.NEXT_PUBLIC_API_URL.slice(0, -1) : process.env.NEXT_PUBLIC_API_URL)
    : `${API_BASE_URL}`;

  useEffect(() => {
    if (!entityId) return;
    const fetchTimeline = async () => {
      try {
        const response = await apiFetch(`${API_URL}/timeline/${entityId}?type=${type}`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();

    const handleActionCompleted = (e: CustomEvent) => {
      if (e.detail === entityId || !e.detail) {
        fetchTimeline();
      }
    };

    window.addEventListener('lead-action-completed', handleActionCompleted as EventListener);
    
    const handleRemoteAction = () => {
      fetchTimeline();
    };

    if (socket) {
      socket.emit('joinLeadRoom', entityId);
      socket.on('lead-action-completed', handleRemoteAction);
    }

    return () => {
      window.removeEventListener('lead-action-completed', handleActionCompleted as EventListener);
      if (socket) {
        socket.emit('leaveLeadRoom', entityId);
        socket.off('lead-action-completed', handleRemoteAction);
      }
    };
  }, [entityId, type, API_URL, socket]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading timeline history...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>No timeline events recorded yet.</p>
      </div>
    );
  }

  const filteredEvents = events.filter(e => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Calls' && e.eventType.includes('CALL')) return true;
    if (activeFilter === 'WhatsApp' && e.title.includes('WhatsApp')) return true;
    if (activeFilter === 'Email' && e.eventType.includes('EMAIL')) return true;
    if (activeFilter === 'Meetings' && e.eventType.includes('MEETING')) return true;
    if (activeFilter === 'Notes' && e.eventType.includes('NOTE')) return true;
    if (activeFilter === 'System' && e.user == null) return true;
    return false;
  });

  return (
    <div className="flex flex-col h-full w-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide shrink-0">
        <div className="bg-[#222] p-2 rounded-lg flex items-center justify-center shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
        </div>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                : 'bg-[#1a1a1a] text-slate-400 hover:text-white border border-[#333]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="relative border-l border-slate-700 ml-4 md:ml-6 space-y-8 py-4 flex-1 overflow-y-auto pr-2">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No matching events found.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="relative pl-6 md:pl-8 group">
          {/* Timeline Node */}
          <div className="absolute -left-3.5 md:-left-3.5 bg-[#111] p-1 rounded-full border border-slate-700 z-10 transition-transform group-hover:scale-110">
            {getEventIcon(event.eventType)}
          </div>
          
          {/* Content Card */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 md:p-5 shadow-sm hover:border-primary/50 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                {event.title}
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${event.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {event.status}
                </span>
              </h4>
              <span className="text-xs font-mono text-slate-400">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>
            
            {event.description && (
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium border-t border-[#333] pt-3 mt-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <User className="w-3.5 h-3.5" />
                <span>{event.user?.name || 'System / Auto'}</span>
              </div>
              {event.department && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{event.department}</span>
                </div>
              )}
              {event.communication && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{event.communication}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        ))
      )}
      </div>
    </div>
  );
};
