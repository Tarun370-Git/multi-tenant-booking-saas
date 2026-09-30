'use client';

import { useEffect, useState } from 'react';
import { Clock, ShieldAlert, Plus, Calendar, Building, Check } from 'lucide-react';
import { BusinessHours, BlockedPeriod } from '@/lib/types';
import { useDashboardTenant } from '../tenant-context';

const DAYS_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsSchedulePage() {
  const { tenant } = useDashboardTenant();
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [blocked, setBlocked] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        const res = await fetch(`/api/schedule?business_id=${tenant.id}`);
        if (res.ok) {
          const data = await res.json();
          setHours(data.hours || []);
          setBlocked(data.blocked || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [tenant.id]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900">Operating Hours & Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">Configure weekly open hours and blocked vacation/break times.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Operating Hours */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Weekly Operating Hours
          </h2>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading schedule...</div>
          ) : (
            <div className="space-y-3 divide-y divide-slate-100">
              {DAYS_MAP.map((dayName, idx) => {
                const daySchedule = hours.find((h) => h.day_of_week === idx);
                const isEnabled = daySchedule ? daySchedule.enabled : idx !== 0;

                return (
                  <div key={idx} className="pt-3 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 w-24">{dayName}</span>
                    {isEnabled ? (
                      <div className="flex items-center gap-2 font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span>{daySchedule?.start_time || '09:00'}</span>
                        <span className="text-slate-400">&mdash;</span>
                        <span>{daySchedule?.end_time || '18:00'}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                        CLOSED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blocked Periods */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Blocked Periods & Holidays
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading blocked time...</div>
          ) : blocked.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">No blocked periods configured.</div>
          ) : (
            <div className="space-y-3">
              {blocked.map((bp) => (
                <div key={bp.id} className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-amber-950">
                    <span>Reason: {bp.reason || 'Unavailable'}</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono">BLOCKED</span>
                  </div>
                  <div className="text-amber-800">
                    Starts: {new Date(bp.starts_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div className="text-amber-800">
                    Ends: {new Date(bp.ends_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
