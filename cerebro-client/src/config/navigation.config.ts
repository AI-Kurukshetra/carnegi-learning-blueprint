import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  Library,
  School,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { API_CONFIG } from './api.config'
import type { Role } from '../types/roles'

export interface NavItem {
  label: string
  icon: LucideIcon
  path: string
  badge?: string
  phase?: 1 | 2
}

const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
  { label: 'Tenants', icon: Building2, path: '/super-admin/tenants' },
]

const SCHOOL_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'School Profile', icon: School, path: '/admin/school-profile' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Academic Years', icon: CalendarDays, path: '/admin/academic-years' },
  { label: 'Classrooms', icon: BookOpen, path: '/admin/classrooms' },
  { label: 'Subjects', icon: Library, path: '/admin/subjects' },
  { label: 'Competency Standards', icon: Award, path: '/admin/competency-standards' },
  {
    label: 'Question Review',
    icon: ClipboardCheck,
    path: '/admin/questions/review',
    badge: 'pending_questions',
  },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics/school', phase: 2 },
]

const TEACHER_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
  { label: 'Classrooms', icon: BookOpen, path: '/teacher/classrooms' },
  { label: 'Curriculum', icon: Library, path: '/teacher/curriculum/subjects' },
  { label: 'Question Bank', icon: HelpCircle, path: '/teacher/questions' },
  { label: 'Assessments', icon: ClipboardList, path: '/teacher/assessments' },
  { label: 'Analytics', icon: BarChart3, path: '/teacher/analytics/classrooms', phase: 2 },
]

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'Assessments', icon: ClipboardList, path: '/student/assessments' },
  { label: 'My Progress', icon: TrendingUp, path: '/student/progress' },
  { label: 'Profile', icon: User, path: '/student/profile' },
]

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  SUPER_ADMIN: SUPER_ADMIN_NAV,
  SCHOOL_ADMIN: SCHOOL_ADMIN_NAV,
  TEACHER: TEACHER_NAV,
  STUDENT: STUDENT_NAV,
}

export function getNavForRole(role: Role) {
  return NAV_BY_ROLE[role].filter((item) => item.phase === undefined || item.phase <= API_CONFIG.APP_PHASE)
}
