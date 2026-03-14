import type { User } from '../../types/domain.types'

export interface MockCredential {
  email: string
  password: string
  tenant_slug: string
  user: User
}

export const mockCredentials: MockCredential[] = [
  {
    email: 'superadmin@cerebro.dev',
    password: 'Password@123',
    tenant_slug: 'cerebro-platform',
    user: {
      id: 'user-super-admin',
      email: 'superadmin@cerebro.dev',
      first_name: 'Super',
      last_name: 'Admin',
      role: 'SUPER_ADMIN',
      tenant_id: null,
    },
  },
  {
    email: 'admin@greenwood-academy.edu',
    password: 'Password@123',
    tenant_slug: 'greenwood-academy',
    user: {
      id: 'user-school-admin',
      email: 'admin@greenwood-academy.edu',
      first_name: 'Robert',
      last_name: 'Anderson',
      role: 'SCHOOL_ADMIN',
      tenant_id: 'tenant-greenwood',
    },
  },
  {
    email: 'priya.sharma@greenwood-academy.edu',
    password: 'Password@123',
    tenant_slug: 'greenwood-academy',
    user: {
      id: 'user-teacher',
      email: 'priya.sharma@greenwood-academy.edu',
      first_name: 'Priya',
      last_name: 'Sharma',
      role: 'TEACHER',
      tenant_id: 'tenant-greenwood',
    },
  },
  {
    email: 'aiden.brooks@greenwood-academy.edu',
    password: 'Password@123',
    tenant_slug: 'greenwood-academy',
    user: {
      id: 'user-student',
      email: 'aiden.brooks@greenwood-academy.edu',
      first_name: 'Aiden',
      last_name: 'Brooks',
      role: 'STUDENT',
      tenant_id: 'tenant-greenwood',
    },
  },
]
