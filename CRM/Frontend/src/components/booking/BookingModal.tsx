import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string; // Pre-filled if booking from Customer profile
  agentId?: string; // Doctor/Agent ID if booking from Doctor profile
}

export function BookingModal({ isOpen, onClose, customerId: initialCustomerId, agentId: initialAgentId }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [doctorId, setDoctorId] = useState(initialAgentId || '');
  const [treatment, setTreatment] = useState('');
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
      if (!initialCustomerId) setCustomerId('');
      if (!initialAgentId) setDoctorId('');
      setTreatment('');
      setDate('');
    }
  }, [isOpen, initialCustomerId, initialAgentId]);

  const handleCheckAvailability = async () => {
    if (!doctorId || !date) {
      setError('Please select a doctor and date.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Calls the API gateway / booking service
      const res = await apiFetch(`/appointments/availability?doctorId=${doctorId}&date=${date}&duration=30`);
      if (!res.ok) throw new Error('Failed to fetch availability');
      const data = await res.json();
      setAvailableSlots(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !customerId) {
      setError('Please select a slot and patient.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          doctorId,
          title: `Appointment for ${treatment || 'Consultation'}`,
          treatment,
          date: date,
          startTime: selectedSlot.start,
          duration: 30, // Default duration
          bookingSource: 'HUMAN_AGENT'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to book slot');
      }

      setStep(3); // Success step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {step === 1 && 'Book Appointment'}
            {step === 2 && 'Select Time Slot'}
            {step === 3 && 'Booking Confirmed'}
          </h2>
          <button aria-label="Close dialog" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="booking-patient-id" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Patient ID</label>
                <input id="booking-patient-id" aria-label="Patient ID" 
                  type="text" 
                  value={customerId} 
                  onChange={(e) => setCustomerId(e.target.value)} 
                  disabled={!!initialCustomerId}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="Enter or search patient ID..."
                />
              </div>
              <div>
                <label htmlFor="booking-doctor-id" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Doctor ID</label>
                <input id="booking-doctor-id" aria-label="Doctor ID" 
                  type="text" 
                  value={doctorId} 
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={!!initialAgentId}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  placeholder="Enter doctor ID..."
                />
              </div>
              <div>
                <label htmlFor="booking-treatment" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Treatment / Reason</label>
                <input id="booking-treatment" aria-label="Treatment or Reason" 
                  type="text" 
                  value={treatment} 
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. General Checkup"
                />
              </div>
              <div>
                <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date</label>
                <input id="booking-date" aria-label="Appointment Date" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Available slots for {date}</p>
              {availableSlots.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  No slots available for this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {availableSlots.map((slot, idx) => {
                    const timeString = new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 text-sm rounded-lg border transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105' 
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        {timeString}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                Your appointment has been successfully scheduled and the patient will be notified shortly.
              </p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                Close & Return
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 3 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3">
            <button 
              onClick={() => step === 2 ? setStep(1) : onClose()}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 font-medium shadow-sm"
              disabled={loading}
            >
              {step === 2 ? 'Back' : 'Cancel'}
            </button>
            
            {step === 1 && (
              <button 
                onClick={handleCheckAvailability}
                disabled={loading || !doctorId || !date}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center shadow-sm font-medium"
              >
                {loading ? 'Checking...' : 'Check Availability'}
              </button>
            )}

            {step === 2 && (
              <button 
                onClick={handleConfirmBooking}
                disabled={loading || !selectedSlot}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center shadow-sm font-medium"
              >
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
