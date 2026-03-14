import type { AxiosRequestConfig } from 'axios'
import { mockCredentials } from '../data/auth.mock.data'

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

function getUserFromToken(config: AxiosRequestConfig) {
  const authHeader = config.headers?.Authorization as string | undefined
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  // Mock tokens are in the format: mock-access-{userId}
  const userId = token.replace('mock-access-', '')
  return mockCredentials.find((c) => c.user.id === userId)?.user ?? null
}

export async function loginHandler(config: AxiosRequestConfig) {
  const data = parseData(config)
  const email = String(data.email ?? '')
  const password = String(data.password ?? '')
  const tenantSlug = String(data.tenant_slug ?? '')

  const match = mockCredentials.find(
    (item) => item.email === email && item.password === password && item.tenant_slug === tenantSlug,
  )

  if (!match) {
    return {
      status: 401,
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid credentials or school identifier.' },
    }
  }

  return {
    status: 200,
    success: true,
    data: {
      access_token: `mock-access-${match.user.id}`,
      refresh_token: `mock-refresh-${match.user.id}`,
      user: match.user,
    },
  }
}

export async function refreshHandler(config: AxiosRequestConfig) {
  const data = parseData(config)
  const refreshToken = String(data.refresh_token ?? '')

  // Mock: extract user ID from refresh token
  const userId = refreshToken.replace('mock-refresh-', '')
  const match = mockCredentials.find((c) => c.user.id === userId)

  if (!match) {
    return {
      status: 401,
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token.' },
    }
  }

  return {
    status: 200,
    success: true,
    data: {
      access_token: `mock-access-${match.user.id}`,
      refresh_token: `mock-refresh-${match.user.id}`,
    },
  }
}

export async function logoutHandler() {
  return {
    status: 204,
    success: true,
    data: null,
  }
}

export async function getMeHandler(config: AxiosRequestConfig) {
  const user = getUserFromToken(config)

  if (!user) {
    return {
      status: 401,
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' },
    }
  }

  return {
    status: 200,
    success: true,
    data: {
      ...user,
      is_verified: true,
      last_login_at: new Date().toISOString(),
    },
  }
}

export async function updateMeHandler(config: AxiosRequestConfig) {
  const user = getUserFromToken(config)

  if (!user) {
    return {
      status: 401,
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' },
    }
  }

  const data = parseData(config)
  const updated = {
    ...user,
    first_name: typeof data.first_name === 'string' ? data.first_name : user.first_name,
    last_name: typeof data.last_name === 'string' ? data.last_name : user.last_name,
    is_verified: true,
    last_login_at: new Date().toISOString(),
  }

  return {
    status: 200,
    success: true,
    data: updated,
  }
}
