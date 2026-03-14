import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Question } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from './common'

export interface ListQuestionsReviewParams {
  page?: number
  limit?: number
  search?: string
  review_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export async function listQuestionsForReview(
  params: ListQuestionsReviewParams,
): Promise<PaginatedResult<Question>> {
  const requestParams = { ...params }
  delete (requestParams as { search?: string }).search
  const response = await apiClient.get<ApiSuccess<Question[]>>('/questions', { params: requestParams })
  return unwrapListResponse(response.data, params)
}

export async function reviewQuestion(
  id: string,
  review_status: 'APPROVED' | 'REJECTED',
): Promise<Question> {
  const response = await apiClient.patch<ApiSuccess<Question>>(`/questions/${id}/review`, { review_status })
  return response.data.data
}
