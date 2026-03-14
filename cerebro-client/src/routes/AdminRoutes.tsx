import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageLoadingState } from '@/components/shared/LoadingState'

const DashboardPage = lazy(() => import('@/features/admin/pages/DashboardPage'))
const SchoolProfilePage = lazy(() => import('@/features/admin/pages/SchoolProfilePage'))
const UsersPage = lazy(() => import('@/features/admin/pages/UsersPage'))
const AcademicYearsPage = lazy(() => import('@/features/admin/pages/AcademicYearsPage'))
const ClassroomsPage = lazy(() => import('@/features/admin/pages/ClassroomsPage'))
const SubjectsPage = lazy(() => import('@/features/admin/pages/SubjectsPage'))
const CompetencyStandardsPage = lazy(() => import('@/features/admin/pages/CompetencyStandardsPage'))
const QuestionReviewPage = lazy(() => import('@/features/admin/pages/QuestionReviewPage'))

export default function AdminRoutes() {
  return (
    <AppShell>
      <PageWrapper>
        <Suspense fallback={<PageLoadingState />}>
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="school-profile" element={<SchoolProfilePage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="academic-years" element={<AcademicYearsPage />} />
            <Route path="classrooms" element={<ClassroomsPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="competency-standards" element={<CompetencyStandardsPage />} />
            <Route path="questions/review" element={<QuestionReviewPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </PageWrapper>
    </AppShell>
  )
}
