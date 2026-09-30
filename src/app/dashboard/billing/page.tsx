'use client';

import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { Subscription } from '@/lib/types';
import { useDashboardTenant } from '../tenant-context';

export default function SubscriptionBillingPage() {
  const { tenant } = useDashboardTenant();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    async function loadBilling() {
      try {
        setLoading(true);
        const res = await fetch(`/api/billing/checkout?business_id=${tenant.id}`);
        // Fallback for mock status query
        setSubscription({
          id: 'sub1',
          business_id: tenant.id,
          plan: 'pro',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBilling();
  }, [tenant.id]);

  const handleUpgradePlan = async (targetPlan: 'starter' | 'pro' | 'enterprise') => {
    try {
      setUpgrading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: tenant.id,
          plan: targetPlan,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubscription(data.subscription);
        alert(`Successfully updated subscription plan to ${targetPlan.toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Subscription & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">Manage tenant SaaS access, plan tier, and webhook-driven billing state.</p>
        </div>

        {subscription && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Active Plan: {subscription.plan.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Plan Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Plan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Starter Tier</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$19 <span className="text-xs text-slate-500 font-normal">/ month</span></h3>
            <p className="text-xs text-slate-500 mt-2">Essential appointment scheduling for solo operators.</p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 100 bookings / month
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 Provider Resource
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <AlertCircle className="w-4 h-4 text-slate-300" /> No 24h Automated Reminders
              </li>
            </ul>
          </div>

          <button
            disabled={upgrading || subscription?.plan === 'starter'}
            onClick={() => handleUpgradePlan('starter')}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold rounded-xl text-xs transition-all"
          >
            {subscription?.plan === 'starter' ? 'Current Active Plan' : 'Switch to Starter'}
          </button>
        </div>

        {/* Pro Plan (Featured) */}
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-md flex flex-col justify-between space-y-6 relative">
          <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            POPULAR PRO
          </span>

          <div>
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Pro Business</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$49 <span className="text-xs text-slate-500 font-normal">/ month</span></h3>
            <p className="text-xs text-slate-500 mt-2">Full multi-tenant feature set, automated reminders, and CRM.</p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Unlimited Bookings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Multi-Provider Capabilities
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Automated 24h Reminder Cron
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Full Customer CRM & LTV
              </li>
            </ul>
          </div>

          <button
            disabled={upgrading || subscription?.plan === 'pro'}
            onClick={() => handleUpgradePlan('pro')}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            {subscription?.plan === 'pro' ? 'Current Active Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">Enterprise</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$99 <span className="text-xs text-slate-500 font-normal">/ month</span></h3>
            <p className="text-xs text-slate-500 mt-2">AI Smart Assistant suite and dedicated webhook integrations.</p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" /> Everything in Pro Tier
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" /> AI Natural Language Assistant
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" /> AI No-Show Predictor
              </li>
            </ul>
          </div>

          <button
            disabled={upgrading || subscription?.plan === 'enterprise'}
            onClick={() => handleUpgradePlan('enterprise')}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
          >
            {subscription?.plan === 'enterprise' ? 'Current Active Plan' : 'Upgrade to Enterprise'}
          </button>
        </div>
      </div>
    </div>
  );
}
