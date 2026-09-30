'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Users, 
  Scissors, 
  Settings, 
  CreditCard, 
  Sparkles,
  ChevronDown,
  Building2,
  ExternalLink
} from 'lucide-react';
import { DashboardTenant, DashboardTenantContext } from './tenant-context';

const TENANTS: DashboardTenant[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Apex Barber Shop', slug: 'apex-barbers' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Lumina Wellness Clinic', slug: 'lumina-wellness' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [selectedTenant, setSelectedTenant] = useState<DashboardTenant>(TENANTS[0]);

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/bookings', label: 'Bookings', icon: BookOpen },
    { href: '/dashboard/clients', label: 'Customer CRM', icon: Users },
    { href: '/dashboard/services', label: 'Services', icon: Scissors },
    { href: '/dashboard/settings', label: 'Hours & Settings', icon: Settings },
    { href: '/dashboard/billing', label: 'Subscription', icon: CreditCard },
    { href: '/dashboard/ai', label: 'AI Suite', icon: Sparkles, badge: 'Bonus' },
  ];

  return (
    <DashboardTenantContext.Provider value={{ tenant: selectedTenant, setTenant: setSelectedTenant }}>
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              S
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Schedulr SaaS</h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400">Multi-Tenant Portal</span>
            </div>
          </div>
        </div>

        {/* Tenant Switcher */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Active Tenant Context
          </label>
          <div className="relative">
            <select
              value={selectedTenant.id}
              onChange={(e) => {
                const found = TENANTS.find((t) => t.id === e.target.value);
                if (found) setSelectedTenant(found);
              }}
              className="w-full bg-slate-800 text-white text-xs font-bold py-2 pl-8 pr-7 rounded-lg border border-slate-700 outline-none appearance-none cursor-pointer"
            >
              {TENANTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-blue-400 absolute left-2.5 top-2.5" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Public Booking Link */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <a
            href={`/booking/${selectedTenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold rounded-lg text-xs transition-all border border-slate-700"
          >
            <span>Public Booking Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
    </DashboardTenantContext.Provider>
  );
}
