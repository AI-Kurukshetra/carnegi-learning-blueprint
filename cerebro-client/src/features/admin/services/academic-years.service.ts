import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { AcademicYear } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface ListAcademicYearsParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateAcademicYearPayload {
  name: string
  start_date: string
  end_date: string
  is_active?: boolean
}

export type UpdateAcademicYearPayload = Partial<CreateAcademicYearPayload>

export async function listAcademicYears(
  params: ListAcademicYearsParams,
): Promise<PaginatedResult<AcademicYear>> {
  const requestParams = { ...params }
  delete (requestParams as { search?: string }).search
  const response = await apiClient.get<ApiSuccess<AcademicYear[]>>('/academic-years', { params: requestParams })
  return unwrapListResponse(response.data, params)
}

export async function createAcademicYear(payload: CreateAcademicYearPayload): Promise<AcademicYear> {
  const response = await apiClient.post<ApiSuccess<AcademicYear>>('/academic-years', payload)
  return response.data.data
}

export async function updateAcademicYear(
  id: string,
  payload: UpdateAcademicYearPayload,
): Promise<AcademicYear> {
  const response = await apiClient.patch<ApiSuccess<AcademicYear>>(`/academic-years/${id}`, payload)
  return response.data.data
}

export async function deleteAcademicYear(id: string): Promise<void> {
  await apiClient.delete(`/academic-years/${id}`)
}
