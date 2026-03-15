import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'

// ── Types ──────────────────────────────────────────────────

export interface MilestoneTask {
  id: string
  milestone_id: string
  student_id: string
  description: string
  completion_pct: number | null
  teacher_comment: string | null
  reviewed_by_id: string | null
  reviewed_at: string | null
  created_at: string
  reviewed_by: {
    first_name: string
    last_name: string
  } | null
}

export interface ReviewMilestoneTaskPayload {
  completion_pct: number
  teacher_comment?: string
}

export interface Milestone {
  id: string
  tenant_id: string
  student_id: string
  classroom_id: string
  created_by_id: string
  title: string
  description: string | null
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  completion_pct: number
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  tasks?: MilestoneTask[]
}

export interface CreateMilestonePayload {
  title: string
  description?: string
  due_date?: string
}

export interface UpdateMilestonePayload {
  title?: string
  description?: string
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  due_date?: string
}

export interface AssessmentSummaryItem {
  attempt_id: string
  assessment_id: string
  assessment_title: string
  assessment_type: string
  is_adaptive: boolean
  status: string
  score: number | null
  total_marks: number
  score_pct: number | null
  started_at: string
  submitted_at: string | null
}

export interface StudentProgressResponse {
  student: {
    id: string
    email: string
    first_name: string
    last_name: string
    created_at: string
  }
  assessments: {
    data: AssessmentSummaryItem[]
    summary: {
      total_taken: number
      total_submitted: number
      average_score_pct: number | null
      highest_score_pct: number | null
      lowest_score_pct: number | null
    }
  }
  milestones: {
    data: Milestone[]
    summary: {
      total: number
      completed: number
      in_progress: number
      not_started: number
    }
  }
}

export interface AiStudentInsight {
  summary: string
  strengths: string[]
  areas_for_improvement: string[]
  recommended_next_milestone: {
    title: string
    description: string
  }
}

export interface StudentInsightResponse extends StudentProgressResponse {
  insight: AiStudentInsight | null
  generated_at: string | null
}

// ── API Functions ──────────────────────────────────────────

export async function getStudentProgress(
  classroomId: string,
  studentId: string,
): Promise<StudentProgressResponse> {
  const response = await apiClient.get<ApiSuccess<StudentProgressResponse>>(
    `/classrooms/${classroomId}/students/${studentId}/progress`,
  )
  return response.data.data
}

export async function listMilestones(
  classroomId: string,
  studentId: string,
): Promise<Milestone[]> {
  const response = await apiClient.get<ApiSuccess<Milestone[]>>(
    `/classrooms/${classroomId}/students/${studentId}/milestones`,
  )
  return response.data.data
}

export async function createMilestone(
  classroomId: string,
  studentId: string,
  payload: CreateMilestonePayload,
): Promise<Milestone> {
  const response = await apiClient.post<ApiSuccess<Milestone>>(
    `/classrooms/${classroomId}/students/${studentId}/milestones`,
    payload,
  )
  return response.data.data
}

export async function updateMilestone(
  milestoneId: string,
  payload: UpdateMilestonePayload,
): Promise<Milestone> {
  const response = await apiClient.patch<ApiSuccess<Milestone>>(
    `/milestones/${milestoneId}`,
    payload,
  )
  return response.data.data
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  await apiClient.delete(`/milestones/${milestoneId}`)
}

export async function reviewMilestoneTask(
  taskId: string,
  payload: ReviewMilestoneTaskPayload,
): Promise<MilestoneTask> {
  const response = await apiClient.patch<ApiSuccess<MilestoneTask>>(
    `/milestone-tasks/${taskId}/review`,
    payload,
  )
  return response.data.data
}

export async function getStudentInsight(
  classroomId: string,
  studentId: string,
): Promise<StudentInsightResponse> {
  const response = await apiClient.get<ApiSuccess<StudentInsightResponse>>(
    `/classrooms/${classroomId}/students/${studentId}/ai-insight`,
  )
  return response.data.data
}

export async function generateStudentInsight(
  classroomId: string,
  studentId: string,
): Promise<StudentInsightResponse> {
  const response = await apiClient.post<ApiSuccess<StudentInsightResponse>>(
    `/classrooms/${classroomId}/students/${studentId}/ai-insight/generate`,
  )
  return response.data.data
}

// ── Student Analytics ───────────────────────────────────────

export interface StudentAnalyticsResponse {
  analytics: Record<string, unknown> | null
  generated_at: string | null
}

export async function generateStudentAnalytics(
  classroomId: string,
  studentId: string,
): Promise<StudentAnalyticsResponse> {
  const response = await apiClient.post<ApiSuccess<StudentAnalyticsResponse>>(
    `/classrooms/${classroomId}/students/${studentId}/analytics/generate`,
  )
  return response.data.data
}
