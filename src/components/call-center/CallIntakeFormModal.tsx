"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Phone, HeartPulse, MapPin, Calendar, Clock, 
  Save, AlertCircle, ShieldAlert, Check, RefreshCw, FileText, CheckCircle2,
  Square, CheckSquare, Sparkles, User
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CallIntakeFormModalProps {
  callSid: string;
  customerName?: string;
  phoneNumber?: string;
  leadId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CallIntakeFormModal({
  callSid,
  customerName = '',
  phoneNumber = '',
  leadId,
  isOpen,
  onClose,
  onSuccess,
}: CallIntakeFormModalProps) {
  // Service catalog state
  const [foundations, setFoundations] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [careConfig, setCareConfig] = useState<any>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Form Fields
  const [enquirerName, setEnquirerName] = useState(customerName);
  const [phone, setPhone] = useState(phoneNumber);
  const [email, setEmail] = useState('');
  const [selectedFoundation, setSelectedFoundation] = useState('UEC');
  const [enquiryCategory, setEnquiryCategory] = useState('SERVICE_ENQUIRY');
  const [primaryService, setPrimaryService] = useState('');
  const [selectedSubServices, setSelectedSubServices] = useState<string[]>([]);

  // Patient Fields
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientConditions, setPatientConditions] = useState('');
  const [patientMobility, setPatientMobility] = useState('Needs Partial Assistance (Walker / Cane)');

  // Duration & Schedule
  const [engagementType, setEngagementType] = useState('Regular Daily Care');
  const [careDurationCategory, setCareDurationCategory] = useState('SHORT_TERM');
  const [careDuration, setCareDuration] = useState('7 days');
  const [careSchedule, setCareSchedule] = useState('12-hour care (Day shift: 8 AM - 8 PM)');

  // Location / Ambulance
  const isAmbulance = selectedFoundation === 'AMBULANCE' || primaryService.toLowerCase().includes('ambulance');
  const [serviceAddress, setServiceAddress] = useState('');
  const [cityDistrict, setCityDistrict] = useState('Chennai');
  const [postalCode, setPostalCode] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');

  // Live Notes Auto-Save
  const [liveNotesText, setLiveNotesText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'FAILED'>('IDLE');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Follow-up and disposition
  const [callOutcome, setCallOutcome] = useState('COMPLETED');
  const [followupDate, setFollowupDate] = useState('');
  const [callbackRequired, setCallbackRequired] = useState(false);
  const [callbackPriority, setCallbackPriority] = useState('NORMAL');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load catalog
  useEffect(() => {
    async function fetchCatalog() {
      try {
        setIsLoadingCatalog(true);
        const res = await apiFetch(`/api/v1/enquiry/catalog`);
        if (res.ok) {
          const data = await res.json();
          setFoundations(data.foundations || []);
          setCatalogItems(data.items || []);
          setCareConfig(data.config || null);
        }
      } catch (e) {
        console.error('Failed to load catalog in intake form:', e);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    if (isOpen) fetchCatalog();
  }, [isOpen]);

  // Pre-fill phone and name if provided
  useEffect(() => {
    if (customerName && !enquirerName) setEnquirerName(customerName);
    if (phoneNumber && !phone) setPhone(phoneNumber);
  }, [customerName, phoneNumber]);

  // Live notes debounced auto-save
  useEffect(() => {
    if (!liveNotesText || !callSid) return;
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);

    setSaveStatus('SAVING');
    notesTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/v1/enquiry/live-notes/call/${callSid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: liveNotesText,
            authorName: 'Agent',
          }),
        });
        if (res.ok) {
          setSaveStatus('SAVED');
          setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } else {
          setSaveStatus('FAILED');
        }
      } catch (e) {
        setSaveStatus('FAILED');
      }
    }, 800);

    return () => {
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    };
  }, [liveNotesText, callSid]);

  if (!isOpen) return null;

  // Filter services for chosen foundation
  const currentFoundationObj = foundations.find(f => f.key === selectedFoundation);
  const foundationServices = currentFoundationObj?.services || catalogItems.filter(i => i.foundationKey === selectedFoundation);

  // Submit complete call intake
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        leadId: leadId || undefined,
        enquirerName,
        phone,
        email: email || undefined,
        foundation: selectedFoundation,
        enquiryCategory,
        primaryService,
        subServices: selectedSubServices,
        patientName: patientName || undefined,
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientConditions: patientConditions || undefined,
        patientMobility,
        engagementType,
        careDurationCategory,
        careDuration,
        careSchedule,
        serviceAddress: isAmbulance ? undefined : serviceAddress,
        cityDistrict: isAmbulance ? undefined : cityDistrict,
        postalCode: isAmbulance ? undefined : postalCode,
        pickupLocation: isAmbulance ? pickupLocation : undefined,
        destinationLocation: isAmbulance ? destinationLocation : undefined,
        liveNotes: liveNotesText,
        callOutcome,
        followupDate: followupDate ? new Date(followupDate).toISOString() : undefined,
        callbackRequired,
        callbackPriority,
      };

      const res = await apiFetch(`/api/v1/enquiry/calls/${callSid}/intake`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to persist call intake form.');
      }
    } catch (e: any) {
      console.error('Call intake submit error:', e);
      setErrorMessage('Network error persisting call intake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0b1015] border border-[#1e2933] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-4 px-6 border-b border-[#1e2933] bg-[#0f171f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Call Intake & Structured Disposition</h3>
              <p className="text-[11px] text-slate-400">Call ID: {callSid.slice(0, 24)}... • Direct CRM Database Record</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#16212b] hover:bg-[#202f3d] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ambulance Emergency Alert */}
          {isAmbulance && (
            <div className="p-3 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-200 flex items-center gap-2.5 shadow-lg animate-pulse">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-[11px]">
                <strong className="text-white uppercase">EMERGENCY PRIORITY LOCKED:</strong> An Ambulance service is selected. Please also trigger local emergency ambulance services (108) immediately.
              </div>
            </div>
          )}

          {/* 1. CONTACT & FOUNDATION DETAILS */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1b2631] pb-1">
              1. Contact & Foundation Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Enquirer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Caller or contact name"
                  value={enquirerName}
                  onChange={(e) => setEnquirerName(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Primary Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="contact@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Foundation / Service Provider</label>
                <select
                  value={selectedFoundation}
                  onChange={(e) => {
                    setSelectedFoundation(e.target.value);
                    setPrimaryService('');
                    setSelectedSubServices([]);
                  }}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white font-medium outline-none focus:border-emerald-500"
                >
                  {foundations.map((f) => (
                    <option key={f.key} value={f.key}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Enquiry Category</label>
                <select
                  value={enquiryCategory}
                  onChange={(e) => setEnquiryCategory(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white font-medium outline-none focus:border-emerald-500"
                >
                  <option value="SERVICE_ENQUIRY">Service Enquiry</option>
                  <option value="JOB_ENQUIRY">Job Enquiry / Careers</option>
                  <option value="VOLUNTEER_ENQUIRY">Volunteer Enquiry</option>
                  <option value="DONOR_ENQUIRY">Donor Enquiry</option>
                  <option value="GENERAL_ENQUIRY">General Enquiry</option>
                  <option value="COMPLAINT_OR_SUPPORT">Complaint / Support</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. SERVICE CATALOG SELECTION */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1b2631] pb-1">
              2. Requested Services ({selectedFoundation})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1.5 bg-[#0e161d] border border-[#1c2936] rounded-xl">
              {foundationServices.map((service: any) => {
                const isSelected = primaryService === service.name;
                return (
                  <div
                    key={service.id || service.name}
                    onClick={() => {
                      if (primaryService === service.name) {
                        setPrimaryService('');
                        setSelectedSubServices([]);
                      } else {
                        setPrimaryService(service.name);
                        if (service.subServices) setSelectedSubServices(service.subServices);
                      }
                    }}
                    className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#121b24] border-transparent hover:border-[#27394a] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                      <span className="font-semibold text-xs">{service.name}</span>
                    </div>
                    {service.isEmergency && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/30">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. PATIENT / ELDER & CLINICAL REQUIREMENTS */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1b2631] pb-1">
              3. Patient / Elder Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Meenakshi Ammal"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Age</label>
                <input
                  type="number"
                  placeholder="e.g. 74"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Health Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Post-stroke paralysis, bed sore stage 2"
                  value={patientConditions}
                  onChange={(e) => setPatientConditions(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mobility Requirements</label>
                <select
                  value={patientMobility}
                  onChange={(e) => setPatientMobility(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="Fully Independent">Fully Independent</option>
                  <option value="Needs Partial Assistance (Walker / Cane)">Needs Partial Assistance (Walker / Cane)</option>
                  <option value="Wheelchair Bound">Wheelchair Bound</option>
                  <option value="Bedridden (Requires Complete Assistance)">Bedridden (Requires Complete Assistance)</option>
                </select>
              </div>
            </div>

            {/* Duration & Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Engagement Type</label>
                <select
                  value={engagementType}
                  onChange={(e) => setEngagementType(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="One-time Care">One-time Care</option>
                  <option value="Regular Daily Care">Regular Daily Care</option>
                  <option value="Day Care / Day Scholar">Day Care / Day Scholar</option>
                  <option value="Residential Care">Residential Care</option>
                  <option value="Shift-based Care">Shift-based Care</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Duration Category</label>
                <select
                  value={careDurationCategory}
                  onChange={(e) => setCareDurationCategory(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="DAY_CARE">Day Care (Single day / scholar)</option>
                  <option value="SHORT_TERM">Short-term Care (&le; 30 days)</option>
                  <option value="LONG_TERM">Long-term Care (&gt; 30 days)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Care Schedule</label>
                <select
                  value={careSchedule}
                  onChange={(e) => setCareSchedule(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="12-hour care (Day shift: 8 AM - 8 PM)">12h Day Shift (8 AM - 8 PM)</option>
                  <option value="12-hour care (Night shift: 8 PM - 8 AM)">12h Night Shift (8 PM - 8 AM)</option>
                  <option value="24-hour care (Full-day live-in)">24h Live-in Attendant</option>
                  <option value="Daytime schedule">Daytime Schedule</option>
                  <option value="Night-time schedule">Night-time Schedule</option>
                  <option value="Custom shift">Custom Shift</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. LOCATION DETAILS (HOME CARE vs AMBULANCE) */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1b2631] pb-1">
              4. Service Location
            </h4>

            {isAmbulance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <div>
                  <label className="text-[10px] font-bold uppercase text-rose-300 block mb-1">Ambulance Pickup Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Patient pickup address / landmark"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-rose-300 block mb-1">Destination Hospital</label>
                  <input
                    type="text"
                    placeholder="Destination clinic or hospital name"
                    value={destinationLocation}
                    onChange={(e) => setDestinationLocation(e.target.value)}
                    className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Service Address</label>
                  <input
                    type="text"
                    placeholder="Street, flat/door number, landmark"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">City / District</label>
                  <input
                    type="text"
                    placeholder="City name"
                    value={cityDistrict}
                    onChange={(e) => setCityDistrict(e.target.value)}
                    className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. LIVE NOTES AUTO-SAVING */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                5. Live Call Notes (Incremental Auto-Save)
              </h4>
              <div className="text-[10px]">
                {saveStatus === 'SAVING' && <span className="text-amber-400 animate-pulse flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Auto-saving...</span>}
                {saveStatus === 'SAVED' && <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved {lastSavedAt}</span>}
                {saveStatus === 'FAILED' && <span className="text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Save failed</span>}
              </div>
            </div>

            <textarea
              rows={3}
              value={liveNotesText}
              onChange={(e) => setLiveNotesText(e.target.value)}
              placeholder="Record live notes while speaking with customer... Notes are streamed to the call session record."
              className="w-full bg-[#121b24] border border-[#233342] rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          {/* 6. DISPOSITION & FOLLOW-UP */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1b2631] pb-1">
              6. Call Outcome & Scheduled Follow-up
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Call Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="COMPLETED">Enquiry Completed / Order Placed</option>
                  <option value="FOLLOWUP_NEEDED">Follow-up Needed (Interested)</option>
                  <option value="CALLBACK_REQUESTED">Callback Requested by Customer</option>
                  <option value="PRICE_NEGOTIATION">Price / Package Negotiation</option>
                  <option value="UNANSWERED">Call Unanswered / Voicemail</option>
                  <option value="CANCELLED">Customer Cancelled Enquiry</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Schedule Follow-up Date & Time</label>
                <input
                  type="datetime-local"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full bg-[#121b24] border border-[#233342] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-[#1e2933] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#16212b] hover:bg-[#202f3d] text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Intake...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Persist Intake
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
