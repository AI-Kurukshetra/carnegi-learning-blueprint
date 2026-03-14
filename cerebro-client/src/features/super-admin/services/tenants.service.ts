import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Tenant } from '@/types/domain.types'

export interface GetTenantsParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateTenantPayload {
  name: string
  slug: string
  admin_first_name: string
  admin_last_name: string
  admin_email: string
  admin_password: string
}

export interface UpdateTenantPayload {
  name?: string
  is_active?: boolean
}

export interface PaginatedTenants {
  data: Tenant[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export async function getTenants(params: GetTenantsParams): Promise<PaginatedTenants> {
  const response = await apiClient.get<ApiSuccess<Tenant[]>>('/tenants', { params })
  const body = response.data

  if (!body.success) {
    throw new Error('Failed to fetch tenants.')
  }

  return {
    data: body.data,
    meta: body.meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: body.data.length,
      total_pages: 1,
    },
  }
}

export async function createTenant(payload: CreateTenantPayload): Promise<Tenant> {
  const response = await apiClient.post<ApiSuccess<Tenant>>('/tenants', payload)
  if (!response.data.success) {
    throw new Error('Failed to create tenant.')
  }
  return response.data.data
}

export async function getTenantById(id: string): Promise<Tenant> {
  const response = await apiClient.get<ApiSuccess<Tenant>>(`/tenants/${id}`)
  if (!response.data.success) {
    throw new Error('Failed to fetch tenant detail.')
  }
  return response.data.data
}

export async function updateTenant(id: string, payload: UpdateTenantPayload): Promise<Tenant> {
  const response = await apiClient.patch<ApiSuccess<Tenant>>(`/tenants/${id}`, payload)
  if (!response.data.success) {
    throw new Error('Failed to update tenant.')
  }
  return response.data.data
}

export async function deleteTenant(id: string): Promise<{ message: string }> {
  const response = await apiClient.delete<ApiSuccess<{ message: string }>>(`/tenants/${id}`)
  if (!response.data.success) {
    throw new Error('Failed to delete tenant.')
  }
  return response.data.data
}
