import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { User } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface ListUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT'
}

export interface CreateUserPayload {
  email: string
  password: string
  role: 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT'
  first_name: string
  last_name: string
  classroom_id?: string
}

export interface UpdateUserPayload {
  email?: string
  password?: string
  role?: 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT'
  first_name?: string
  last_name?: string
  classroom_id?: string
}

// ── Enriched classroom for assignment dropdown ─────────────

export interface EnrichedClassroomSection {
  id: string
  name: string
}

export interface EnrichedClassroomSubject {
  id: string
  name: string
  code: string
}

export interface EnrichedClassroomAcademicYear {
  id: string
  name: string
}

export interface AdminEnrichedClassroom {
  id: string
  name: string
  section: EnrichedClassroomSection | null
  subject: EnrichedClassroomSubject | null
  academic_year: EnrichedClassroomAcademicYear | null
  student_count?: number
}

// ── API functions ──────────────────────────────────────────

export async function listUsers(params: ListUsersParams): Promise<PaginatedResult<User>> {
  const requestParams = { ...params }
  delete (requestParams as { search?: string }).search
  const response = await apiClient.get<ApiSuccess<User[]>>('/users', { params: requestParams })
  return unwrapListResponse(response.data, params)
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await apiClient.post<ApiSuccess<User>>('/users', payload)
  return response.data.data
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const response = await apiClient.patch<ApiSuccess<User>>(`/users/${id}`, payload)
  return response.data.data
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}

export async function listAdminClassrooms(): Promise<PaginatedResult<AdminEnrichedClassroom>> {
  const response = await apiClient.get<ApiSuccess<AdminEnrichedClassroom[]>>('/classrooms', {
    params: { page: 1, limit: 100 },
  })
  return unwrapListResponse(response.data, { page: 1, limit: 100 })
}

export async function autoAssignEnrollments(): Promise<{ enrolled_count: number }> {
  const response = await apiClient.post<ApiSuccess<{ enrolled_count: number }>>('/enrollments/auto-assign')
  return response.data.data
}
