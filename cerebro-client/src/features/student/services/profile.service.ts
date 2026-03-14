import { apiClient } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api.types'

// ── Types ──────────────────────────────────────────────────

export interface EnrollmentSection {
  id: string
  name: string
}

export interface EnrollmentGrade {
  id: string
  name: string
}

export interface EnrollmentAcademicYear {
  id: string
  name: string
  is_active: boolean
}

export interface StudentEnrollment {
  id: string
  section: EnrollmentSection
  grade: EnrollmentGrade
  academic_year: EnrollmentAcademicYear
  enrolled_at: string
  is_active: boolean
}

export interface ClassroomSubject {
  id: string
  name: string
  code: string
}

export interface ClassroomTeacher {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface ClassroomAcademicYear {
  id: string
  name: string
}

export interface StudentClassroom {
  id: string
  name: string
  subject: ClassroomSubject
  teacher: ClassroomTeacher
  academic_year: ClassroomAcademicYear
}

export interface StudentStats {
  total_attempts: number
  completed_attempts: number
  average_score_percentage: number | null
}

export interface StudentProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_verified: boolean
  last_login_at: string | null
  created_at: string
  enrollments: StudentEnrollment[]
  classrooms: StudentClassroom[]
  stats: StudentStats
}

// ── API Function ────────────────────────────────────────────

export async function getStudentProfile(): Promise<StudentProfile> {
  const response = await apiClient.get<ApiSuccess<StudentProfile>>('/profile/student')
  return response.data.data
}
