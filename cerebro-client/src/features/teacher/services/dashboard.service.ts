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
