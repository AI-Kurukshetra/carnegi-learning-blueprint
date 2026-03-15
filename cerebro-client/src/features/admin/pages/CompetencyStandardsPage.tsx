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
import type { CompetencyStandard } from '@/types/domain.types'
import {
  useCompetencyStandards,
  useCreateCompetencyStandard,
  useDeleteCompetencyStandard,
  useUpdateCompetencyStandard,
} from '../hooks/useAdminData'

export default function CompetencyStandardsPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CompetencyStandard | null>(null)
  const [form, setForm] = useState({ code: '', title: '', description: '' })

  const query = useCompetencyStandards({ page, limit: 10, search: search || undefined })
  const createMutation = useCreateCompetencyStandard()
  const updateMutation = useUpdateCompetencyStandard()
  const deleteMutation = useDeleteCompetencyStandard()

  const columns: DataTableColumn<CompetencyStandard>[] = [
    { key: 'code', header: 'Code', render: (row) => row.code },
    { key: 'title', header: 'Title', render: (row) => row.title },
    { key: 'description', header: 'Description', render: (row) => row.description || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(row)
              setForm({ code: row.code, title: row.title, description: row.description ?? '' })
            }}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await deleteMutation.mutateAsync(row.id)
                toast.success('Competency standard deleted.')
              } catch {
                toast.error('Failed to delete competency standard.')
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (query.isLoading) return <LoadingState message="Loading competency standards..." />
  if (query.isError) return <ErrorState message="Failed to load competency standards." onRetry={() => void query.refetch()} />

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <>
    <div className="space-y-4">
      <Card className="space-y-3 p-5">
        <div>
          <h2 className="text-xl font-semibold text-text-main">Competency Standards</h2>
          <p className="mt-1 text-sm leading-relaxed text-text-main/70">
            Competency standards represent official curriculum frameworks mandated by education boards
            (e.g., Common Core, NGSS, or country-specific standards). Each standard has a unique code
            and title that can be mapped to your school's learning objectives, enabling standards-aligned
            assessments, compliance reporting, and AI-generated content that meets regulatory requirements.
          </p>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-main">Manage Standards</h2>
            <p className="text-sm text-text-main/70">Add, edit, or remove competency standards for your school.</p>
          </div>
          <Button
            onClick={() => {
              setCreateOpen(true)
              setEditing(null)
              setForm({ code: '', title: '', description: '' })
            }}
          >
            Add Standard
          </Button>
        </div>
        <SearchInput
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
          placeholder="Search by code or title"
        />
        {rows.length === 0 ? (
          <EmptyState title="No competency standards found" />
        ) : (
          <>
            <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
            <Pagination page={meta?.page ?? 1} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
          </>
        )}
      </Card>
    </div>

      <Modal
        open={createOpen || editing !== null}
        onClose={() => {
          setCreateOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Competency Standard' : 'Create Competency Standard'}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              const payload = { ...form, description: form.description || undefined }
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload })
                toast.success('Competency standard updated.')
              } else {
                await createMutation.mutateAsync(payload)
                toast.success('Competency standard created.')
              }
              setCreateOpen(false)
              setEditing(null)
            } catch {
              toast.error('Failed to save competency standard.')
            }
          }}
        >
          <FormField label="Code"><Input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} /></FormField>
          <FormField label="Title"><Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></FormField>
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
