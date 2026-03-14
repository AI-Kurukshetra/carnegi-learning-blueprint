import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Assessment, AssessmentMode } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from '@/features/admin/services/common'

export interface ListAssessmentsParams {
  page?: number
  limit?: number
  search?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  classroom_id?: string
}

export interface CreateAssessmentPayload {
  classroom_id: string
  title: string
  description?: string
  type: 'QUIZ' | 'EXAM' | 'PRACTICE'
  mode?: AssessmentMode
  due_at?: string
  time_limit_minutes?: number
  has_randomized_questions?: boolean
  question_count?: number
}

export type UpdateAssessmentPayload = Partial<CreateAssessmentPayload> & {
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
}

export interface AssessmentQuestionLink {
  assessment_id: string
  question_id: string
  order_index: number
  marks: number
}

export interface AssessmentDetail extends Assessment {
  assessment_questions: AssessmentQuestionLink[]
}

export interface AddAssessmentQuestionPayload {
  question_id: string
  order_index: number
  marks: number
}

export interface ReorderAssessmentQuestionsPayload {
  items: Array<{
    question_id: string
    order_index: number
    marks?: number
  }>
}

export async function listAssessments(params: ListAssessmentsParams): Promise<PaginatedResult<Assessment>> {
  const requestParams = { ...params }
  delete (requestParams as { search?: string }).search
  const response = await apiClient.get<ApiSuccess<Assessment[]>>('/assessments', { params: requestParams })
  return unwrapListResponse(response.data, params)
}

export async function createAssessment(payload: CreateAssessmentPayload): Promise<Assessment> {
  const response = await apiClient.post<ApiSuccess<Assessment>>('/assessments', payload)
  return response.data.data
}

export async function getAssessmentById(id: string): Promise<AssessmentDetail> {
  const response = await apiClient.get<ApiSuccess<AssessmentDetail>>(`/assessments/${id}`)
  return response.data.data
}

export async function updateAssessment(id: string, payload: UpdateAssessmentPayload): Promise<Assessment> {
  const response = await apiClient.patch<ApiSuccess<Assessment>>(`/assessments/${id}`, payload)
  return response.data.data
}

export async function publishAssessment(id: string): Promise<Assessment> {
  const response = await apiClient.patch<ApiSuccess<Assessment>>(`/assessments/${id}/publish`)
  return response.data.data
}

export async function closeAssessment(id: string): Promise<Assessment> {
  const response = await apiClient.patch<ApiSuccess<Assessment>>(`/assessments/${id}/close`)
  return response.data.data
}

export async function addQuestionToAssessment(
  id: string,
  payload: AddAssessmentQuestionPayload,
): Promise<AssessmentDetail> {
  const response = await apiClient.post<ApiSuccess<AssessmentDetail>>(`/assessments/${id}/questions`, payload)
  return response.data.data
}

export async function removeQuestionFromAssessment(id: string, questionId: string): Promise<void> {
  await apiClient.delete(`/assessments/${id}/questions/${questionId}`)
}

export async function reorderAssessmentQuestions(
  id: string,
  payload: ReorderAssessmentQuestionsPayload,
): Promise<AssessmentDetail> {
  const response = await apiClient.patch<ApiSuccess<AssessmentDetail>>(`/assessments/${id}/questions/reorder`, payload)
  return response.data.data
}

export async function deleteAssessment(id: string): Promise<void> {
  await apiClient.delete(`/assessments/${id}`)
}

// ── Teacher Attempt Review ────────────────────────────────

export interface QuestionBreakdownOption {
  id: string
  text: string
  order_index: number
  is_correct: boolean
  was_selected: boolean
}

export interface QuestionBreakdownItem {
  question_id: string
  sequence_order: number
  stem: string
  type: string
  difficulty_level: string
  bloom_level: string
  learning_objective: string | null
  marks: number
  marks_awarded: number
  is_correct: boolean | null
  time_spent_seconds: number
  text_response: string | null
  options: QuestionBreakdownOption[]
}

export interface StudentAttemptSummary {
  id: string
  assessment_id: string
  student_id: string
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED'
  started_at: string
  submitted_at: string | null
  score: number | null
  total_marks: number
  question_breakdown?: QuestionBreakdownItem[] | null
  analytics?: unknown
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export async function listAssessmentAttempts(assessmentId: string): Promise<StudentAttemptSummary[]> {
  const response = await apiClient.get<ApiSuccess<StudentAttemptSummary[]>>(
    `/assessments/${assessmentId}/attempts/all`,
  )
  return response.data.data
}

export async function getAttemptDetail(
  assessmentId: string,
  attemptId: string,
): Promise<StudentAttemptSummary> {
  const response = await apiClient.get<ApiSuccess<StudentAttemptSummary>>(
    `/assessments/${assessmentId}/attempts/${attemptId}/results`,
  )
  return response.data.data
}
