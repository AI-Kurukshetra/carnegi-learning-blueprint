import { apiClient } from '@/lib/api-client'
import type { User } from '@/types/domain.types'

// ── Payloads ──────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
  tenant_slug: string
}

export interface UpdateMePayload {
  first_name?: string
  last_name?: string
  password?: string
}

// ── Response shapes ───────────────────────────────────────

export interface LoginData {
  access_token: string
  refresh_token: string
  user: User
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface MeData extends User {
  is_verified: boolean
  last_login_at: string | null
}

// ── API functions ─────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<LoginData> {
  const response = await apiClient.post('/auth/login', payload)
  const body = response.data as { success?: boolean; data?: LoginData; error?: { message?: string } }

  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Unable to login. Please try again.')
  }

  return body.data
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
  const body = response.data as { success?: boolean; data?: TokenPair; error?: { message?: string } }

  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Session expired. Please login again.')
  }

  return body.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getMe(): Promise<MeData> {
  const response = await apiClient.get('/auth/me')
  const body = response.data as { success?: boolean; data?: MeData; error?: { message?: string } }

  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Failed to fetch profile.')
  }

  return body.data
}

export async function updateMe(payload: UpdateMePayload): Promise<MeData> {
  const response = await apiClient.patch('/auth/me', payload)
  const body = response.data as { success?: boolean; data?: MeData; error?: { message?: string } }

  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Failed to update profile.')
  }

  return body.data
}
