import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'
import type { Assessment } from '@/types/domain.types'
import { unwrapListResponse, type PaginatedResult } from '@/features/admin/services/common'

// ── Types ──────────────────────────────────────────────────

export interface ListStudentAssessmentsParams {
  page?: number
  limit?: number
  completion?: 'PENDING' | 'COMPLETED'
  type?: string
}

export interface QuestionOption {
  id: string
  text: string
  order_index: number
}

export interface AssessmentQuestion {
  id: string
  question_id: string
  order_index: number
  marks: number
  question: {
    id: string
    type: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
    stem: string
    difficulty_level: string
    bloom_level: string
    hints: string[]
    question_options: QuestionOption[]
  }
}

export interface AssessmentWithQuestions extends Assessment {
  assessment_questions: AssessmentQuestion[]
}

export interface AttemptResponseSelection {
  id: string
  option_id: string
}

export interface AttemptResponse {
  id: string
  question_id: string
  text_response: string | null
  is_correct: boolean | null
  marks_awarded: number | null
  time_spent_seconds: number
  hint_level_used: number | null
  attempt_response_selections: AttemptResponseSelection[]
}

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

export interface AssessmentAttempt {
  id: string
  assessment_id: string
  student_id: string
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED'
  started_at: string
  submitted_at: string | null
  score: number | null
  total_marks: number
  selected_question_ids?: string[] | null
  question_breakdown?: QuestionBreakdownItem[] | null
  attempt_responses?: AttemptResponse[]
}

export interface SubmitResponsePayload {
  question_id: string
  text_response?: string
  option_ids?: string[]
  time_spent_seconds?: number
  hint_level_used?: number
}

export interface AdaptiveProgress {
  questions_answered: number
  current_difficulty: string
  max_questions: number
  difficulty_changed?: boolean
  new_difficulty?: string
}

export interface AdaptiveFeedback {
  is_correct: boolean
  correct_option_ids: string[]
}

export interface AdaptiveStartResponse {
  attempt: AssessmentAttempt
  current_question: AdaptiveQuestionData | null
  progress: AdaptiveProgress
}

export interface AdaptiveQuestionData {
  id: string
  type: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
  stem: string
  difficulty_level: string
  bloom_level: string
  hints: string[]
  question_options: QuestionOption[]
  sequence_order: number
}

export interface AdaptiveSubmitResponseResult {
  response: AttemptResponse
  feedback: AdaptiveFeedback
  progress: AdaptiveProgress
}

export interface AdaptiveNextQuestionResponse {
  completed: boolean
  current_question: AdaptiveQuestionData | null
  progress: AdaptiveProgress
}

// Semi-Adaptive types (same endpoints, different progress shape)
export interface SemiAdaptiveProgress {
  questions_answered: number
  total_questions: number
  completed: boolean
  has_next?: boolean
  challenge_injected?: boolean
}

export interface SemiAdaptiveStartResponse {
  attempt: AssessmentAttempt
  current_question: AdaptiveQuestionData | null
  progress: SemiAdaptiveProgress
}

export interface SemiAdaptiveSubmitResponseResult {
  response: AttemptResponse
  feedback: AdaptiveFeedback
  progress: SemiAdaptiveProgress
}

export interface SemiAdaptiveNextQuestionResponse {
  completed: boolean
  current_question: AdaptiveQuestionData | null
  progress: SemiAdaptiveProgress
}

// Semi-adaptive reuses the same endpoints as adaptive
export async function startSemiAdaptiveAttempt(assessmentId: string): Promise<SemiAdaptiveStartResponse> {
  const response = await apiClient.post<ApiSuccess<SemiAdaptiveStartResponse>>(`/assessments/${assessmentId}/attempts`)
  return response.data.data
}

export async function submitSemiAdaptiveResponse(
  assessmentId: string,
  attemptId: string,
  payload: SubmitResponsePayload,
): Promise<SemiAdaptiveSubmitResponseResult> {
  const response = await apiClient.post<ApiSuccess<SemiAdaptiveSubmitResponseResult>>(
    `/assessments/${assessmentId}/attempts/${attemptId}/responses`,
    payload,
  )
  return response.data.data
}

export async function getSemiAdaptiveNextQuestion(
  assessmentId: string,
  attemptId: string,
): Promise<SemiAdaptiveNextQuestionResponse> {
  const response = await apiClient.get<ApiSuccess<SemiAdaptiveNextQuestionResponse>>(
    `/assessments/${assessmentId}/attempts/${attemptId}/next-question`,
  )
  return response.data.data
}

// Analytics types
export interface DifficultyBreakdown {
  total: number
  correct: number
  wrong: number
  percentage: number
  avg_time_seconds: number
}

export interface BloomBreakdown {
  total: number
  correct: number
  percentage: number
}

export interface LOBreakdown {
  learning_objective_id: string
  title: string
  total: number
  correct: number
  percentage: number
  strength: 'STRONG' | 'MODERATE' | 'WEAK'
}

export interface AdaptiveAnalytics {
  summary: {
    total_questions: number
    total_correct: number
    total_wrong: number
    score: number
    total_marks: number
    percentage: number
    total_time_seconds: number
    average_time_per_question_seconds: number
  }
  by_difficulty: Record<string, DifficultyBreakdown>
  by_bloom_level: Record<string, BloomBreakdown>
  by_learning_objective: LOBreakdown[]
  difficulty_progression: Array<{
    sequence_order: number
    difficulty: string
    is_correct: boolean
  }>
  time_per_question: Array<{
    sequence_order: number
    question_id: string
    time_spent_seconds: number
    difficulty: string
  }>
}

export interface AssessmentAttemptWithAnalytics extends AssessmentAttempt {
  analytics?: AdaptiveAnalytics
}

// ── API Functions ──────────────────────────────────────────

// List published assessments for the student (server auto-filters by enrolled classrooms)
export async function listStudentAssessments(params: ListStudentAssessmentsParams): Promise<PaginatedResult<Assessment>> {
  const response = await apiClient.get<ApiSuccess<Assessment[]>>('/assessments', { params })
  return unwrapListResponse(response.data, params)
}

// Get assessment detail with full questions (correct answers stripped by server for students)
export async function getStudentAssessmentById(id: string): Promise<AssessmentWithQuestions> {
  const response = await apiClient.get<ApiSuccess<AssessmentWithQuestions>>(`/assessments/${id}`)
  return response.data.data
}

// Start or resume an attempt
export async function startAttempt(assessmentId: string): Promise<AssessmentAttempt> {
  const response = await apiClient.post<ApiSuccess<AssessmentAttempt>>(`/assessments/${assessmentId}/attempts`)
  return response.data.data
}

// Get student's attempts for an assessment
export async function getMyAttempts(assessmentId: string): Promise<AssessmentAttempt[]> {
  const response = await apiClient.get<ApiSuccess<AssessmentAttempt[]>>(`/assessments/${assessmentId}/attempts/my`)
  return response.data.data
}

// Get a specific attempt with all responses
export async function getAttemptById(assessmentId: string, attemptId: string): Promise<AssessmentAttempt> {
  const response = await apiClient.get<ApiSuccess<AssessmentAttempt>>(`/assessments/${assessmentId}/attempts/${attemptId}`)
  return response.data.data
}

// Submit/update a response to a single question
export async function submitResponse(assessmentId: string, attemptId: string, payload: SubmitResponsePayload): Promise<AttemptResponse> {
  const response = await apiClient.post<ApiSuccess<AttemptResponse>>(`/assessments/${assessmentId}/attempts/${attemptId}/responses`, payload)
  return response.data.data
}

// Submit the entire attempt for grading
export async function submitAttempt(assessmentId: string, attemptId: string): Promise<AssessmentAttempt> {
  const response = await apiClient.patch<ApiSuccess<AssessmentAttempt>>(`/assessments/${assessmentId}/attempts/${attemptId}/submit`)
  return response.data.data
}

// Get attempt results
export async function getAttemptResults(assessmentId: string, attemptId: string): Promise<AssessmentAttempt> {
  const response = await apiClient.get<ApiSuccess<AssessmentAttempt>>(`/assessments/${assessmentId}/attempts/${attemptId}/results`)
  return response.data.data
}

// Start adaptive attempt (returns attempt + first question)
export async function startAdaptiveAttempt(assessmentId: string): Promise<AdaptiveStartResponse> {
  const response = await apiClient.post<ApiSuccess<AdaptiveStartResponse>>(`/assessments/${assessmentId}/attempts`)
  return response.data.data
}

// Submit response for adaptive (returns feedback + progress)
export async function submitAdaptiveResponse(
  assessmentId: string,
  attemptId: string,
  payload: SubmitResponsePayload,
): Promise<AdaptiveSubmitResponseResult> {
  const response = await apiClient.post<ApiSuccess<AdaptiveSubmitResponseResult>>(
    `/assessments/${assessmentId}/attempts/${attemptId}/responses`,
    payload,
  )
  return response.data.data
}

// Get next question for adaptive
export async function getNextQuestion(
  assessmentId: string,
  attemptId: string,
): Promise<AdaptiveNextQuestionResponse> {
  const response = await apiClient.get<ApiSuccess<AdaptiveNextQuestionResponse>>(
    `/assessments/${assessmentId}/attempts/${attemptId}/next-question`,
  )
  return response.data.data
}

// Get attempt results with analytics
export async function getAttemptWithAnalytics(
  assessmentId: string,
  attemptId: string,
): Promise<AssessmentAttemptWithAnalytics> {
  const response = await apiClient.get<ApiSuccess<AssessmentAttemptWithAnalytics>>(
    `/assessments/${assessmentId}/attempts/${attemptId}/results`,
  )
  return response.data.data
}
