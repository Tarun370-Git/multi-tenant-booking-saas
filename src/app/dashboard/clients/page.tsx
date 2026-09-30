'use client';

import { useEffect, useState } from 'react';
import { Search, User, Mail, Phone, DollarSign, Calendar, FileText, Edit2, Check } from 'lucide-react';
import { Client } from '@/lib/types';
import { useDashboardTenant } from '../tenant-context';

export default function CustomerCRMPage() {
  const { tenant } = useDashboardTenant();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients?business_id=${tenant.id}`);
      if (res.ok) {
        setClients(await res.json());
      }
    } catch (err) {
      console.error('Error fetching CRM clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [tenant.id]);

  const handleSaveNotes = async (clientId: string) => {
    try {
      setSavingNotes(true);
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
      });

      if (res.ok) {
        setEditingNotesId(null);
        await fetchClients();
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header & Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Customer CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Tenant customer records, lifetime value, and private business notes.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* CRM Client Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border text-center text-slate-400 text-sm">Loading customer database...</div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border text-center text-slate-400 text-sm">No customers found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-start justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-sm">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{client.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {client.email}
                    </p>
                    {client.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {client.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Lifetime Value</span>
                  <span className="text-lg font-black text-emerald-600">${((client.lifetime_value || 0) / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">BOOKINGS</span>
                  <span className="font-extrabold text-slate-800">{client.total_bookings || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">LAST VISIT</span>
                  <span className="font-bold text-slate-700">
                    {client.last_appointment ? new Date(client.last_appointment).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">NEXT VISIT</span>
                  <span className="font-bold text-blue-600">
                    {client.next_appointment ? new Date(client.next_appointment).toLocaleDateString() : 'None'}
                  </span>
                </div>
              </div>

              {/* Private Internal Business Notes Section */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-700" /> Private Business Notes (Confidential)
                  </span>
                  {editingNotesId !== client.id && (
                    <button
                      onClick={() => {
                        setEditingNotesId(client.id);
                        setNotesText(client.notes || '');
                      }}
                      className="text-amber-800 hover:text-amber-950 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                {editingNotesId === client.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      className="w-full p-2 bg-white text-xs border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={savingNotes}
                        onClick={() => handleSaveNotes(client.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-md shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-950 font-medium italic">
                    {client.notes || 'No internal notes added yet.'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
