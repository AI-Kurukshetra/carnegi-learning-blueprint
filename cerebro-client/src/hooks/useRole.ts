import { useAuthStore } from '../store/auth.store'
import type { Role } from '../types/roles'

export function useRole() {
  const role = useAuthStore((state) => state.user?.role as Role | undefined)

  return {
    role,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isSchoolAdmin: role === 'SCHOOL_ADMIN',
    isTeacher: role === 'TEACHER',
    isStudent: role === 'STUDENT',
  }
}
