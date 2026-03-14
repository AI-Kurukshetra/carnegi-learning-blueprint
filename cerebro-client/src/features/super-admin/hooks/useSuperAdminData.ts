import { useQuery } from '@tanstack/react-query'
import { getTenantInvoices, getTenantUsers, getSuperAdminStats } from '../services/invoices.service'

export function useTenantInvoices(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-invoices', tenantId],
    queryFn: () => getTenantInvoices(tenantId),
    enabled: !!tenantId,
  })
}

export function useTenantUsers(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: () => getTenantUsers(tenantId),
    enabled: !!tenantId,
  })
}

export function useSuperAdminStats() {
  return useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: getSuperAdminStats,
  })
}
