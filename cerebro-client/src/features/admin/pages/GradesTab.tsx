import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import type { Grade } from '@/types/domain.types'
import {
  useAcademicYears,
  useCreateGrade,
  useDeleteGrade,
  useGrades,
  useUpdateGrade,
} from '../hooks/useAdminData'

export default function GradesTab() {
  const toast = useToast()
  const [selectedAY, setSelectedAY] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Grade | null>(null)
  const [form, setForm] = useState({ name: '', level_number: '' })

  const academicYearsQuery = useAcademicYears({ page: 1, limit: 50 })
  const academicYears = academicYearsQuery.data?.data ?? []

  const gradesQuery = useGrades(selectedAY || undefined)
  const grades = gradesQuery.data?.data ?? []

  const createMutation = useCreateGrade()
  const updateMutation = useUpdateGrade()
  const deleteMutation = useDeleteGrade()

  function openCreate() {
    setPanelOpen(true)
    setEditing(null)
    setForm({ name: '', level_number: '' })
  }

  function openEdit(row: Grade) {
    setEditing(row)
    setForm({ name: row.name, level_number: String(row.level_number) })
  }

  function closePanel() {
    setPanelOpen(false)
    setEditing(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const payload = { name: form.name, level_number: Number(form.level_number) }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ academicYearId: selectedAY, id: editing.id, payload })
        toast.success('Grade updated.')
      } else {
        await createMutation.mutateAsync({ academicYearId: selectedAY, payload })
        toast.success('Grade created.')
      }
      closePanel()
    } catch {
      toast.error('Failed to save grade.')
    }
  }

  async function handleDelete(row: Grade) {
    try {
      await deleteMutation.mutateAsync({ academicYearId: selectedAY, id: row.id })
      toast.success('Grade deleted.')
    } catch {
      toast.error('Failed to delete grade.')
    }
  }

  const columns: DataTableColumn<Grade>[] = [
    { key: 'name', header: 'Grade Name', render: (row) => <span className="font-medium text-text-main">{row.name}</span> },
    { key: 'level_number', header: 'Level', render: (row) => row.level_number },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="danger" onClick={() => handleDelete(row)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Grades</h2>
            <p className="text-sm text-text-main/70">Manage grade levels for each academic year.</p>
          </div>
          <Button onClick={openCreate} disabled={!selectedAY}>Add Grade</Button>
        </div>

        <FormField label="Academic Year">
          <Select value={selectedAY} onChange={(e) => setSelectedAY(e.target.value)}>
            <option value="">Select academic year</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name} {ay.is_active ? '(Active)' : ''}
              </option>
            ))}
          </Select>
        </FormField>

        {!selectedAY ? (
          <EmptyState title="Select an academic year to view grades" />
        ) : gradesQuery.isLoading ? (
          <LoadingState message="Loading grades..." />
        ) : gradesQuery.isError ? (
          <ErrorState message="Failed to load grades." onRetry={() => void gradesQuery.refetch()} />
        ) : grades.length === 0 ? (
          <EmptyState title="No grades found for this academic year" />
        ) : (
          <DataTable columns={columns} rows={grades} rowKey={(row) => row.id} />
        )}
      </Card>

      <SlidePanel
        open={panelOpen || editing !== null}
        onClose={closePanel}
        title={editing ? 'Edit Grade' : 'Add Grade'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Grade Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Grade 10"
              required
            />
          </FormField>
          <FormField label="Level Number">
            <Input
              type="number"
              min={1}
              value={form.level_number}
              onChange={(e) => setForm((prev) => ({ ...prev, level_number: e.target.value }))}
              placeholder="e.g. 10"
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={closePanel}>Cancel</Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !form.name.trim() ||
                !form.level_number
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
