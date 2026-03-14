import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { CompetencyStandard } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface ListCompetencyStandardsParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateCompetencyStandardPayload {
  code: string
  title: string
  description?: string
}

export type UpdateCompetencyStandardPayload = Partial<CreateCompetencyStandardPayload>

export async function listCompetencyStandards(
  params: ListCompetencyStandardsParams,
): Promise<PaginatedResult<CompetencyStandard>> {
  const requestParams = { ...params }
  delete (requestParams as { search?: string }).search
  const response = await apiClient.get<ApiSuccess<CompetencyStandard[]>>('/competency-standards', { params: requestParams })
  return unwrapListResponse(response.data, params)
}

export async function createCompetencyStandard(
  payload: CreateCompetencyStandardPayload,
): Promise<CompetencyStandard> {
  const response = await apiClient.post<ApiSuccess<CompetencyStandard>>('/competency-standards', payload)
  return response.data.data
}

export async function updateCompetencyStandard(
  id: string,
  payload: UpdateCompetencyStandardPayload,
): Promise<CompetencyStandard> {
  const response = await apiClient.patch<ApiSuccess<CompetencyStandard>>(`/competency-standards/${id}`, payload)
  return response.data.data
}

export async function deleteCompetencyStandard(id: string): Promise<void> {
  await apiClient.delete(`/competency-standards/${id}`)
}
