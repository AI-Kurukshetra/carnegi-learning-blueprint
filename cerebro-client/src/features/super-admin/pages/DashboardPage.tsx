import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import type { Tenant } from '@/types/domain.types'
import { formatDate } from '@/utils/formatDate'
import { useTenants } from '../hooks/useTenants'
import { useSuperAdminStats } from '../hooks/useSuperAdminData'

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useTenants({ page: 1, limit: 20 })
  const { data: stats } = useSuperAdminStats()

  if (isLoading) {
    return <LoadingState message="Loading super admin dashboard..." />
  }

  if (isError) {
    return <ErrorState message="Failed to load dashboard data." onRetry={() => void refetch()} />
  }

  const tenants = data?.data ?? []
  const total = data?.meta.total ?? 0
  const active = tenants.filter((tenant) => tenant.is_active).length
  const inactive = tenants.filter((tenant) => !tenant.is_active).length

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'name',
      header: 'Recent Tenant',
      render: (tenant) => (
        <div>
          <p className="font-semibold text-text-main">{tenant.name}</p>
          <p className="text-xs text-text-main/70">{tenant.slug}</p>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (tenant) =>
        tenant.is_active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (tenant) => formatDate(tenant.created_at),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (tenant) => (
        <Link to={`/super-admin/tenants/${tenant.id}`}>
          <Button type="button" variant="ghost">
            Open
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Super Admin Dashboard</h2>
            <p className="text-sm text-text-main/75">Tenant overview with quick operational visibility.</p>
          </div>
          <Link to="/super-admin/tenants">
            <Button type="button">Manage Tenants</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/65">Total Tenants</p>
          <p className="mt-2 text-2xl font-bold text-brand-blue">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/65">Active</p>
          <p className="mt-2 text-2xl font-bold text-brand-blue">{active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/65">Inactive</p>
          <p className="mt-2 text-2xl font-bold text-vivid-orange">{inactive}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/65">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-success-green">${stats?.total_revenue.toFixed(2) ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/65">Pending Invoices</p>
          <p className="mt-2 text-2xl font-bold text-vivid-orange">{stats?.pending_invoices ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/65">AI Usage</p>
          <p className="mt-2 text-2xl font-bold text-brand-blue">{stats?.ai_usage_percentage ?? 68}%</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold text-text-main">Recent Tenants</h3>
        {tenants.length === 0 ? (
          <EmptyState title="No tenants available" description="Create a tenant to start onboarding schools." />
        ) : (
          <DataTable columns={columns} rows={tenants.slice(0, 5)} rowKey={(tenant) => tenant.id} />
        )}
      </Card>
    </div>
  )
}
