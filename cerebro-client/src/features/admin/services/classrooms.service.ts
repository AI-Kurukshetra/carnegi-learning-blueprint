import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Classroom } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface ListClassroomsParams {
  page?: number
  limit?: number
  search?: string
  teacher_id?: string
  academic_year_id?: string
  section_id?: string
}

export interface CreateClassroomPayload {
  section_id: string
  subject_id?: string
  teacher_id?: string
  academic_year_id: string
  name: string
  is_active?: boolean
}

export type UpdateClassroomPayload = Partial<CreateClassroomPayload>

export async function listClassrooms(params: ListClassroomsParams): Promise<PaginatedResult<Classroom>> {
  const requestParams = { ...params }
  delete (requestParams as { search?: string }).search
  const response = await apiClient.get<ApiSuccess<Classroom[]>>('/classrooms', { params: requestParams })
  return unwrapListResponse(response.data, params)
}

export async function createClassroom(payload: CreateClassroomPayload): Promise<Classroom> {
  const response = await apiClient.post<ApiSuccess<Classroom>>('/classrooms', payload)
  return response.data.data
}

export async function updateClassroom(id: string, payload: UpdateClassroomPayload): Promise<Classroom> {
  const response = await apiClient.patch<ApiSuccess<Classroom>>(`/classrooms/${id}`, payload)
  return response.data.data
}

export async function deleteClassroom(id: string): Promise<void> {
  await apiClient.delete(`/classrooms/${id}`)
}
