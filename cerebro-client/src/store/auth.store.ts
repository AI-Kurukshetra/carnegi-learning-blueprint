import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/domain.types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  tenantId: string | null
  tenantSlug: string | null
  isAuthenticated: boolean
  isHydrating: boolean
  setAuth: (params: { user: User; accessToken: string; refreshToken: string; tenantSlug?: string }) => void
  updateTokens: (params: { accessToken: string; refreshToken: string }) => void
  updateUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      tenantSlug: null,
      isAuthenticated: false,
      isHydrating: true,
      setAuth: ({ user, accessToken, refreshToken, tenantSlug }) =>
        set({
          user,
          accessToken,
          refreshToken,
          tenantId: user.tenant_id,
          tenantSlug: tenantSlug ?? null,
          isAuthenticated: true,
          isHydrating: false,
        }),
      updateTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      updateUser: (user) => set({ user, tenantId: user.tenant_id }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tenantId: null,
          tenantSlug: null,
          isAuthenticated: false,
          isHydrating: false,
        }),
    }),
    {
      name: 'cerebro-auth-store',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.isHydrating = false
      },
    },
  ),
)
