import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { ROLE_HOME } from './role-home'

export function RoleRedirect() {
  const user = useAuthStore((state) => state.user)
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={ROLE_HOME[user.role]} replace />
}
