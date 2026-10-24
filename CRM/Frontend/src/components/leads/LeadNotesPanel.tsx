import React, { useEffect, useState } from 'react';
import { Send, User, Calendar, Briefcase, PhoneCall, Edit2, History } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useSocket } from '@/providers/SocketProvider';
import { apiFetch, API_BASE_URL } from '@/lib/api';

interface LeadNote {
  id: string;
  content: string;
  agent: { name: string; department: string | null } | null;
  department: string | null;
  createdAt: string;
  callId: string | null;
  actionType: string | null;
  source: string;
  isCorrection: boolean;
  correctedNoteId: string | null;
  corrections?: LeadNote[];
}

export const LeadNotesPanel = ({ leadId }: { leadId: string }) => {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [correctingNoteId, setCorrectingNoteId] = useState<string | null>(null);
  const { socket } = useSocket();

  const API_URL = process.env.NEXT_PUBLIC_API_URL 
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/') ? process.env.NEXT_PUBLIC_API_URL.slice(0, -1) : process.env.NEXT_PUBLIC_API_URL)
    : `${API_BASE_URL}`;

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('paramantra_access_token') || '';
      const response = await apiFetch(`${API_URL}/leads/${leadId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch lead notes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchNotes();

    const handleActionCompleted = (e: CustomEvent) => {
      if (e.detail === leadId || !e.detail) {
        fetchNotes();
      }
    };

    window.addEventListener('lead-action-completed', handleActionCompleted as EventListener);
    
    const handleRemoteAction = () => {
      fetchNotes();
    };

    if (socket) {
      socket.emit('joinLeadRoom', leadId);
      socket.on('lead-action-completed', handleRemoteAction);
    }

    return () => {
      window.removeEventListener('lead-action-completed', handleActionCompleted as EventListener);
      if (socket) {
        socket.emit('leaveLeadRoom', leadId);
        socket.off('lead-action-completed', handleRemoteAction);
      }
    };
  }, [leadId, API_URL, socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('paramantra_access_token') || '';
      
      const endpoint = correctingNoteId 
        ? `${API_URL}/leads/${leadId}/notes/${correctingNoteId}/correction`
        : `${API_URL}/leads/${leadId}/notes`;

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newNote })
      });
      if (response.ok) {
        setNewNote('');
        setCorrectingNoteId(null);
        fetchNotes(); // Reload notes
      }
    } catch (error) {
      console.error("Failed to append note:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading notes...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#111] rounded-3xl border border-[#222] overflow-hidden relative">
      <div className="p-5 border-b border-[#222] bg-[#1a1a1a]">
        <h3 className="text-xl font-bold text-white">Leads Notes</h3>
        <p className="text-sm text-slate-400">Permanent, immutable record of agent notes</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.length === 0 ? (
          <div className="text-center p-8 text-slate-500 border border-dashed border-[#333] rounded-xl">
            <p className="text-sm">No notes available for this lead yet.</p>
          </div>
        ) : (
          notes.filter(n => !n.isCorrection).map((note) => (
            <div key={note.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333] relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      {note.agent?.name || 'System'}
                      {note.actionType && (
                        <span className="text-[10px] bg-[#333] px-1.5 py-0.5 rounded text-slate-300 font-normal">
                          {note.actionType}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3" />
                      {note.department || note.agent?.department || 'General'}
                      <span className="mx-1">â€¢</span>
                      Source: {note.source || 'System'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {note.source === 'Manual' && (
                    <button 
                      onClick={() => setCorrectingNoteId(note.id)}
                      className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                      title="Add a correction"
                    >
                      <Edit2 className="w-3 h-3" />
                      Correct
                    </button>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-[#222] mt-2">
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.content}</p>
                {note.callId && (
                  <p className="text-xs text-blue-400 flex items-center gap-1 mt-2 bg-blue-500/10 w-fit px-2 py-1 rounded">
                    <PhoneCall className="w-3 h-3" />
                    Call Logged
                  </p>
                )}
              </div>
              
              {/* Render Corrections if they exist */}
              {notes.filter(c => c.correctedNoteId === note.id).map(correction => (
                <div key={correction.id} className="mt-3 ml-4 pl-3 border-l-2 border-blue-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <History className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400 font-semibold">Correction</span>
                    <span className="text-[10px] text-slate-500">
                      by {correction.agent?.name || 'System'} at {new Date(correction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 italic">{correction.content}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-[#1a1a1a] border-t border-[#222]">
        {correctingNoteId && (
          <div className="mb-2 flex items-center justify-between text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md">
            <span>You are adding a correction.</span>
            <button type="button" onClick={() => setCorrectingNoteId(null)} className="text-slate-400 hover:text-white">Cancel</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea aria-label="Add a note for this lead"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={correctingNoteId ? "Type correction here..." : "Type a new audit note here..."}
            className="flex-1 bg-[#111] border border-[#333] rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-blue-500 transition-colors h-12"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit" 
            aria-label="Submit note"
            disabled={!newNote.trim() || submitting}
            className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
              !newNote.trim() || submitting
                ? 'bg-[#222] text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
