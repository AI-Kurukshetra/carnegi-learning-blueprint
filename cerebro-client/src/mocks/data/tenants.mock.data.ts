import type { Tenant } from '@/types/domain.types'

export const mockTenants: Tenant[] = [
  {
    id: '1f6ab3b9-660d-4550-a766-f20d4f8d6d11',
    name: 'Greenwood International School',
    slug: 'greenwood-international',
    is_active: true,
    created_at: '2026-01-04T10:25:00.000Z',
    updated_at: '2026-03-10T08:00:00.000Z',
    deleted_at: null,
    admin_user: {
      id: '2f6ab3b9-660d-4550-a766-f20d4f8d6d21',
      email: 'admin@greenwood.edu',
    },
  },
  {
    id: '3f6ab3b9-660d-4550-a766-f20d4f8d6d31',
    name: 'Northbridge Academy',
    slug: 'northbridge-academy',
    is_active: true,
    created_at: '2026-01-19T12:10:00.000Z',
    updated_at: '2026-03-01T09:15:00.000Z',
    deleted_at: null,
    admin_user: {
      id: '4f6ab3b9-660d-4550-a766-f20d4f8d6d41',
      email: 'principal@northbridge.edu',
    },
  },
  {
    id: '5f6ab3b9-660d-4550-a766-f20d4f8d6d51',
    name: 'Sunrise Public School',
    slug: 'sunrise-public-school',
    is_active: false,
    created_at: '2025-12-12T07:55:00.000Z',
    updated_at: '2026-02-14T16:42:00.000Z',
    deleted_at: null,
    admin_user: {
      id: '6f6ab3b9-660d-4550-a766-f20d4f8d6d61',
      email: 'admin@sunrise.edu',
    },
  },
]
