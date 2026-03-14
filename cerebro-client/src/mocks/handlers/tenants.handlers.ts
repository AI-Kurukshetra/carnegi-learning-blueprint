import type { AxiosRequestConfig } from 'axios'
import { mockTenants } from '../data/tenants.mock.data'

type MockTenantRecord = (typeof mockTenants)[number]

const tenantsStore: MockTenantRecord[] = [...mockTenants]

function parseData(config: AxiosRequestConfig) {
  if (!config.data) return {}
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return config.data as Record<string, unknown>
}

function getQueryParams(config: AxiosRequestConfig) {
  const params = config.params as Record<string, unknown> | undefined
  return {
    page: Number(params?.page ?? 1),
    limit: Math.min(Number(params?.limit ?? 20), 100),
    search: String(params?.search ?? '').trim().toLowerCase(),
  }
}

function getTenantId(config: AxiosRequestConfig) {
  const url = config.url ?? ''
  const match = url.match(/\/tenants\/([^/?]+)/)
  return match?.[1] ?? null
}

function createMockId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

async function getTenantsHandler(config: AxiosRequestConfig) {
  const { page, limit, search } = getQueryParams(config)
  const filtered = tenantsStore
    .filter((tenant) => tenant.deleted_at == null)
    .filter((tenant) => {
      if (!search) return true
      return tenant.name.toLowerCase().includes(search) || tenant.slug.toLowerCase().includes(search)
    })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit

  return {
    status: 200,
    success: true,
    data: filtered.slice(start, start + limit),
    meta: {
      page: safePage,
      limit,
      total,
      total_pages: totalPages,
    },
  }
}

async function getTenantByIdHandler(config: AxiosRequestConfig) {
  const tenantId = getTenantId(config)
  const tenant = tenantsStore.find((item) => item.id === tenantId && item.deleted_at == null)

  if (!tenant) {
    return {
      status: 404,
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tenant does not exist.' },
    }
  }

  return { status: 200, success: true, data: tenant }
}

async function createTenantHandler(config: AxiosRequestConfig) {
  const payload = parseData(config)
  const name = String(payload.name ?? '').trim()
  const slug = String(payload.slug ?? '').trim().toLowerCase()
  const adminEmail = String(payload.admin_email ?? '').trim().toLowerCase()
  const adminFirstName = String(payload.admin_first_name ?? '').trim()
  const adminLastName = String(payload.admin_last_name ?? '').trim()
  const adminPassword = String(payload.admin_password ?? '')

  if (!name || !slug || !adminEmail || !adminFirstName || !adminLastName || adminPassword.length < 8) {
    return {
      status: 400,
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid tenant create payload.' },
    }
  }

  const slugExists = tenantsStore.some((tenant) => tenant.slug === slug && tenant.deleted_at == null)
  if (slugExists) {
    return {
      status: 409,
      success: false,
      error: { code: 'CONFLICT', message: 'Slug already exists.' },
    }
  }

  const timestamp = new Date().toISOString()
  const createdTenant: MockTenantRecord = {
    id: createMockId(),
    name,
    slug,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    admin_user: {
      id: createMockId(),
      email: adminEmail,
    },
  }

  tenantsStore.unshift(createdTenant)

  return { status: 201, success: true, data: createdTenant }
}

async function updateTenantHandler(config: AxiosRequestConfig) {
  const tenantId = getTenantId(config)
  const payload = parseData(config)
  const tenantIndex = tenantsStore.findIndex((tenant) => tenant.id === tenantId && tenant.deleted_at == null)

  if (tenantIndex === -1) {
    return {
      status: 404,
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tenant does not exist.' },
    }
  }

  const current = tenantsStore[tenantIndex]
  const nextName = payload.name !== undefined ? String(payload.name).trim() : current.name
  const nextIsActive = payload.is_active !== undefined ? Boolean(payload.is_active) : current.is_active

  if (!nextName) {
    return {
      status: 400,
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Tenant name cannot be empty.' },
    }
  }

  const updated: MockTenantRecord = {
    ...current,
    name: nextName,
    is_active: nextIsActive,
    updated_at: new Date().toISOString(),
  }

  tenantsStore[tenantIndex] = updated
  return { status: 200, success: true, data: updated }
}

async function deleteTenantHandler(config: AxiosRequestConfig) {
  const tenantId = getTenantId(config)
  const tenant = tenantsStore.find((item) => item.id === tenantId && item.deleted_at == null)

  if (!tenant) {
    return {
      status: 404,
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tenant does not exist.' },
    }
  }

  tenant.deleted_at = new Date().toISOString()
  tenant.updated_at = tenant.deleted_at

  return {
    status: 200,
    success: true,
    data: {
      message: 'Tenant deleted successfully.',
    },
  }
}

export const tenantsHandlers = [
  { method: 'get', pattern: /\/tenants$/, handler: getTenantsHandler },
  { method: 'get', pattern: /\/tenants\/[^/?]+$/, handler: getTenantByIdHandler },
  { method: 'post', pattern: /\/tenants$/, handler: createTenantHandler },
  { method: 'patch', pattern: /\/tenants\/[^/?]+$/, handler: updateTenantHandler },
  { method: 'delete', pattern: /\/tenants\/[^/?]+$/, handler: deleteTenantHandler },
]
