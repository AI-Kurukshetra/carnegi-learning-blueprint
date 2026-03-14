import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatDate'
import type { Tenant } from '@/types/domain.types'
import { CreateTenantModal } from '../components/CreateTenantModal'
import { EditTenantModal } from '../components/EditTenantModal'
import { getMutationErrorMessage, useCreateTenant, useDeleteTenant, useTenants, useUpdateTenant } from '../hooks/useTenants'

export default function TenantsPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null)

  const { data, isLoading, isError, refetch } = useTenants({
    page,
    limit: 10,
    search: search.length > 0 ? search : undefined,
  })

  const createMutation = useCreateTenant()
  const updateMutation = useUpdateTenant()
  const deleteMutation = useDeleteTenant()

  const columns = useMemo<DataTableColumn<Tenant>[]>(
    () => [
      {
        key: 'name',
        header: 'Tenant',
        render: (tenant) => (
          <div>
            <p className="font-semibold text-text-main">{tenant.name}</p>
            <p className="text-xs text-slate-500">{tenant.slug}</p>
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
        header: 'Actions',
        className: 'w-64',
        render: (tenant) => (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditingTenant(tenant)}>
              Edit
            </Button>
            <Button
              type="button"
              variant={tenant.is_active ? 'warning' : 'primary'}
              onClick={async () => {
                try {
                  await updateMutation.mutateAsync({
                    id: tenant.id,
                    payload: { is_active: !tenant.is_active },
                  })
                  toast.success(`Tenant ${tenant.is_active ? 'deactivated' : 'activated'}.`)
                } catch (error) {
                  toast.error(getMutationErrorMessage(error, 'Failed to update tenant status.'))
                }
              }}
              disabled={updateMutation.isPending}
            >
              {tenant.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button type="button" variant="danger" onClick={() => setDeleteTarget(tenant)}>
              Delete
            </Button>
            <Link to={`/super-admin/tenants/${tenant.id}`}>
              <Button type="button" variant="ghost">
                View
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [toast, updateMutation],
  )

  if (isLoading) {
    return <LoadingState message="Loading tenants..." />
  }

  if (isError) {
    return <ErrorState message="Failed to load tenants." onRetry={() => void refetch()} />
  }

  const tenants = data?.data ?? []
  const meta = data?.meta

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Tenants</h2>
            <p className="text-sm text-slate-600">
              Add, edit, activate/deactivate, and soft-delete tenant organizations.
            </p>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Add Tenant
          </Button>
        </div>

        <SearchInput
          placeholder="Search by tenant name or slug"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
        />

        {tenants.length === 0 ? (
          <EmptyState
            title="No tenants found"
            description="Create the first tenant organization to onboard a school admin."
          />
        ) : (
          <>
            <DataTable columns={columns} rows={tenants} rowKey={(tenant) => tenant.id} />
            <Pagination page={meta?.page ?? 1} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
          </>
        )}
      </Card>

      <CreateTenantModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        isSubmitting={createMutation.isPending}
        onSubmit={async (payload) => {
          try {
            await createMutation.mutateAsync(payload)
            toast.success('Tenant created successfully.')
          } catch (error) {
            toast.error(getMutationErrorMessage(error, 'Failed to create tenant.'))
            throw error
          }
        }}
      />

      <EditTenantModal
        open={editingTenant !== null}
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        isSubmitting={updateMutation.isPending}
        onSubmit={async (tenantId, payload) => {
          try {
            await updateMutation.mutateAsync({ id: tenantId, payload })
            toast.success('Tenant updated successfully.')
          } catch (error) {
            toast.error(getMutationErrorMessage(error, 'Failed to update tenant.'))
            throw error
          }
        }}
      />

      <Modal
        open={deleteTarget !== null}
        title="Delete Tenant"
        description="This will soft-delete the tenant and make all tenant users inaccessible."
        onClose={() => setDeleteTarget(null)}
        className="max-w-lg"
      >
        <ConfirmDialog
          title={`Delete ${deleteTarget?.name ?? 'tenant'}?`}
          description="This operation is reversible only through backend operations."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (!deleteTarget) return
            try {
              await deleteMutation.mutateAsync(deleteTarget.id)
              toast.success('Tenant deleted successfully.')
              setDeleteTarget(null)
            } catch (error) {
              toast.error(getMutationErrorMessage(error, 'Failed to delete tenant.'))
            }
          }}
        />
      </Modal>
    </>
  )
}
