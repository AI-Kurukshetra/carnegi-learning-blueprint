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
import type { Classroom } from '@/types/domain.types'
import { useClassrooms, useCreateClassroom, useDeleteClassroom, useUpdateClassroom } from '../hooks/useAdminData'

export default function ClassroomsPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Classroom | null>(null)

  const [form, setForm] = useState({
    section_id: '',
    subject_id: '',
    teacher_id: '',
    academic_year_id: '',
    name: '',
    is_active: true,
  })

  const query = useClassrooms({ page, limit: 10, search: search || undefined })
  const createMutation = useCreateClassroom()
  const updateMutation = useUpdateClassroom()
  const deleteMutation = useDeleteClassroom()

  const columns: DataTableColumn<Classroom>[] = [
    { key: 'name', header: 'Classroom', render: (row) => row.name },
    { key: 'subject_id', header: 'Subject', render: (row) => row.subject_id },
    { key: 'teacher_id', header: 'Teacher', render: (row) => row.teacher_id },
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
                section_id: row.section_id,
                subject_id: row.subject_id,
                teacher_id: row.teacher_id,
                academic_year_id: row.academic_year_id,
                name: row.name,
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
                toast.success('Classroom deleted.')
              } catch {
                toast.error('Failed to delete classroom.')
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (query.isLoading) return <LoadingState message="Loading classrooms..." />
  if (query.isError) return <ErrorState message="Failed to load classrooms." onRetry={() => void query.refetch()} />

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Classrooms</h2>
            <p className="text-sm text-text-main/70">Manage classroom records with teacher and subject mappings.</p>
          </div>
          <Button
            onClick={() => {
              setCreateOpen(true)
              setEditing(null)
              setForm({
                section_id: '',
                subject_id: '',
                teacher_id: '',
                academic_year_id: '',
                name: '',
                is_active: true,
              })
            }}
          >
            Add Classroom
          </Button>
        </div>

        <SearchInput
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
          placeholder="Search classrooms"
        />

        {rows.length === 0 ? (
          <EmptyState title="No classrooms found" />
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
        title={editing ? 'Edit Classroom' : 'Create Classroom'}
        description="Use real IDs for section, subject, teacher, and academic year."
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload: form })
                toast.success('Classroom updated.')
              } else {
                await createMutation.mutateAsync(form)
                toast.success('Classroom created.')
              }
              setCreateOpen(false)
              setEditing(null)
            } catch {
              toast.error('Failed to save classroom.')
            }
          }}
        >
          <FormField label="Classroom name"><Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></FormField>
          <FormField label="Academic year ID"><Input value={form.academic_year_id} onChange={(event) => setForm((prev) => ({ ...prev, academic_year_id: event.target.value }))} /></FormField>
          <FormField label="Section ID"><Input value={form.section_id} onChange={(event) => setForm((prev) => ({ ...prev, section_id: event.target.value }))} /></FormField>
          <FormField label="Subject ID"><Input value={form.subject_id} onChange={(event) => setForm((prev) => ({ ...prev, subject_id: event.target.value }))} /></FormField>
          <FormField label="Teacher ID"><Input value={form.teacher_id} onChange={(event) => setForm((prev) => ({ ...prev, teacher_id: event.target.value }))} /></FormField>
          <label className="flex items-center gap-2 text-sm text-text-main">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
            Active classroom
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
