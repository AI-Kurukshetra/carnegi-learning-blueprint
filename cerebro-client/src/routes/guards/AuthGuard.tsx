import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAuthStore } from '@/store/auth.store'
import { useMe } from '@/features/auth/hooks/useMe'

export function AuthGuard() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrating = useAuthStore((state) => state.isHydrating)

  // Validate session by calling GET /auth/me
  // This ensures the stored token is still valid on the server
  const { isLoading: isValidating } = useMe()

  if (isHydrating || (isAuthenticated && isValidating)) {
    return <LoadingState message="Restoring session..." className="m-4" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
