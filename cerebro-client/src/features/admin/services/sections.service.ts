import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Section } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface CreateSectionPayload {
  name: string
}

export type UpdateSectionPayload = Partial<CreateSectionPayload>

export async function listSections(gradeId: string): Promise<PaginatedResult<Section>> {
  const response = await apiClient.get<ApiSuccess<Section[]>>(
    `/grades/${gradeId}/sections`,
    { params: { page: 1, limit: 100 } },
  )
  return unwrapListResponse(response.data)
}

export async function createSection(gradeId: string, payload: CreateSectionPayload): Promise<Section> {
  const response = await apiClient.post<ApiSuccess<Section>>(
    `/grades/${gradeId}/sections`,
    payload,
  )
  return response.data.data
}

export async function updateSection(
  gradeId: string,
  id: string,
  payload: UpdateSectionPayload,
): Promise<Section> {
  const response = await apiClient.patch<ApiSuccess<Section>>(
    `/grades/${gradeId}/sections/${id}`,
    payload,
  )
  return response.data.data
}

export async function deleteSection(gradeId: string, id: string): Promise<void> {
  await apiClient.delete(`/grades/${gradeId}/sections/${id}`)
}
