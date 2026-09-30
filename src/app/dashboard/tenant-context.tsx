'use client';

import { createContext, useContext } from 'react';

export interface DashboardTenant {
  id: string;
  name: string;
  slug: string;
}

export interface DashboardTenantContextValue {
  tenant: DashboardTenant;
  setTenant: (tenant: DashboardTenant) => void;
}

export const DashboardTenantContext = createContext<DashboardTenantContextValue | null>(null);

export function useDashboardTenant(): DashboardTenantContextValue {
  const context = useContext(DashboardTenantContext);
  if (!context) {
    throw new Error('useDashboardTenant must be used within the dashboard tenant provider');
  }
  return context;
}