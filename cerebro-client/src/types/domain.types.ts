import type { Role } from './roles'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: Role
  tenant_id: string | null
  is_verified?: boolean
  last_login_at?: string | null
}

export interface TenantAdminUser {
  id: string
  email: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at?: string
  deleted_at?: string | null
  admin_user?: TenantAdminUser
}

export interface SchoolProfile {
  id: string
  tenant_id: string
  address: string | null
  phone: string | null
  logo_url: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface AcademicYear {
  id: string
  tenant_id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  tenant_id: string
  name: string
  code: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompetencyStandard {
  id: string
  tenant_id: string
  code: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Grade {
  id: string
  tenant_id: string
  academic_year_id: string
  name: string
  level_number: number
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  tenant_id: string
  grade_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Classroom {
  id: string
  tenant_id: string
  section_id: string
  subject_id: string
  teacher_id: string
  academic_year_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  tenant_id: string
  learning_objective_id: string
  created_by_id: string
  type: string
  stem: string
  difficulty_level: string
  bloom_level: string
  review_status: string
  is_ai_generated: boolean
  hints: unknown
  created_at: string
  updated_at: string
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface Invoice {
  id: string
  tenant_id: string
  amount: string
  currency: string
  status: InvoiceStatus
  due_date: string
  paid_at?: string | null
  description?: string | null
  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'TEACHER' | 'STUDENT'
  is_active: boolean
  created_at: string
}

export interface SuperAdminStats {
  total_tenants: number
  total_users: number
  total_revenue: number
  pending_invoices: number
  ai_usage_percentage: number
}

export interface AdaptiveConfig {
  starting_difficulty: string
  consecutive_correct_to_upgrade: number
  consecutive_wrong_to_downgrade: number
  max_questions: number
}

export type AssessmentMode = 'FIXED' | 'ADAPTIVE' | 'SEMI_ADAPTIVE'

export interface Assessment {
  id: string
  tenant_id: string
  classroom_id: string
  created_by_id: string
  title: string
  description: string | null
  type: string
  mode: AssessmentMode
  status: string
  due_at: string | null
  time_limit_minutes: number | null
  has_randomized_questions: boolean
  is_adaptive: boolean
  adaptive_config: AdaptiveConfig | null
  total_marks: number | null
  question_count: number | null
  created_at: string
  updated_at: string
}
