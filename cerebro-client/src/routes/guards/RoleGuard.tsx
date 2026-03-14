import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { Role } from '@/types/roles'

interface RoleGuardProps {
  allowedRoles: Role[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
