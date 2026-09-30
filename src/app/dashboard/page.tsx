'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  CalendarDays
} from 'lucide-react';
import { Booking, Client } from '@/lib/types';
import { useDashboardTenant } from './tenant-context';

export default function DashboardOverviewPage() {
  const { tenant } = useDashboardTenant();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resB, resC] = await Promise.all([
          fetch(`/api/bookings?business_id=${tenant.id}`),
          fetch(`/api/clients?business_id=${tenant.id}`),
        ]);

        if (resB.ok) setBookings(await resB.json());
        if (resC.ok) setClients(await resC.json());
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenant.id]);

  // Compute Metrics according to section 12.2 definitions
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todaysAppointments = bookings.filter(
    (b) => b.starts_at.startsWith(todayStr) && b.status !== 'cancelled'
  );

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.starts_at) > new Date() && b.status !== 'cancelled'
  );

  const totalRevenueCents = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.price, 0);

  const totalNoShows = bookings.filter((b) => b.status === 'no_show').length;
  const totalCompletedOrExpected = bookings.filter((b) => b.status === 'completed' || b.status === 'no_show' || b.status === 'confirmed').length;
  const noShowRatePct = totalCompletedOrExpected > 0 ? ((totalNoShows / totalCompletedOrExpected) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time business performance and upcoming schedule context.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/booking/${tenant.slug}`}
            target="_blank"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> View Booking Page
          </a>
        </div>
      </div>

      {/* Metric Cards Grid (Section 12.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-extrabold uppercase text-slate-400">Today&apos;s Bookings</span>
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-slate-900">{todaysAppointments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Scheduled for today</div>
        </div>

        {/* Metric 2: Upcoming Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-extrabold uppercase text-slate-400">Upcoming</span>
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-slate-900">{upcomingBookings.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Active future appointments</div>
        </div>

        {/* Metric 3: Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-extrabold uppercase text-slate-400">Revenue</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-slate-900">${(totalRevenueCents / 100).toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Confirmed booking value</div>
        </div>

        {/* Metric 4: CRM Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-extrabold uppercase text-slate-400">Total Clients</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-slate-900">{clients.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Unique CRM records</div>
        </div>

        {/* Metric 5: No-Show Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-extrabold uppercase text-slate-400">No-Show Rate</span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-slate-900">{noShowRatePct}%</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Formula: no_shows / total</div>
        </div>
      </div>

      {/* Bookings Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Appointments</h2>
            <p className="text-xs text-slate-500">Manage client attendance and lifecycle states</p>
          </div>
          <a href="/dashboard/calendar" className="text-xs font-bold text-blue-600 hover:underline">
            View Full Calendar &rarr;
          </a>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading appointment records...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No bookings recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Client</th>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Provider</th>
                  <th className="py-3 px-6">Date & Time</th>
                  <th className="py-3 px-6">Price</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {b.client?.name || 'Public Client'}
                      <div className="text-[10px] font-normal text-slate-400">{b.client?.email}</div>
                    </td>
                    <td className="py-4 px-6">{b.service?.name || 'Standard Service'}</td>
                    <td className="py-4 px-6">{b.provider?.name || 'Staff Member'}</td>
                    <td className="py-4 px-6">
                      {new Date(b.starts_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">${(b.price / 100).toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                          b.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : b.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
