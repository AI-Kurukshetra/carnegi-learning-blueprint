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
