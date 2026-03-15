import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Grade } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface CreateGradePayload {
  name: string
  level_number: number
}

export type UpdateGradePayload = Partial<CreateGradePayload>

export async function listGrades(academicYearId: string): Promise<PaginatedResult<Grade>> {
  const response = await apiClient.get<ApiSuccess<Grade[]>>(
    `/academic-years/${academicYearId}/grades`,
    { params: { page: 1, limit: 100 } },
  )
  return unwrapListResponse(response.data)
}

export async function createGrade(academicYearId: string, payload: CreateGradePayload): Promise<Grade> {
  const response = await apiClient.post<ApiSuccess<Grade>>(
    `/academic-years/${academicYearId}/grades`,
    payload,
  )
  return response.data.data
}

export async function updateGrade(
  academicYearId: string,
  id: string,
  payload: UpdateGradePayload,
): Promise<Grade> {
  const response = await apiClient.patch<ApiSuccess<Grade>>(
    `/academic-years/${academicYearId}/grades/${id}`,
    payload,
  )
  return response.data.data
}

export async function deleteGrade(academicYearId: string, id: string): Promise<void> {
  await apiClient.delete(`/academic-years/${academicYearId}/grades/${id}`)
}
