import Link from 'next/link';
import { 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Users, 
  ExternalLink, 
  ArrowRight,
  Database,
  Lock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Hero Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              S
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">Schedulr SaaS</span>
              <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 font-extrabold px-2 py-0.5 rounded border border-blue-500/30 uppercase">
                Production-Grade
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Business Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Full-Stack Coding Assessment Submission • Multi-Tenant Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white max-w-4xl mx-auto leading-tight">
          Multi-Tenant Appointment & Booking SaaS Platform
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-normal">
          Engineered with Next.js, PostgreSQL RLS isolation, atomic race-condition booking protection, customer CRM, automated 24-hour reminders, and AI smart scheduling.
        </p>

        {/* Demo Portals Callout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-8">
          {/* Demo Tenant 1 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tenant 1 Demo</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">Active</span>
            </div>
            <h3 className="text-2xl font-extrabold text-white">Apex Barber Shop</h3>
            <p className="text-xs text-slate-400">Services: Haircuts, Beard Styling. Timezone: America/New_York.</p>
            <a
              href="/booking/apex-barbers"
              target="_blank"
              className="inline-flex items-center gap-2 w-full justify-center py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
            >
              Launch Public Booking Page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Demo Tenant 2 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tenant 2 Demo</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">Active</span>
            </div>
            <h3 className="text-2xl font-extrabold text-white">Lumina Wellness Clinic</h3>
            <p className="text-xs text-slate-400">Services: Therapy, Acupuncture. Timezone: America/Los_Angeles.</p>
            <a
              href="/booking/lumina-wellness"
              target="_blank"
              className="inline-flex items-center gap-2 w-full justify-center py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all"
            >
              Launch Public Booking Page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Grid Highlights */}
      <section className="border-t border-slate-800 bg-slate-950 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Lock className="w-8 h-8 text-blue-500" />
            <h3 className="text-lg font-extrabold text-white">PostgreSQL RLS Multi-Tenancy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Row-Level Security policies enforced directly at the database layer using `auth.uid()` and business membership checking to prevent cross-tenant data leakage.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            <h3 className="text-lg font-extrabold text-white">Atomic Double-Booking Prevention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atomic PostgreSQL RPC procedure using `SELECT FOR UPDATE` locks to eliminate race conditions under concurrent client booking requests.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Zap className="w-8 h-8 text-purple-500" />
            <h3 className="text-lg font-extrabold text-white">Automated Reminders & AI Suite</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vercel Cron endpoint for 24-hour idempotent reminder dispatching, paired with AI Natural Language Smart Booking and No-Show risk prediction.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
