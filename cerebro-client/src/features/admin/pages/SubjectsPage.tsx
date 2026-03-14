import { useDeferredValue, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import type { Subject } from '@/types/domain.types'
import { useCreateSubject, useDeleteSubject, useSubjects, useUpdateSubject } from '../hooks/useAdminData'

export default function SubjectsPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '', is_active: true })

  const query = useSubjects({ page, limit: 10, search: search || undefined })
  const createMutation = useCreateSubject()
  const updateMutation = useUpdateSubject()
  const deleteMutation = useDeleteSubject()

  const columns: DataTableColumn<Subject>[] = [
    {
      key: 'name',
      header: 'Subject',
      render: (row) => (
        <div>
          <p className="font-semibold text-text-main">{row.name}</p>
          <p className="text-xs text-text-main/70">{row.code}</p>
        </div>
      ),
    },
    { key: 'description', header: 'Description', render: (row) => row.description || '-' },
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
                code: row.code,
                description: row.description ?? '',
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
                toast.success('Subject deleted.')
              } catch {
                toast.error('Failed to delete subject.')
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (query.isLoading) return <LoadingState message="Loading subjects..." />
  if (query.isError) return <ErrorState message="Failed to load subjects." onRetry={() => void query.refetch()} />

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Subjects</h2>
            <p className="text-sm text-text-main/70">Create and maintain subject metadata via live APIs.</p>
          </div>
          <Button
            onClick={() => {
              setCreateOpen(true)
              setEditing(null)
              setForm({ name: '', code: '', description: '', is_active: true })
            }}
          >
            Add Subject
          </Button>
        </div>

        <SearchInput
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
          placeholder="Search subjects by name or code"
        />

        {rows.length === 0 ? (
          <EmptyState title="No subjects found" />
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
        title={editing ? 'Edit Subject' : 'Create Subject'}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              const payload = {
                ...form,
                description: form.description || undefined,
              }
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload })
                toast.success('Subject updated.')
              } else {
                await createMutation.mutateAsync(payload)
                toast.success('Subject created.')
              }
              setCreateOpen(false)
              setEditing(null)
            } catch {
              toast.error('Failed to save subject.')
            }
          }}
        >
          <FormField label="Name"><Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></FormField>
          <FormField label="Code"><Input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></FormField>
          <label className="flex items-center gap-2 text-sm text-text-main">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
            Subject is active
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
