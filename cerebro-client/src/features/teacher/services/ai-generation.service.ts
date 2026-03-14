import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'

export interface GenerateQuestionsRequest {
  learning_objective_id: string
  question_type: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD'
  count: number
}

export interface GeneratedQuestionOption {
  text: string
  is_correct: boolean
  rationale: string
  order_index: number
}

export interface GeneratedQuestion {
  stem: string
  type: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD'
  bloom_level: string
  hints: string[]
  marks: number
  options?: GeneratedQuestionOption[]
}

export type ApprovedQuestion = GeneratedQuestion

export interface GenerationJob {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  result_question_ids: string[]
  generated_questions: GeneratedQuestion[] | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export async function generateQuestions(
  data: GenerateQuestionsRequest,
): Promise<{ job_id: string; status: string }> {
  const response = await apiClient.post<ApiSuccess<{ job_id: string; status: string }>>(
    '/ai/generate-questions',
    data,
  )
  return response.data.data
}

export async function getGenerationJobStatus(jobId: string): Promise<GenerationJob> {
  const response = await apiClient.get<ApiSuccess<GenerationJob>>(`/ai/generate-questions/${jobId}`)
  return response.data.data
}

export async function approveGeneratedQuestions(
  jobId: string,
  questions: ApprovedQuestion[],
): Promise<{ question_ids: string[] }> {
  const response = await apiClient.post<ApiSuccess<{ question_ids: string[] }>>(
    `/ai/generate-questions/${jobId}/approve`,
    { questions },
  )
  return response.data.data
}
