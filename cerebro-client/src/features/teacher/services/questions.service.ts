import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Question } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from '@/features/admin/services/common'

export interface ListQuestionsParams {
  page?: number
  limit?: number
  search?: string
  review_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  learning_objective_id?: string
}

export interface QuestionOptionPayload {
  text: string
  is_correct: boolean
  rationale?: string
  order_index: number
}

export interface CreateQuestionPayload {
  learning_objective_id: string
  type: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
  stem: string
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD'
  bloom_level: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'
  is_ai_generated?: boolean
  hints?: string[]
  options?: QuestionOptionPayload[]
}

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>

export async function listQuestions(params: ListQuestionsParams): Promise<PaginatedResult<Question>> {
  const { search: _search, ...requestParams } = params
  const cleanParams = Object.fromEntries(
    Object.entries(requestParams).filter(([, v]) => v !== undefined && v !== ''),
  )
  const response = await apiClient.get<ApiSuccess<Question[]>>('/questions', { params: cleanParams })
  return unwrapListResponse(response.data, params)
}

export async function createQuestion(payload: CreateQuestionPayload): Promise<Question> {
  const response = await apiClient.post<ApiSuccess<Question>>('/questions', payload)
  return response.data.data
}

export async function getQuestionById(id: string): Promise<Question> {
  const response = await apiClient.get<ApiSuccess<Question>>(`/questions/${id}`)
  return response.data.data
}

export async function updateQuestion(id: string, payload: UpdateQuestionPayload): Promise<Question> {
  const response = await apiClient.patch<ApiSuccess<Question>>(`/questions/${id}`, payload)
  return response.data.data
}

export async function deleteQuestion(id: string): Promise<void> {
  await apiClient.delete(`/questions/${id}`)
}
