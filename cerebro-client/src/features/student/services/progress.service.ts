import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'

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

export interface StudentMilestone {
  id: string
  title: string
  description: string | null
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  completion_pct: number
  due_date: string | null
  completed_at: string | null
  created_at: string
  classroom: {
    name: string
    subject: { name: string }
  }
  created_by: {
    first_name: string
    last_name: string
  }
  tasks: MilestoneTask[]
}

export async function getMyMilestones(): Promise<StudentMilestone[]> {
  const response = await apiClient.get<ApiSuccess<StudentMilestone[]>>(
    '/student/my-progress/milestones',
  )
  return response.data.data
}

// ── Analytics Types ──────────────────────────────────────

export interface BloomStats {
  total: number
  correct: number
  percentage: number
}

export interface SubjectQuadrant {
  subject_name: string
  subject_id: string
  total_questions: number
  correct_answers: number
  score_percentage: number
  bloom_breakdown: Record<string, BloomStats>
}

export interface StudentAnalytics {
  summary: string
  focus_areas: string[]
  study_recommendations: string[]
  strengths_narrative: string
  growth_narrative: string
  bloom_taxonomy: Record<string, BloomStats>
  subject_quadrants: SubjectQuadrant[]
  overall_stats: {
    total_assessments: number
    total_questions_answered: number
    total_correct: number
    overall_accuracy: number
    milestone_completion_pct: number
  }
}

export interface StudentAnalyticsResponse {
  analytics: StudentAnalytics | null
  generated_at: string | null
}

export async function getMyAnalytics(): Promise<StudentAnalyticsResponse> {
  const response = await apiClient.get<ApiSuccess<StudentAnalyticsResponse>>(
    '/student/analytics',
  )
  return response.data.data
}

export async function createMilestoneTask(
  milestoneId: string,
  description: string,
): Promise<MilestoneTask> {
  const response = await apiClient.post<ApiSuccess<MilestoneTask>>(
    `/student/milestones/${milestoneId}/tasks`,
    { description },
  )
  return response.data.data
}
