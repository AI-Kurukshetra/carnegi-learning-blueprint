import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import {
  createTenant,
  deleteTenant,
  getTenantById,
  getTenants,
  updateTenant,
  type CreateTenantPayload,
  type GetTenantsParams,
  type UpdateTenantPayload,
} from '../services/tenants.service'

const TENANTS_QUERY_KEY = 'tenants'

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiError | undefined
    return body?.error?.message ?? fallback
  }
  return fallback
}

export function useTenants(params: GetTenantsParams) {
  return useQuery({
    queryKey: [TENANTS_QUERY_KEY, params],
    queryFn: () => getTenants(params),
  })
}

export function useTenantById(id: string) {
  return useQuery({
    queryKey: [TENANTS_QUERY_KEY, 'detail', id],
    queryFn: () => getTenantById(id),
    enabled: Boolean(id),
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => createTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] })
    },
    meta: {
      getErrorMessage: (error: unknown) => getApiErrorMessage(error, 'Failed to create tenant.'),
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTenantPayload }) => updateTenant(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] })
    },
    meta: {
      getErrorMessage: (error: unknown) => getApiErrorMessage(error, 'Failed to update tenant.'),
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY] })
    },
    meta: {
      getErrorMessage: (error: unknown) => getApiErrorMessage(error, 'Failed to delete tenant.'),
    },
  })
}

export function getMutationErrorMessage(mutationError: unknown, fallback: string) {
  return getApiErrorMessage(mutationError, fallback)
}
