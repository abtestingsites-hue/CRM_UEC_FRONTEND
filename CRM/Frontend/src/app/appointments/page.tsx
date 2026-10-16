"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Plus, ChevronLeft, ChevronRight, Check, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda' | 'timeline'>('week');
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('crm_user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setIsSuperAdmin(userObj.role === 'SUPER_ADMIN' || userObj.name?.toLowerCase() === 'raghav');
        } catch (e) {
          setIsSuperAdmin(true);
        }
      } else {
        setIsSuperAdmin(true);
      }
    }
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      const res = await apiFetch(`/api/v1/appointments/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const userStr = localStorage.getItem('crm_user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const isAdmin = userObj.role === 'SUPER_ADMIN' || userObj.name?.toLowerCase() === 'raghav';
        if (!isAdmin) return; // Skip fetching for agents without permissions to avoid 403
      }

      const token = localStorage.getItem('paramantra_access_token');
      const res = await apiFetch(`/api/v1/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming data is an array of leads. Map them to customer format.
        const uniques = Array.from(new Set(data.map((lead: any) => JSON.stringify({ id: lead.id, name: lead.name }))));
        setCustomers(uniques.map((c: any) => JSON.parse(c)));
      }
    } catch (e) {
      console.warn('Failed to fetch customers/leads', e);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchCustomers();
  }, [currentDate]);

  const handlePrevDate = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNextDate = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleCreateEvent = async (data: any) => {
    try {
      const userStr = localStorage.getItem('crm_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const duration = Math.max(30, Math.floor((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000));
      
      const res = await apiFetch(`/api/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          appointmentType: data.type,
          customerId: data.customerId,
          date: new Date(data.startTime).toISOString(),
          startTime: new Date(data.startTime).toISOString(),
          duration: duration,
          assignedAgentId: user?.id,
          doctorId: user?.id,
          bookingSource: 'AGENT',
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        reset();
        fetchEvents();
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Failed to create appointment:', errJson);
        alert(errJson.error || 'Failed to create appointment');
      }
    } catch (e: any) {
      console.error('Error creating appointment:', e);
      alert(e.message || 'Error creating appointment');
    }
  };

  // Color Mapping Helper
  const getTypeStyle = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'MEETING':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'CALL':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'FOLLOW_UP':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'REMINDER':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'VISIT':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'DEMO':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
      case 'INTERVIEW':
        return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
      case 'EVENT':
        return 'bg-pink-500/10 border-pink-500/20 text-pink-400';
      case 'HOLIDAY':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    }
  };

  // Calendar Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Week View dates array builder
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="flex-1 p-6 h-full flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
     <CalendarIcon className="text-orange-500 w-6 h-6" /> Appointment Management
   </h1>
          <p className="text-sm text-slate-500">Coordinate and manage calendar slots, reminders, and patient events</p>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Calendar Selector Views */}
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] p-0.5 rounded-lg flex flex-wrap gap-0.5">
            {[
              { key: 'month', label: 'Monthly View' },
              { key: 'week', label: 'Weekly View' },
              { key: 'day', label: 'Daily View' },
              { key: 'agenda', label: 'List View' }
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-all ${view === v.key ? 'bg-orange-600 text-white shadow-md shadow-orange-600/10' : 'text-slate-500 hover:text-white'
                  }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,88,12,0.15)] transition-all"
            >
              <Plus className="w-4 h-4" /> Book Slot
            </button>
          )}
        </div>
      </header>

      {/* Date Navigator Header */}
      <div className="flex items-center justify-between mb-4 bg-[#0d0d0d] border border-[#1e1e1e] p-4 rounded-xl shrink-0">
        <h2 className="text-md font-bold tracking-tight">
          {view === 'month' && `${monthNames[month]} ${year}`}
          {view === 'week' && `Week of ${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
          {view === 'day' && currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {view === 'agenda' && "Full Call & Event Agenda"}
          {view === 'timeline' && `Operational Activity Flow: ${currentDate.toLocaleDateString()}`}
        </h2>
        <div className="flex items-center gap-2">
          <button aria-label="Previous date" onClick={handlePrevDate} className="p-1.5 bg-[#141414] hover:bg-[#202020] border border-[#262626] rounded-lg text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-[#141414] hover:bg-[#202020] border border-[#262626] rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
            Today
          </button>
          <button aria-label="Next date" onClick={handleNextDate} className="p-1.5 bg-[#141414] hover:bg-[#202020] border border-[#262626] rounded-lg text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT BODY */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {isLoading ? (
          <div className="absolute inset-0 bg-[#050505]/50 flex items-center justify-center text-slate-500 z-10">
            <span className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mr-3"></span>
            Loading schedules...
          </div>
        ) : null}

        {/* 1. MONTH VIEW */}
        {view === 'month' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-5">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 gap-2 overflow-y-auto custom-scrollbar">
              {blanksArray.map((i) => (
                <div key={`blank-${i}`} className="bg-[#121212]/30 border border-transparent rounded-lg min-h-[95px]"></div>
              ))}
              {daysArray.map((day) => {
                const matchedEvents = events.filter((e) => {
                  const eventDate = new Date(e.startTime);
                  return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
                });

                return (
                  <div key={day} className="bg-[#121212] border border-[#1c1c1c] hover:border-orange-500/30 rounded-lg p-2 min-h-[95px] flex flex-col transition-all">
                    <span className="text-[10px] font-bold text-slate-500 self-end mb-1">{day}</span>
                    <div className="mt-1 space-y-1.5 overflow-y-auto max-h-[65px] custom-scrollbar flex-1">
                      {matchedEvents.map((evt) => (
                        <div key={evt.id} className={`text-[9px] border px-2 py-0.5 rounded font-bold truncate ${getTypeStyle(evt.type)}`} title={`${evt.title} (${evt.type})`}>
                          {evt.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. WEEK VIEW */}
        {view === 'week' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-5">
            <div className="grid grid-cols-7 gap-3 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, index) => (
                <div key={d} className="flex flex-col">
                  <span>{d}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{weekDays[index].getDate()}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 gap-3 overflow-y-auto custom-scrollbar">
              {weekDays.map((dateObj, idx) => {
                const matchedEvents = events.filter((e) => {
                  const eventDate = new Date(e.startTime);
                  return eventDate.getDate() === dateObj.getDate() && eventDate.getMonth() === dateObj.getMonth() && eventDate.getFullYear() === dateObj.getFullYear();
                });

                return (
                  <div key={idx} className="bg-[#121212] border border-[#1c1c1c] rounded-lg p-3 min-h-[300px] flex flex-col">
                    <div className="mt-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                      {matchedEvents.map((evt) => (
                        <div key={evt.id} className={`text-[10px] border p-2.5 rounded-lg flex flex-col gap-1.5 font-bold ${getTypeStyle(evt.type)}`}>
     <span className="truncate text-[9px] text-white/50">{evt.bookingId || ''}</span>
     <span className="truncate">{evt.title}</span>
     <span className="truncate text-[9px]">{evt.customer?.name || evt.lead?.customerName || 'No Patient Linked'}</span>
     <span className="text-[8px] opacity-80 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {evt.status}</span>
   </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. DAY VIEW */}
        {view === 'day' && (
          <div className="flex-1 overflow-y-auto bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-6 custom-scrollbar">
            <div className="space-y-4">
              {Array.from({ length: 10 }, (_, i) => 9 + i).map((hour) => {
                const matchedEvents = events.filter((e) => {
                  const eventDate = new Date(e.startTime);
                  const matchesDay = eventDate.getDate() === currentDate.getDate() && eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
                  const matchesHour = eventDate.getHours() === hour;
                  return matchesDay && matchesHour;
                });

                return (
                  <div key={hour} className="flex gap-4 border-b border-[#1c1c1c]/40 pb-3">
                    <span className="w-16 text-xs text-slate-500 font-bold self-start mt-1">{hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}</span>
                    <div className="flex-1 space-y-2">
                      {matchedEvents.length === 0 ? (
                        <div className="h-6 border border-dashed border-[#222] rounded-md"></div>
                      ) : (
                        matchedEvents.map((evt) => (
                          <div key={evt.id} className={`p-3 border rounded-xl flex items-center justify-between ${getTypeStyle(evt.type)}`}>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">{evt.title}</span>
                              <span className="text-[10px] opacity-75 flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3" /> {evt.customer?.name || 'Linked Customer'}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold tracking-wider uppercase border border-current px-2 py-0.5 rounded-full">{evt.type}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. AGENDA VIEW */}
        {view === 'agenda' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 tracking-wide uppercase">Scheduled Items Agenda</h3>
            {events.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm">No scheduled events in your agenda list.</div>
            ) : (
              <div className="space-y-3">
                {events.map((evt) => (
                  <div key={evt.id} className={`p-4 border rounded-xl flex items-center justify-between hover:scale-[1.005] transition-all ${getTypeStyle(evt.type)}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg border border-current/10 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{evt.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] opacity-75 mt-1">
                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(evt.startTime).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {evt.customer?.name || 'Customer'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/40 border border-[#222]">{evt.type}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{evt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. TIMELINE VIEW */}
        {view === 'timeline' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-6 tracking-wide uppercase">Operational Day Activity Timeline</h3>
            <div className="relative border-l border-[#262626] ml-4 pl-8 space-y-8">
              {events
                .filter((e) => {
                  const eventDate = new Date(e.startTime);
                  return eventDate.getDate() === currentDate.getDate() && eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
                })
                .map((evt) => (
                  <div key={evt.id} className="relative">
                    {/* Circle Node indicator */}
                    <span className="absolute -left-12.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#121212] border-2 border-orange-500 shadow-md">
                      <Clock className="h-4.5 w-4.5 text-orange-500" />
                    </span>
                    <div className={`p-4 border rounded-xl max-w-xl transition-all ${getTypeStyle(evt.type)}`}>
                      <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest block mb-1">
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <h4 className="font-extrabold text-sm text-white mb-2">{evt.title}</h4>
                      <div className="flex items-center gap-4 text-xs opacity-80">
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Customer: {evt.customer?.name || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category: {evt.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              {events.filter((e) => {
                const eventDate = new Date(e.startTime);
                return eventDate.getDate() === currentDate.getDate() && eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
              }).length === 0 && (
                  <div className="text-slate-500 text-sm py-10">No logs or timelines scheduled for this date. Change dates using navigator.</div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE EVENT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1e1e1e]">
              <h2 className="text-md font-bold text-white">Book Appointment Slot</h2>
              <p className="text-xs text-slate-500 mt-1">Input schedule details to create a new appointment</p>
            </div>
            <form onSubmit={handleSubmit(handleCreateEvent)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Title</label>
                <input aria-label="eg In-Home Medical Visit" type="text" {...register('title')} required placeholder="e.g. In-Home Medical Visit" className="w-full bg-[#141414] border border-[#262626] focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Type</label>
                  <select aria-label="Appointment Type" {...register('type')} required className="w-full bg-[#141414] border border-[#262626] focus:border-orange-500 rounded-lg px-2.5 py-2 text-sm text-white outline-none">
                    <option value="MEETING">Meeting</option>
                    <option value="CALL">Call</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="REMINDER">Reminder</option>
                    <option value="VISIT">Visit</option>
                    <option value="DEMO">Demo</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="EVENT">Event</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link Customer</label>
                  <select aria-label="Select Patient or Customer" {...register('customerId')} required className="w-full bg-[#141414] border border-[#262626] focus:border-orange-500 rounded-lg px-2.5 py-2 text-sm text-white outline-none">
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                  <input aria-label="W full bg 141414 border border 262626 focusborder orange 500 rounded lg px 3 py 2 text xs text white outline none" type="datetime-local" {...register('startTime')} required className="w-full bg-[#141414] border border-[#262626] focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Time</label>
                  <input aria-label="W full bg 141414 border border 262626 focusborder orange 500 rounded lg px 3 py 2 text xs text white outline none" type="datetime-local" {...register('endTime')} required className="w-full bg-[#141414] border border-[#262626] focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e1e]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-[#141414] border border-[#262626] text-white hover:bg-[#202020] rounded-lg text-xs font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.1)]">
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
