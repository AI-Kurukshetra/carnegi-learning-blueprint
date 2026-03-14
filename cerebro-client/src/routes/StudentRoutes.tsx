import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageLoadingState } from '@/components/shared/LoadingState'

const DashboardPage = lazy(() => import('@/features/student/pages/DashboardPage'))
const AssessmentsPage = lazy(() => import('@/features/student/pages/AssessmentsPage'))
const AssessmentInfoPage = lazy(() => import('@/features/student/pages/AssessmentInfoPage'))
const ActiveAttemptPage = lazy(() => import('@/features/student/pages/ActiveAttemptPage'))
const AttemptResultsPage = lazy(() => import('@/features/student/pages/AttemptResultsPage'))
const ProfilePage = lazy(() => import('@/features/student/pages/ProfilePage'))
const MyProgressPage = lazy(() => import('@/features/student/pages/MyProgressPage'))

export default function StudentRoutes() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoadingState />}>
        <Routes>
          <Route path="dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
          <Route path="assessments" element={<PageWrapper><AssessmentsPage /></PageWrapper>} />
          <Route path="assessments/:id" element={<PageWrapper><AssessmentInfoPage /></PageWrapper>} />
          <Route path="assessments/:id/attempt" element={<ActiveAttemptPage />} />
          <Route path="assessments/:id/results" element={<PageWrapper><AttemptResultsPage /></PageWrapper>} />
          <Route path="progress" element={<PageWrapper><MyProgressPage /></PageWrapper>} />
          <Route path="profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
