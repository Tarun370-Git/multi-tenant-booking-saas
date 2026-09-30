'use client';

import { useEffect, useState, use } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Scissors, 
  ArrowLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Business, Service, Provider, TimeSlot } from '@/lib/types';

export default function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow Steps: 1 = Service, 2 = Provider, 3 = Date & Slot, 4 = Details, 5 = Confirmation
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Client Details Form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: string; starts_at: string } | null>(null);

  useEffect(() => {
    async function loadPublicData() {
      try {
        setLoading(true);
        const resBiz = await fetch(`/api/public/businesses/${slug}`);
        if (!resBiz.ok) throw new Error('Business not found or inactive');
        const bizData = await resBiz.json();
        setBusiness(bizData);

        const resServices = await fetch(`/api/public/businesses/${slug}/services`);
        if (resServices.ok) {
          const sData = await resServices.json();
          setServices(sData);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load booking page';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, [slug]);

  // Fetch slots whenever service, provider, or date changes
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    async function fetchSlots() {
      try {
        setLoadingSlots(true);
        let url = `/api/public/businesses/${slug}/availability?service_id=${selectedService!.id}&date=${selectedDate}`;
        if (selectedProvider) {
          url += `&provider_id=${selectedProvider.id}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots || []);
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [slug, selectedService, selectedProvider, selectedDate]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot || !clientName || !clientEmail) {
      alert('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/public/businesses/${slug}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          provider_id: selectedSlot.provider_id,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          starts_at: selectedSlot.starts_at,
          ends_at: selectedSlot.ends_at,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Booking failed. Slot may no longer be available.');
        return;
      }

      setConfirmedBooking({
        id: data.booking.id,
        starts_at: data.booking.starts_at,
      });
      setStep(5); // Confirmation
    } catch (err) {
      console.error('Submission error:', err);
      alert('An error occurred during booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full animate-ping opacity-75"></div>
          <p className="text-slate-600 font-medium">Loading booking portal...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Business Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The requested business booking page does not exist.'}</p>
          <a href="/" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Business Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl mb-3">
            <Scissors className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{business.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Book an appointment online • Timezone: {business.timezone}</p>
          {business.phone && <p className="text-xs text-slate-400 mt-1">📞 {business.phone}</p>}
        </div>

        {/* Wizard Progress Bar */}
        {step < 5 && (
          <div className="flex items-center justify-between mb-8 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-600">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-600' : ''}`}>
              <span className="w-5 h-5 rounded-full border flex items-center justify-center font-bold">1</span>
              <span>Service</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-600' : ''}`}>
              <span className="w-5 h-5 rounded-full border flex items-center justify-center font-bold">2</span>
              <span>Date & Time</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-blue-600' : ''}`}>
              <span className="w-5 h-5 rounded-full border flex items-center justify-center font-bold">3</span>
              <span>Details</span>
            </div>
          </div>
        )}

        {/* STEP 1: Select Service */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Select a Service</h2>
            <div className="space-y-3">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => {
                    setSelectedService(srv);
                    setStep(2);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between hover:border-blue-500 hover:shadow-md ${
                    selectedService?.id === srv.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-slate-800">{srv.name}</h3>
                    {srv.description && <p className="text-xs text-slate-500 mt-1">{srv.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {srv.duration_minutes} mins
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-blue-600">
                      ${(srv.price / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Pick Date & Time Slot */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Services
              </button>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {selectedService?.name} • ${(selectedService!.price / 100).toFixed(2)}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-4">Select Date & Time Slot</h2>

            {/* Date Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Time Slot Grid */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Available Slots</label>
              {loadingSlots ? (
                <div className="py-8 text-center text-slate-400 text-sm">Calculating availability...</div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center text-rose-500 text-sm font-medium bg-rose-50 rounded-xl border border-rose-100">
                  No slots available on this date. Please select another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot, i) => {
                    const timeStr = new Date(slot.starts_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: business.timezone,
                    });
                    const isSelected = selectedSlot?.starts_at === slot.starts_at;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              Continue to Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Contact Details & Submit */}
        {step === 3 && (
          <form onSubmit={handleBookingSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Slots
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Contact Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Notes / Preferences</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <textarea
                    rows={2}
                    placeholder="Any specific requests or requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>{selectedService?.name}</span>
                <span>${((selectedService?.price || 0) / 100).toFixed(2)}</span>
              </div>
              <div>
                Date: {selectedDate} at{' '}
                {selectedSlot &&
                  new Date(selectedSlot.starts_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: business.timezone,
                  })}
              </div>
              <div>Duration: {selectedService?.duration_minutes} minutes</div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? 'Confirming Booking...' : 'Confirm & Complete Booking'}
            </button>
          </form>
        )}

        {/* STEP 5: Confirmation Screen */}
        {step === 5 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Booking Confirmed!</h2>
            <p className="text-slate-600 text-sm mb-6">
              Thank you, <span className="font-bold text-slate-800">{clientName}</span>. Your appointment has been booked.
            </p>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left mb-6 space-y-3">
              <div className="flex justify-between border-b pb-2 text-xs font-semibold text-slate-500">
                <span>BOOKING ID</span>
                <span className="font-mono text-slate-800">{confirmedBooking?.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800">
                <span>Service</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>Date & Time</span>
                <span>
                  {confirmedBooking &&
                    new Date(confirmedBooking.starts_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: business.timezone,
                    })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-blue-600">
                <span>Total Amount</span>
                <span>${((selectedService?.price || 0) / 100).toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              A 24-hour reminder email will be automatically sent to <span className="font-medium text-slate-600">{clientEmail}</span>.
            </p>

            <button
              onClick={() => {
                setStep(1);
                setSelectedSlot(null);
                setConfirmedBooking(null);
              }}
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
            >
              Book Another Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
