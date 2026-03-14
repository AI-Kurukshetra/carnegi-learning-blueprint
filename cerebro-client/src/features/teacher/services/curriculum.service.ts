import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Classroom, Subject } from '@/types/domain.types'
import { unwrapListResponse } from '@/features/admin/services/common'

// ── Enriched classroom types ───────────────────────────────────

export interface StudentEnrollment {
  student: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  enrolled_at: string
}

export interface EnrichedSection {
  name: string
  student_enrollments?: StudentEnrollment[]
  _count?: { student_enrollments: number }
}

export interface EnrichedSubject {
  id: string
  name: string
  code: string
}

export interface EnrichedAcademicYear {
  id: string
  name: string
}

export interface ClassroomDetailStudent {
  id: string
  email: string
  first_name: string
  last_name: string
  enrolled_at: string
}

export interface EnrichedClassroom extends Classroom {
  subject: EnrichedSubject
  section: EnrichedSection
  academic_year: EnrichedAcademicYear
  _count?: { assessments: number }
  students?: ClassroomDetailStudent[]
  assessment_count?: number
}

export interface Topic {
  id: string
  tenant_id: string
  subject_id: string
  name: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface LearningObjective {
  id: string
  tenant_id: string
  topic_id: string
  title: string
  description: string | null
  bloom_level: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'
  order_index: number
  created_at: string
  updated_at: string
}

export async function listTeacherClassrooms(): Promise<EnrichedClassroom[]> {
  const response = await apiClient.get<ApiSuccess<EnrichedClassroom[]>>('/classrooms', { params: { page: 1, limit: 100 } })
  return unwrapListResponse(response.data, { page: 1, limit: 100 }).data
}

export async function getClassroomById(id: string): Promise<EnrichedClassroom> {
  const response = await apiClient.get<ApiSuccess<EnrichedClassroom>>(`/classrooms/${id}`)
  return response.data.data
}

export async function listCurriculumSubjects(): Promise<Subject[]> {
  const response = await apiClient.get<ApiSuccess<Subject[]>>('/subjects', { params: { page: 1, limit: 100 } })
  return unwrapListResponse(response.data, { page: 1, limit: 100 }).data
}

export async function listTopics(subjectId: string): Promise<Topic[]> {
  const response = await apiClient.get<ApiSuccess<Topic[]>>(`/subjects/${subjectId}/topics`, {
    params: { page: 1, limit: 100 },
  })
  return unwrapListResponse(response.data, { page: 1, limit: 100 }).data
}

export async function createTopic(
  subjectId: string,
  payload: { name: string; description?: string; order_index: number },
) {
  const response = await apiClient.post<ApiSuccess<Topic>>(`/subjects/${subjectId}/topics`, payload)
  return response.data.data
}

export async function deleteTopic(subjectId: string, topicId: string): Promise<void> {
  await apiClient.delete(`/subjects/${subjectId}/topics/${topicId}`)
}

export async function listLearningObjectives(topicId: string): Promise<LearningObjective[]> {
  const response = await apiClient.get<ApiSuccess<LearningObjective[]>>(
    `/topics/${topicId}/learning-objectives`,
    { params: { page: 1, limit: 100 } },
  )
  return unwrapListResponse(response.data, { page: 1, limit: 100 }).data
}

export async function createLearningObjective(
  topicId: string,
  payload: {
    title: string
    description?: string
    bloom_level: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'
    order_index: number
  },
) {
  const response = await apiClient.post<ApiSuccess<LearningObjective>>(
    `/topics/${topicId}/learning-objectives`,
    payload,
  )
  return response.data.data
}

export async function deleteLearningObjective(topicId: string, learningObjectiveId: string): Promise<void> {
  await apiClient.delete(`/topics/${topicId}/learning-objectives/${learningObjectiveId}`)
}
