import { useDeferredValue, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatDate'
import type { AcademicYear } from '@/types/domain.types'
import { useAcademicYears, useCreateAcademicYear, useDeleteAcademicYear, useUpdateAcademicYear } from '../hooks/useAdminData'

export default function AcademicYearsPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicYear | null>(null)

  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  })

  const query = useAcademicYears({ page, limit: 10, search: search || undefined })
  const createMutation = useCreateAcademicYear()
  const updateMutation = useUpdateAcademicYear()
  const deleteMutation = useDeleteAcademicYear()

  const columns: DataTableColumn<AcademicYear>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'start_date', header: 'Start', render: (row) => formatDate(row.start_date) },
    { key: 'end_date', header: 'End', render: (row) => formatDate(row.end_date) },
    { key: 'is_active', header: 'Active', render: (row) => (row.is_active ? 'Yes' : 'No') },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(row)
              setForm({
                name: row.name,
                start_date: row.start_date.slice(0, 10),
                end_date: row.end_date.slice(0, 10),
                is_active: row.is_active,
              })
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await deleteMutation.mutateAsync(row.id)
                toast.success('Academic year deleted.')
              } catch {
                toast.error('Failed to delete academic year.')
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (query.isLoading) {
    return <LoadingState message="Loading academic years..." />
  }

  if (query.isError) {
    return <ErrorState message="Failed to load academic years." onRetry={() => void query.refetch()} />
  }

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Academic Years</h2>
            <p className="text-sm text-text-main/70">Manage annual session windows and active year state.</p>
          </div>
          <Button
            onClick={() => {
              setCreateOpen(true)
              setEditing(null)
              setForm({ name: '', start_date: '', end_date: '', is_active: false })
            }}
          >
            Add Academic Year
          </Button>
        </div>
        <SearchInput
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
          placeholder="Search academic years"
        />
        {rows.length === 0 ? (
          <EmptyState title="No academic years found" />
        ) : (
          <>
            <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
            <Pagination page={meta?.page ?? 1} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={createOpen || editing !== null}
        onClose={() => {
          setCreateOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Academic Year' : 'Create Academic Year'}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload: form })
                toast.success('Academic year updated.')
              } else {
                await createMutation.mutateAsync(form)
                toast.success('Academic year created.')
              }
              setCreateOpen(false)
              setEditing(null)
            } catch {
              toast.error('Failed to save academic year.')
            }
          }}
        >
          <FormField label="Name"><Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></FormField>
          <FormField label="Start date"><Input type="date" value={form.start_date} onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))} /></FormField>
          <FormField label="End date"><Input type="date" value={form.end_date} onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))} /></FormField>
          <label className="flex items-center gap-2 text-sm text-text-main">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
            Mark as active
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
