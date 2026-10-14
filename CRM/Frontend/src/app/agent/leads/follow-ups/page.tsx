"use client";

import React, { useEffect, useState } from 'react';
import { useLeadStore } from '@/store/useLeadStore';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function LeadFollowUpsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        const res = await apiFetch(`/api/v1/followups`);
        if (!res.ok) throw new Error('Failed to fetch followups');
        const data = await res.json();
        if (Array.isArray(data)) {
          setFollowups(data);
        } else {
          console.error('Expected an array of followups but received:', data);
          setFollowups([]);
        }
      } catch (error) {
        console.error(error);
        setFollowups([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFollowups();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await apiFetch(`/api/v1/followups/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      setFollowups(followups.map(f => f.id === id ? { ...f, status: 'COMPLETED' } : f));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-black min-h-screen md:min-h-0 text-white">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Follow Ups</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your scheduled callbacks and meetings.</p>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading schedule...</div>
          ) : followups.length === 0 ? (
            <div className="text-center py-12 bg-[#111] border border-[#222] rounded-2xl text-slate-500 shadow-sm">
              <CalendarIcon className="w-8 h-8 mx-auto mb-3 opacity-50 text-slate-500" />
              No upcoming followups scheduled.
            </div>
          ) : (
            followups.map(followup => {
              const isCompleted = followup.status === 'COMPLETED';
              const date = new Date(followup.followupDate);

              return (
                <div
                  key={followup.id}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-start gap-4 p-4 md:p-5 rounded-2xl border transition-colors ${isCompleted
                      ? 'bg-[#111] border-[#222] opacity-60'
                      : 'bg-[#1a1a1a] border-[#333] hover:border-[#444] shadow-sm md:shadow-none'
                    }`}
                >
                  {/* Left: Date/Time */}
                  <div className="shrink-0 flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-20 p-3 bg-[#111] rounded-xl border border-[#222]">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      {date.toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black text-white">
                      {date.getDate()}
                    </span>
                    <span className="text-xs text-primary font-bold mt-1">
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Middle: Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{followup.lead?.customerName || 'Unknown Lead'}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${followup.meetingType === 'CALLBACK'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                        {followup.meetingType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-slate-400 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-white">{followup.lead?.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        Assigned: {followup.assignedAgent?.name || 'You'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      {followup.purpose && (
                        <div className="bg-[#111] p-3 rounded-xl border border-[#222]">
                          <p className="text-xs text-slate-500 mb-1">Appointment Purpose</p>
                          <p className="text-sm font-semibold text-slate-300">{followup.purpose}</p>
                        </div>
                      )}
                      {followup.notes && (
                        <div className="bg-[#111] p-3 rounded-xl border border-[#222]">
                          <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                          <p className="text-sm font-semibold text-slate-300">{followup.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-3 sm:pt-0 border-t border-[#222] sm:border-t-0">
                    {!isCompleted ? (
                      <button
                        onClick={() => handleComplete(followup.id)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold transition-all min-h-[48px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 px-4 py-3 text-slate-500 text-sm font-bold bg-transparent rounded-xl min-h-[48px] sm:min-h-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
