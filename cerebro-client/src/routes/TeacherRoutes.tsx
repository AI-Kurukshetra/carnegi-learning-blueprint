import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageLoadingState } from '@/components/shared/LoadingState'

const DashboardPage = lazy(() => import('@/features/teacher/pages/DashboardPage'))
const ClassroomsPage = lazy(() => import('@/features/teacher/pages/ClassroomsPage'))
const ClassroomDetailPage = lazy(() => import('@/features/teacher/pages/ClassroomDetailPage'))
const StudentDetailPage = lazy(() => import('@/features/teacher/pages/StudentDetailPage'))
const CurriculumPage = lazy(() => import('@/features/teacher/pages/CurriculumPage'))
const QuestionsPage = lazy(() => import('@/features/teacher/pages/QuestionsPage'))
const QuestionBuilderPage = lazy(() => import('@/features/teacher/pages/QuestionBuilderPage'))
const AssessmentsPage = lazy(() => import('@/features/teacher/pages/AssessmentsPage'))
const AssessmentBuilderPage = lazy(() => import('@/features/teacher/pages/AssessmentBuilderPage'))
const AssessmentDetailPage = lazy(() => import('@/features/teacher/pages/AssessmentDetailPage'))
const AssessmentResultsPage = lazy(() => import('@/features/teacher/pages/AssessmentResultsPage'))

export default function TeacherRoutes() {
  return (
    <AppShell>
      <PageWrapper>
        <Suspense fallback={<PageLoadingState />}>
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="classrooms" element={<ClassroomsPage />} />
            <Route path="classrooms/:id" element={<ClassroomDetailPage />} />
            <Route path="classrooms/:id/students/:studentId" element={<StudentDetailPage />} />
            <Route path="curriculum/subjects" element={<CurriculumPage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="questions/new" element={<QuestionBuilderPage />} />
            <Route path="questions/:id/edit" element={<QuestionBuilderPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="assessments/new" element={<AssessmentBuilderPage />} />
            <Route path="assessments/:id/edit" element={<AssessmentBuilderPage />} />
            <Route path="assessments/:id" element={<AssessmentDetailPage />} />
            <Route path="assessments/:id/results" element={<AssessmentResultsPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </PageWrapper>
    </AppShell>
  )
}
