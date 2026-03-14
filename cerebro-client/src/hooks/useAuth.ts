import { useAuthStore } from '../store/auth.store'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isHydrating,
    accessToken,
    tenantId,
    tenantSlug,
    setAuth,
    updateTokens,
    updateUser,
    clearAuth,
  } = useAuthStore()

  return {
    user,
    isAuthenticated,
    isHydrating,
    accessToken,
    tenantId,
    tenantSlug,
    setAuth,
    updateTokens,
    updateUser,
    clearAuth,
  }
}
