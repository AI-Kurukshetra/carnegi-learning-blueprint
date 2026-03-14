import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Subject } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface ListSubjectsParams {
  page?: number
  limit?: number
  search?: string
}

export interface CreateSubjectPayload {
  name: string
  code: string
  description?: string
  is_active?: boolean
}

export type UpdateSubjectPayload = Partial<CreateSubjectPayload>

export async function listSubjects(params: ListSubjectsParams): Promise<PaginatedResult<Subject>> {
  const requestParams = { ...params }
  delete (requestParams as { search?: string }).search
  const response = await apiClient.get<ApiSuccess<Subject[]>>('/subjects', { params: requestParams })
  return unwrapListResponse(response.data, params)
}

export async function createSubject(payload: CreateSubjectPayload): Promise<Subject> {
  const response = await apiClient.post<ApiSuccess<Subject>>('/subjects', payload)
  return response.data.data
}

export async function updateSubject(id: string, payload: UpdateSubjectPayload): Promise<Subject> {
  const response = await apiClient.patch<ApiSuccess<Subject>>(`/subjects/${id}`, payload)
  return response.data.data
}

export async function deleteSubject(id: string): Promise<void> {
  await apiClient.delete(`/subjects/${id}`)
}
