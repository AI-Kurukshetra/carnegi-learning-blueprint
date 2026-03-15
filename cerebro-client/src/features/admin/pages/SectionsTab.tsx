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
import type { Section } from '@/types/domain.types'
import {
  useAcademicYears,
  useCreateSection,
  useDeleteSection,
  useGrades,
  useSections,
  useUpdateSection,
} from '../hooks/useAdminData'

export default function SectionsTab() {
  const toast = useToast()
  const [selectedAY, setSelectedAY] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Section | null>(null)
  const [form, setForm] = useState({ name: '' })

  const academicYearsQuery = useAcademicYears({ page: 1, limit: 50 })
  const academicYears = academicYearsQuery.data?.data ?? []

  const gradesQuery = useGrades(selectedAY || undefined)
  const grades = gradesQuery.data?.data ?? []

  const sectionsQuery = useSections(selectedGrade || undefined)
  const sections = sectionsQuery.data?.data ?? []

  const createMutation = useCreateSection()
  const updateMutation = useUpdateSection()
  const deleteMutation = useDeleteSection()

  function openCreate() {
    setPanelOpen(true)
    setEditing(null)
    setForm({ name: '' })
  }

  function openEdit(row: Section) {
    setEditing(row)
    setForm({ name: row.name })
  }

  function closePanel() {
    setPanelOpen(false)
    setEditing(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      if (editing) {
        await updateMutation.mutateAsync({ gradeId: selectedGrade, id: editing.id, payload: form })
        toast.success('Section updated.')
      } else {
        await createMutation.mutateAsync({ gradeId: selectedGrade, payload: form })
        toast.success('Section created.')
      }
      closePanel()
    } catch {
      toast.error('Failed to save section.')
    }
  }

  async function handleDelete(row: Section) {
    try {
      await deleteMutation.mutateAsync({ gradeId: selectedGrade, id: row.id })
      toast.success('Section deleted.')
    } catch {
      toast.error('Failed to delete section.')
    }
  }

  const columns: DataTableColumn<Section>[] = [
    { key: 'name', header: 'Section Name', render: (row) => <span className="font-medium text-text-main">{row.name}</span> },
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
            <h2 className="text-xl font-semibold text-text-main">Sections</h2>
            <p className="text-sm text-text-main/70">Manage sections within each grade.</p>
          </div>
          <Button onClick={openCreate} disabled={!selectedGrade}>Add Section</Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Academic Year">
            <Select
              value={selectedAY}
              onChange={(e) => { setSelectedAY(e.target.value); setSelectedGrade('') }}
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
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              disabled={!selectedAY}
            >
              <option value="">Select grade</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </FormField>
        </div>

        {!selectedGrade ? (
          <EmptyState title="Select an academic year and grade to view sections" />
        ) : sectionsQuery.isLoading ? (
          <LoadingState message="Loading sections..." />
        ) : sectionsQuery.isError ? (
          <ErrorState message="Failed to load sections." onRetry={() => void sectionsQuery.refetch()} />
        ) : sections.length === 0 ? (
          <EmptyState title="No sections found for this grade" />
        ) : (
          <DataTable columns={columns} rows={sections} rowKey={(row) => row.id} />
        )}
      </Card>

      <SlidePanel
        open={panelOpen || editing !== null}
        onClose={closePanel}
        title={editing ? 'Edit Section' : 'Add Section'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Section Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="e.g. Section A"
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={closePanel}>Cancel</Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || !form.name.trim()}
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
