import type { Role } from '@/types/roles'

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  SCHOOL_ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
}
