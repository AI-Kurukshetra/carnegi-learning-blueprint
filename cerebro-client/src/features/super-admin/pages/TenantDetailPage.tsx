import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import type { Invoice, TenantUser } from '@/types/domain.types'
import { formatDate } from '@/utils/formatDate'
import { useTenantById } from '../hooks/useTenants'
import { useTenantInvoices, useTenantUsers } from '../hooks/useSuperAdminData'

type Tab = 'overview' | 'users' | 'invoices'

export default function TenantDetailPage() {
  const { id } = useParams()
  const tenantId = id ?? ''
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: tenant, isLoading, isError, refetch } = useTenantById(tenantId)
  const { data: users = [], isLoading: usersLoading } = useTenantUsers(tenantId)
  const { data: invoices = [], isLoading: invoicesLoading } = useTenantInvoices(tenantId)

  if (!tenantId) {
    return <EmptyState title="Missing tenant id" description="Open tenant detail from the tenants listing." />
  }

  if (isLoading) return <LoadingState message="Loading tenant details..." />
  if (isError || !tenant) return <ErrorState message="Failed to load tenant details." onRetry={() => void refetch()} />

  const teachers = users.filter((u) => u.role === 'TEACHER')
  const students = users.filter((u) => u.role === 'STUDENT')
  const paidInvoices = invoices.filter((inv) => inv.status === 'PAID')
  const pendingInvoices = invoices.filter((inv) => inv.status === 'PENDING')

  const userColumns: DataTableColumn<TenantUser>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div>
          <p className="font-medium text-text-main">{u.first_name} {u.last_name}</p>
          <p className="text-xs text-text-main/65">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <Badge tone={u.role === 'TEACHER' ? 'success' : 'default'}>{u.role}</Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => u.is_active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>,
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (u) => formatDate(u.created_at),
    },
  ]

  const invoiceColumns: DataTableColumn<Invoice>[] = [
    {
      key: 'description',
      header: 'Description',
      render: (inv) => <span className="text-sm text-text-main">{inv.description ?? '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (inv) => (
        <span className="font-semibold text-text-main">
          {inv.currency} {Number(inv.amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv) => {
        const toneMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
          PAID: 'success',
          PENDING: 'warning',
          OVERDUE: 'danger',
          CANCELLED: 'default',
        }
        return <Badge tone={toneMap[inv.status] ?? 'default'}>{inv.status}</Badge>
      },
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (inv) => formatDate(inv.due_date),
    },
    {
      key: 'paid_at',
      header: 'Paid At',
      render: (inv) => (inv.paid_at ? formatDate(inv.paid_at) : '—'),
    },
  ]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: `Users (${users.length})` },
    { key: 'invoices', label: `Invoices (${invoices.length})` },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-main/65">Tenant Detail</p>
            <h2 className="text-2xl font-bold text-text-main">{tenant.name}</h2>
            <p className="mt-1 text-sm text-text-main/70">{tenant.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            {tenant.is_active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
            <Link to="/super-admin/tenants">
              <Button type="button" variant="ghost">Back</Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-b-2 border-brand-blue text-brand-blue'
                  : 'text-text-main/65 hover:text-text-main',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === 'overview' && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Tenant ID</p>
              <p className="mt-2 break-all text-sm text-text-main">{tenant.id}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">School Admin Email</p>
              <p className="mt-2 text-sm text-text-main">{tenant.admin_user?.email ?? 'Not available'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Created At</p>
              <p className="mt-2 text-sm text-text-main">{formatDate(tenant.created_at)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Updated At</p>
              <p className="mt-2 text-sm text-text-main">{tenant.updated_at ? formatDate(tenant.updated_at) : '—'}</p>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Total Users</p>
              <p className="mt-2 text-2xl font-bold text-brand-blue">{users.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Teachers</p>
              <p className="mt-2 text-2xl font-bold text-brand-blue">{teachers.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Students</p>
              <p className="mt-2 text-2xl font-bold text-brand-blue">{students.length}</p>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Total Invoices</p>
              <p className="mt-2 text-2xl font-bold text-brand-blue">{invoices.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-text-main/65">Pending Invoices</p>
              <p className="mt-2 text-2xl font-bold text-vivid-orange">{pendingInvoices.length}</p>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold text-text-main">Users under {tenant.name}</h3>
          {usersLoading ? (
            <LoadingState message="Loading users..." />
          ) : users.length === 0 ? (
            <EmptyState title="No users found" description="No teachers or students have been added to this tenant yet." />
          ) : (
            <DataTable columns={userColumns} rows={users} rowKey={(u) => u.id} />
          )}
        </Card>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {invoicesLoading ? (
            <LoadingState message="Loading invoices..." />
          ) : (
            <>
              <Card className="p-5">
                <h3 className="mb-4 text-base font-semibold text-text-main">Paid Invoices ({paidInvoices.length})</h3>
                {paidInvoices.length === 0 ? (
                  <EmptyState title="No paid invoices" description="No invoices have been paid for this tenant." />
                ) : (
                  <DataTable columns={invoiceColumns} rows={paidInvoices} rowKey={(inv) => inv.id} />
                )}
              </Card>
              <Card className="p-5">
                <h3 className="mb-4 text-base font-semibold text-text-main">Pending Invoices ({pendingInvoices.length})</h3>
                {pendingInvoices.length === 0 ? (
                  <EmptyState title="No pending invoices" description="No pending invoices for this tenant." />
                ) : (
                  <DataTable columns={invoiceColumns} rows={pendingInvoices} rowKey={(inv) => inv.id} />
                )}
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
