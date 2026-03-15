import { useDeferredValue, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import type { Classroom } from '@/types/domain.types'
import {
  useAcademicYears,
  useClassrooms,
  useCreateClassroom,
  useDeleteClassroom,
  useGrades,
  useSections,
  useUpdateClassroom,
} from '../hooks/useAdminData'

export default function ClassroomsTab() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Classroom | null>(null)

  const [form, setForm] = useState({
    section_id: '',
    academic_year_id: '',
    grade_id: '',
    name: '',
    is_active: true,
  })

  const query = useClassrooms({ page, limit: 10, search: search || undefined })
  const createMutation = useCreateClassroom()
  const updateMutation = useUpdateClassroom()
  const deleteMutation = useDeleteClassroom()

  const academicYearsQuery = useAcademicYears({ page: 1, limit: 50 })
  const academicYears = academicYearsQuery.data?.data ?? []

  const gradesQuery = useGrades(form.academic_year_id || undefined)
  const grades = gradesQuery.data?.data ?? []

  const sectionsQuery = useSections(form.grade_id || undefined)
  const sections = sectionsQuery.data?.data ?? []

  function openCreate() {
    setCreateOpen(true)
    setEditing(null)
    setForm({ section_id: '', academic_year_id: '', grade_id: '', name: '', is_active: true })
  }

  function openEdit(row: Classroom) {
    setEditing(row)
    setForm({
      section_id: row.section_id,
      academic_year_id: row.academic_year_id,
      grade_id: '',
      name: row.name,
      is_active: row.is_active,
    })
  }

  function closePanel() {
    setCreateOpen(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Classroom deleted.')
    } catch {
      toast.error('Failed to delete classroom.')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { grade_id: _grade_id, ...payload } = form
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        toast.success('Classroom updated.')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Classroom created.')
      }
      closePanel()
    } catch {
      toast.error('Failed to save classroom.')
    }
  }

  const columns: DataTableColumn<Classroom>[] = [
    {
      key: 'name',
      header: 'Classroom',
      render: (row) => <span className="font-medium text-text-main">{row.name}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.is_active ? 'success' : 'default'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
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
            <p className="text-sm text-text-main/70">Create classrooms by assigning a section to an academic year.</p>
          </div>
          <Button onClick={openCreate}>Add Classroom</Button>
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

      <SlidePanel
        open={createOpen || editing !== null}
        onClose={closePanel}
        title={editing ? 'Edit Classroom' : 'Add Classroom'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Classroom Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Grade 10 - Section A"
              required
            />
          </FormField>

          <FormField label="Academic Year">
            <Select
              value={form.academic_year_id}
              onChange={(e) => setForm((prev) => ({ ...prev, academic_year_id: e.target.value, grade_id: '', section_id: '' }))}
              required
            >
              <option value="">Select academic year</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} {ay.is_active ? '(Active)' : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Grade">
            <Select
              value={form.grade_id}
              onChange={(e) => setForm((prev) => ({ ...prev, grade_id: e.target.value, section_id: '' }))}
              required
              disabled={!form.academic_year_id}
            >
              <option value="">Select grade</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Section">
            <Select
              value={form.section_id}
              onChange={(e) => setForm((prev) => ({ ...prev, section_id: e.target.value }))}
              required
              disabled={!form.grade_id}
            >
              <option value="">Select section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FormField>

          <label className="flex items-center gap-2 text-sm text-text-main">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Active classroom
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={closePanel}>Cancel</Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !form.name.trim() ||
                !form.academic_year_id ||
                !form.section_id
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </SlidePanel>
    </>
  )
}
