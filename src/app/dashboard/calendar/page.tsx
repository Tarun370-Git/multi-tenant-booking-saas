'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  RotateCw, 
  Plus,
  X
} from 'lucide-react';
import { Booking, BookingStatus } from '@/lib/types';
import { useDashboardTenant } from '../tenant-context';

export default function DashboardCalendarPage() {
  const { tenant } = useDashboardTenant();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Reschedule form state
  const [showReschedule, setShowReschedule] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('10:00');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings?business_id=${tenant.id}`);
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (err) {
      console.error('Error fetching calendar bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [tenant.id]);

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        alert('Failed to update status');
        return;
      }

      await fetchBookings();
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return;

    try {
      setIsUpdating(true);
      const newStart = `${rescheduleDate}T${rescheduleTime}:00.000Z`;
      const durationMs = (selectedBooking.service?.duration_minutes || 30) * 60000;
      const newEnd = new Date(new Date(newStart).getTime() + durationMs).toISOString();

      const res = await fetch(`/api/bookings/${selectedBooking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starts_at: newStart, ends_at: newEnd }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Reschedule failed due to time slot overlap');
        return;
      }

      alert('Appointment rescheduled successfully');
      setShowReschedule(false);
      setSelectedBooking(null);
      await fetchBookings();
    } catch (err) {
      console.error('Reschedule error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Calendar Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Appointment Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule overview and booking lifecycle actions.</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar Appointments List Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Upcoming Schedule Grid</h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading calendar...</div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No appointments scheduled for this view.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((b) => {
              const startDate = new Date(b.starts_at);
              const dateStr = startDate.toLocaleDateString([], { dateStyle: 'medium' });
              const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                    b.status === 'confirmed'
                      ? 'border-blue-200 bg-blue-50/30'
                      : b.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : b.status === 'cancelled'
                      ? 'border-rose-200 bg-rose-50/30 line-through opacity-70'
                      : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      ⏰ {timeStr} ({b.service?.duration_minutes || 30} mins)
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        b.status === 'confirmed'
                          ? 'bg-blue-600 text-white'
                          : b.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : b.status === 'cancelled'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm mb-1">{b.service?.name}</h3>
                  <div className="text-xs text-slate-600 font-medium space-y-0.5">
                    <p>👤 Client: {b.client?.name}</p>
                    <p>✂️ Provider: {b.provider?.name}</p>
                    <p className="text-[11px] text-slate-400 mt-2">Date: {dateStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointment Detail & Actions Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedBooking.service?.name}</h3>
                <p className="text-xs text-slate-500">Booking Ref: #{selectedBooking.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Client:</span>
                <span className="font-bold">{selectedBooking.client?.name} ({selectedBooking.client?.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Provider:</span>
                <span className="font-bold">{selectedBooking.provider?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Scheduled Time:</span>
                <span className="font-bold">
                  {new Date(selectedBooking.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Price:</span>
                <span className="font-bold text-blue-600">${(selectedBooking.price / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Current Status:</span>
                <span className="font-extrabold uppercase text-slate-900">{selectedBooking.status}</span>
              </div>
            </div>

            {/* Lifecycle State Actions (Section 11.1) */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Update Lifecycle State</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Completed
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedBooking.id, 'no_show')}
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <AlertOctagon className="w-4 h-4" /> Mark No-Show
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Cancel Booking
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => setShowReschedule(!showReschedule)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-4 h-4" /> Reschedule
                </button>
              </div>
            </div>

            {/* Reschedule Drawer */}
            {showReschedule && (
              <form onSubmit={handleRescheduleSubmit} className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Select New Date & Time</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="p-2 text-xs rounded-lg border bg-white"
                  />
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="p-2 text-xs rounded-lg border bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                >
                  Confirm Reschedule
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
