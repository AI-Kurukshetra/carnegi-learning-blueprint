import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'

export interface RecentAssessment {
  id: string
  title: string
  type: string
  status: string
  classroom_id: string
  total_marks: number | null
  question_count: number | null
  created_at: string
}

export interface TeacherDashboardData {
  total_students: number
  total_assessments: number
  total_attempts: number
  published_assessments: number
  recent_assessments: RecentAssessment[]
}

export async function getTeacherDashboard(): Promise<TeacherDashboardData> {
  const response = await apiClient.get<ApiSuccess<TeacherDashboardData>>('/dashboard/teacher')
  return response.data.data
}

export interface ClassroomAnalytics {
  summary: string
  bloom_profile: {
    dominant_level: string
    class_orientation: string
    orientation_description: string
  }
  performance_insights: {
    average_score_pct: number
    pass_rate_pct: number
    needs_attention: boolean
  }
  strengths: string[]
  areas_for_improvement: string[]
  recommendations: string[]
}

export interface ClassroomWithAnalytics {
  id: string
  name: string
  subject: { id: string; name: string; code: string } | null
  section: { id: string; name: string } | null
  academic_year: { id: string; name: string } | null
  student_count: number
  assessment_count: number
  milestone_count: number
  analytics: ClassroomAnalytics | null
  analytics_generated_at: string | null
}

export interface ClassroomAnalyticsResponse {
  analytics: ClassroomAnalytics | null
  generated_at: string | null
}

export async function getTeacherClassroomsWithAnalytics(): Promise<ClassroomWithAnalytics[]> {
  const response = await apiClient.get<ApiSuccess<ClassroomWithAnalytics[]>>('/dashboard/teacher/classrooms')
  return response.data.data
}

export async function generateClassroomAnalytics(
  classroomId: string,
): Promise<ClassroomAnalyticsResponse> {
  const response = await apiClient.post<ApiSuccess<ClassroomAnalyticsResponse>>(
    `/dashboard/classrooms/${classroomId}/analytics/generate`,
  )
  return response.data.data
}
