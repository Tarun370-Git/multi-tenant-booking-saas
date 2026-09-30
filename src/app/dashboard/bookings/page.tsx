'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Calendar, Scissors, User, DollarSign } from 'lucide-react';
import { Booking, BookingStatus } from '@/lib/types';
import { useDashboardTenant } from '../tenant-context';

export default function BookingsListPage() {
  const { tenant } = useDashboardTenant();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings?business_id=${tenant.id}`);
        if (res.ok) {
          setBookings(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [tenant.id]);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesSearch =
      (b.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.service?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.client?.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tenant Bookings List</h1>
          <p className="text-sm text-slate-500 mt-1">Search, filter, and audit all tenant booking records.</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by client or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No matching bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Booking ID</th>
                  <th className="py-3.5 px-6">Client</th>
                  <th className="py-3.5 px-6">Service & Provider</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Price</th>
                  <th className="py-3.5 px-6">Source</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-4 px-6 font-mono font-bold text-slate-500">#{b.id.slice(0, 8)}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {b.client?.name || 'Public Client'}
                      <div className="text-[10px] font-normal text-slate-400">{b.client?.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{b.service?.name}</div>
                      <div className="text-[10px] text-slate-400">by {b.provider?.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      {new Date(b.starts_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">${(b.price / 100).toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded">
                        {b.source}
                      </span>
                    </td>
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
