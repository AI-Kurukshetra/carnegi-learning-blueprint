import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageLoadingState } from '@/components/shared/LoadingState'

const DashboardPage = lazy(() => import('@/features/super-admin/pages/DashboardPage'))
const TenantsPage = lazy(() => import('@/features/super-admin/pages/TenantsPage'))
const TenantDetailPage = lazy(() => import('@/features/super-admin/pages/TenantDetailPage'))

export default function SuperAdminRoutes() {
  return (
    <AppShell>
      <PageWrapper>
        <Suspense fallback={<PageLoadingState />}>
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </PageWrapper>
    </AppShell>
  )
}
