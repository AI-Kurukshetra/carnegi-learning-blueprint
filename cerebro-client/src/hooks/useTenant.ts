import { useAuthStore } from '../store/auth.store'

export function useTenant() {
  return useAuthStore((state) => state.tenantId)
}
