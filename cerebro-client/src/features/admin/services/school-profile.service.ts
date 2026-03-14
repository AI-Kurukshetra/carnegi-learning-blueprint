import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { SchoolProfile } from '@/types/domain.types'

export interface UpdateSchoolProfilePayload {
  address?: string
  phone?: string
  logo_url?: string
  timezone?: string
}

export async function getSchoolProfile(): Promise<SchoolProfile> {
  const response = await apiClient.get<ApiSuccess<SchoolProfile>>('/school-profile')
  return response.data.data
}

export async function updateSchoolProfile(payload: UpdateSchoolProfilePayload): Promise<SchoolProfile> {
  const response = await apiClient.put<ApiSuccess<SchoolProfile>>('/school-profile', payload)
  return response.data.data
}
