import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Invoice, SuperAdminStats, TenantUser } from '@/types/domain.types'

export async function getTenantInvoices(tenantId: string): Promise<Invoice[]> {
  const res = await apiClient.get<ApiSuccess<Invoice[]>>('/invoices', { params: { tenant_id: tenantId } })
  if (!res.data.success) throw new Error('Failed to fetch invoices.')
  return res.data.data
}

export async function getTenantUsers(tenantId: string): Promise<TenantUser[]> {
  const res = await apiClient.get<ApiSuccess<TenantUser[]>>(`/tenants/${tenantId}/users`)
  if (!res.data.success) throw new Error('Failed to fetch tenant users.')
  return res.data.data
}

export async function getSuperAdminStats(): Promise<SuperAdminStats> {
  const res = await apiClient.get<ApiSuccess<SuperAdminStats>>('/dashboard/super-admin')
  if (!res.data.success) throw new Error('Failed to fetch super-admin stats.')
  return res.data.data
}
