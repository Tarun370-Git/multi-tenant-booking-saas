'use client';

import { useEffect, useState } from 'react';
import { Scissors, Plus, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Service } from '@/lib/types';
import { useDashboardTenant } from '../tenant-context';

export default function ServicesPage() {
  const { tenant } = useDashboardTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [priceDollars, setPriceDollars] = useState('35.00');
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async (businessId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/services?business_id=${businessId}`);
      if (res.ok) setServices(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(tenant.id);
  }, [tenant.id]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration || !priceDollars) return;

    try {
      setSubmitting(true);
      const priceCents = Math.round(parseFloat(priceDollars) * 100);

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: tenant.id,
          name,
          description,
          duration_minutes: parseInt(duration),
          price: priceCents,
        }),
      });

      if (res.ok) {
        setName('');
        setDescription('');
        setShowAddForm(false);
        await fetchServices(tenant.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (serviceId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      await fetchServices(tenant.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Services Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Manage bookable service offerings, pricing, and duration bounds.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Service
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddService} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Add Bookable Service</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Deluxe Beard Styling"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes) *</label>
              <input
                type="number"
                required
                min="5"
                step="5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price (USD $) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Brief summary of service..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 font-bold text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Save Service
            </button>
          </div>
        </form>
      )}

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 bg-white p-12 text-center text-slate-400 text-sm rounded-2xl border">Loading services...</div>
        ) : (
          services.map((srv) => (
            <div key={srv.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> {srv.duration_minutes} mins
                  </span>
                  <button
                    onClick={() => handleToggleActive(srv.id, srv.active)}
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                      srv.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {srv.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{srv.name}</h3>
                {srv.description && <p className="text-xs text-slate-500 mt-1">{srv.description}</p>}
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-xs font-semibold text-slate-500">Price</span>
                <span className="text-xl font-black text-blue-600">${(srv.price / 100).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
