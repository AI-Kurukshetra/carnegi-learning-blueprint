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
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import type { Assessment } from '@/types/domain.types'
import {
  useCloseTeacherAssessment,
  useCreateTeacherAssessment,
  useDeleteTeacherAssessment,
  usePublishTeacherAssessment,
  useTeacherAssessments,
  useTeacherClassrooms,
  useUpdateTeacherAssessment,
} from '../hooks/useTeacherData'

export default function AssessmentsPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'CLOSED'>('ALL')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Assessment | null>(null)
  const [form, setForm] = useState({
    classroom_id: '',
    title: '',
    description: '',
    type: 'QUIZ' as 'QUIZ' | 'EXAM' | 'PRACTICE',
    due_at: '',
    time_limit_minutes: '',
    question_count: '',
    has_randomized_questions: false,
  })

  const query = useTeacherAssessments({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })
  const classroomsQuery = useTeacherClassrooms()
  const createMutation = useCreateTeacherAssessment()
  const updateMutation = useUpdateTeacherAssessment()
  const deleteMutation = useDeleteTeacherAssessment()
  const publishMutation = usePublishTeacherAssessment()
  const closeMutation = useCloseTeacherAssessment()

  const classrooms = classroomsQuery.data ?? []

  const columns: DataTableColumn<Assessment>[] = [
    {
      key: 'title',
      header: 'Assessment',
      render: (row) => (
        <div>
          <p className="font-semibold text-text-main">{row.title}</p>
          <p className="text-xs text-text-main/70">{row.classroom_id}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <Badge tone="default">{row.type}</Badge> },
    { key: 'status', header: 'Status', render: (row) => row.status },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(row)
              setForm({
                classroom_id: row.classroom_id,
                title: row.title,
                description: row.description ?? '',
                type: row.type as 'QUIZ' | 'EXAM' | 'PRACTICE',
                due_at: row.due_at?.slice(0, 16) ?? '',
                time_limit_minutes: row.time_limit_minutes ? String(row.time_limit_minutes) : '',
                question_count: row.question_count ? String(row.question_count) : '',
                has_randomized_questions: row.has_randomized_questions,
              })
            }}
          >
            Edit
          </Button>
          {row.status !== 'PUBLISHED' ? (
            <Button
              onClick={async () => {
                try {
                  await publishMutation.mutateAsync(row.id)
                  toast.success('Assessment published.')
                } catch {
                  toast.error('Failed to publish assessment.')
                }
              }}
            >
              Publish
            </Button>
          ) : null}
          {row.status !== 'CLOSED' ? (
            <Button
              variant="warning"
              onClick={async () => {
                try {
                  await closeMutation.mutateAsync(row.id)
                  toast.success('Assessment closed.')
                } catch {
                  toast.error('Failed to close assessment.')
                }
              }}
            >
              Close
            </Button>
          ) : null}
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await deleteMutation.mutateAsync(row.id)
                toast.success('Assessment deleted.')
              } catch {
                toast.error('Failed to delete assessment.')
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (query.isLoading) return <LoadingState message="Loading assessments..." />
  if (query.isError) return <ErrorState message="Failed to load assessments." onRetry={() => void query.refetch()} />

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Assessments</h2>
            <p className="text-sm text-text-main/70">Teacher assessment CRUD and state transitions via API.</p>
          </div>
          <Button
            onClick={() => {
              setCreateOpen(true)
              setEditing(null)
              setForm({
                classroom_id: '',
                title: '',
                description: '',
                type: 'QUIZ',
                due_at: '',
                time_limit_minutes: '',
                question_count: '',
                has_randomized_questions: false,
              })
            }}
          >
            Add Assessment
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_180px]">
          <SearchInput
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value)
              setPage(1)
            }}
            placeholder="Search assessment title"
          />
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CLOSED')
              setPage(1)
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No assessments found" />
        ) : (
          <>
            <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
            <Pagination page={meta?.page ?? 1} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
          </>
        )}
      </Card>

      <SlidePanel
        open={createOpen || editing !== null}
        onClose={() => {
          setCreateOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit Assessment' : 'Add Assessment'}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              const payload = {
                classroom_id: form.classroom_id,
                title: form.title,
                description: form.description || undefined,
                type: form.type,
                due_at: form.due_at ? new Date(form.due_at).toISOString() : undefined,
                time_limit_minutes: form.time_limit_minutes ? Number(form.time_limit_minutes) : undefined,
                question_count: form.question_count ? Number(form.question_count) : undefined,
                has_randomized_questions: form.has_randomized_questions,
              }
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload })
                toast.success('Assessment updated.')
              } else {
                await createMutation.mutateAsync(payload)
                toast.success('Assessment created.')
              }
              setCreateOpen(false)
              setEditing(null)
            } catch {
              toast.error('Failed to save assessment.')
            }
          }}
        >
          <FormField label="Classroom">
            <Select
              value={form.classroom_id}
              onChange={(event) => setForm((prev) => ({ ...prev, classroom_id: event.target.value }))}
              required
            >
              <option value="">Select a classroom</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.subject ? ` — ${c.subject.name}` : ''}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Title">
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
            />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as 'QUIZ' | 'EXAM' | 'PRACTICE' }))}>
              <option value="QUIZ">Quiz</option>
              <option value="EXAM">Exam</option>
              <option value="PRACTICE">Practice</option>
            </Select>
          </FormField>
          <FormField label="Due Date">
            <Input
              type="datetime-local"
              value={form.due_at}
              onChange={(event) => setForm((prev) => ({ ...prev, due_at: event.target.value }))}
            />
          </FormField>
          <FormField label="Time Limit (minutes)">
            <Input
              type="number"
              value={form.time_limit_minutes}
              onChange={(event) => setForm((prev) => ({ ...prev, time_limit_minutes: event.target.value }))}
              placeholder="No limit"
            />
          </FormField>
          <FormField label="Questions per Student" hint="Optional — limits how many questions each student gets (random subset). Leave empty to show all linked questions.">
            <Input
              type="number"
              min={1}
              value={form.question_count}
              onChange={(event) => setForm((prev) => ({ ...prev, question_count: event.target.value }))}
              placeholder="All questions"
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-text-main">
            <input
              type="checkbox"
              checked={form.has_randomized_questions}
              onChange={(event) => setForm((prev) => ({ ...prev, has_randomized_questions: event.target.checked }))}
            />
            Randomize questions
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setCreateOpen(false); setEditing(null) }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </SlidePanel>
    </>
  )
}
