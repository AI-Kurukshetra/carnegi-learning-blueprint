import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PageLoadingState } from '@/components/shared/LoadingState'
import { AuthGuard } from './guards/AuthGuard'
import { RoleGuard } from './guards/RoleGuard'
import { RoleRedirect } from './RoleRedirect'

const LandingPage = lazy(() => import('@/App'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'))
const UnauthorizedPage = lazy(() => import('@/features/auth/pages/UnauthorizedPage'))
const SuperAdminRoutes = lazy(() => import('./SuperAdminRoutes'))
const AdminRoutes = lazy(() => import('./AdminRoutes'))
const TeacherRoutes = lazy(() => import('./TeacherRoutes'))
const StudentRoutes = lazy(() => import('./StudentRoutes'))

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<AuthGuard />}>
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['SCHOOL_ADMIN']} />}>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['TEACHER']} />}>
            <Route path="/teacher/*" element={<TeacherRoutes />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={['STUDENT']} />}>
            <Route path="/student/*" element={<StudentRoutes />} />
          </Route>
          <Route path="/app" element={<RoleRedirect />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
