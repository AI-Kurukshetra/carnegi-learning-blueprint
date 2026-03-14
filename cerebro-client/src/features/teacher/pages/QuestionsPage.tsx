import { useDeferredValue, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AiBadge } from '@/components/shared/AiBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import type { Question } from '@/types/domain.types'
import { AiGenerateFlow } from '../components/AiGenerateFlow'
import {
  useCreateTeacherQuestion,
  useCurriculumLearningObjectives,
  useCurriculumSubjects,
  useCurriculumTopics,
  useDeleteTeacherQuestion,
  useTeacherQuestions,
  useUpdateTeacherQuestion,
} from '../hooks/useTeacherData'

const BLOOM_LEVELS: Record<string, { label: string; description: string; example: string }> = {
  REMEMBER: {
    label: 'Remember',
    description: 'Recall facts or basic concepts',
    example: '"What is the capital of France?"',
  },
  UNDERSTAND: {
    label: 'Understand',
    description: 'Explain ideas or concepts in own words',
    example: '"Describe why photosynthesis is important."',
  },
  APPLY: {
    label: 'Apply',
    description: 'Use knowledge in a new situation',
    example: '"Calculate the area of this triangle."',
  },
  ANALYZE: {
    label: 'Analyze',
    description: 'Break down information and examine relationships',
    example: '"Compare and contrast mitosis and meiosis."',
  },
  EVALUATE: {
    label: 'Evaluate',
    description: 'Justify a decision or make a judgment',
    example: '"Which solution is most efficient and why?"',
  },
  CREATE: {
    label: 'Create',
    description: 'Produce original work or design something new',
    example: '"Design an experiment to test this hypothesis."',
  },
}

const BLOOM_ORDER = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const

function BloomLevelGuide({ selected }: { selected: string }) {
  return (
    <div className="mt-2 rounded-lg border border-brand-blue/15 bg-slate-50/80 p-3">
      <p className="text-xs font-semibold text-text-main/70">
        Bloom&apos;s Taxonomy — lower to higher order thinking
      </p>
      <div className="mt-2 grid gap-1.5">
        {BLOOM_ORDER.map((level) => {
          const info = BLOOM_LEVELS[level]
          const isActive = level === selected
          return (
            <div
              key={level}
              className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                isActive
                  ? 'border border-brand-primary/30 bg-brand-primary/10 text-brand-primary'
                  : 'text-text-main/60'
              }`}
            >
              <span className="font-semibold">{info.label}</span>
              <span className="mx-1">—</span>
              <span>{info.description}</span>
              {isActive && (
                <p className="mt-0.5 italic text-text-main/50">e.g. {info.example}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function QuestionsPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [aiFlowOpen, setAiFlowOpen] = useState(false)
  const [form, setForm] = useState({
    learning_objective_id: '',
    type: 'MCQ' as 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER',
    stem: '',
    difficulty_level: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    bloom_level: 'APPLY' as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
  })

  // Cascading dropdowns for LO selection
  const [panelSubjectId, setPanelSubjectId] = useState('')
  const [panelTopicId, setPanelTopicId] = useState('')

  const subjectsQuery = useCurriculumSubjects()
  const subjects = subjectsQuery.data ?? []
  const mathSubject = subjects.find((s) => s.name.toLowerCase().includes('mathematic'))
  const defaultSubjectId = mathSubject?.id ?? subjects[0]?.id ?? ''
  const activeSubjectId = panelSubjectId || defaultSubjectId

  const panelTopicsQuery = useCurriculumTopics(activeSubjectId)
  const panelTopics = panelTopicsQuery.data ?? []

  const activeTopicId = panelTopicId || ''
  const panelLosQuery = useCurriculumLearningObjectives(activeTopicId)
  const panelLos = panelLosQuery.data ?? []

  const query = useTeacherQuestions({ page, limit: 10, search: search || undefined })
  const createMutation = useCreateTeacherQuestion()
  const updateMutation = useUpdateTeacherQuestion()
  const deleteMutation = useDeleteTeacherQuestion()

  const columns: DataTableColumn<Question>[] = [
    { key: 'stem', header: 'Stem', render: (row) => <span className="text-sm">{row.stem}</span> },
    { key: 'type', header: 'Type', render: (row) => <Badge>{row.type}</Badge> },
    { key: 'difficulty_level', header: 'Difficulty', render: (row) => row.difficulty_level },
    { key: 'review_status', header: 'Review', render: (row) => row.review_status },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(row)
              setPanelSubjectId('')
              setPanelTopicId('')
              setForm({
                learning_objective_id: row.learning_objective_id,
                type: row.type as 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER',
                stem: row.stem,
                difficulty_level: row.difficulty_level as 'EASY' | 'MEDIUM' | 'HARD',
                bloom_level: row.bloom_level as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
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
                toast.success('Question deleted.')
              } catch {
                toast.error('Failed to delete question.')
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  // Show the AI generation flow inline (replaces the questions list)
  if (aiFlowOpen) {
    return (
      <AiGenerateFlow
        onComplete={() => {
          setAiFlowOpen(false)
          void query.refetch()
        }}
        onCancel={() => setAiFlowOpen(false)}
      />
    )
  }

  if (query.isLoading) return <LoadingState message="Loading questions..." />
  if (query.isError) return <ErrorState message="Failed to load questions." onRetry={() => void query.refetch()} />

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Question Bank</h2>
            <p className="text-sm text-text-main/70">Teacher CRUD operations connected to real question APIs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAiFlowOpen(true)} className="gap-1.5">
              <AiBadge />
              <Sparkles size={13} />
              Generate with AI
            </Button>
            <Button
              onClick={() => {
                setCreateOpen(true)
                setEditing(null)
                setPanelSubjectId('')
                setPanelTopicId('')
                setForm({
                  learning_objective_id: '',
                  type: 'MCQ',
                  stem: '',
                  difficulty_level: 'MEDIUM',
                  bloom_level: 'APPLY',
                })
              }}
            >
              Add Question
            </Button>
          </div>
        </div>
        <SearchInput
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
          placeholder="Search question stem"
        />
        {rows.length === 0 ? (
          <EmptyState title="No questions found" />
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
        title={editing ? 'Edit Question' : 'Add Question'}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            try {
              const payload = {
                ...form,
                hints: [],
                options: form.type === 'SHORT_ANSWER' ? undefined : [],
              }
              if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, payload })
                toast.success('Question updated.')
              } else {
                await createMutation.mutateAsync(payload)
                toast.success('Question created.')
              }
              setCreateOpen(false)
              setEditing(null)
            } catch {
              toast.error('Failed to save question.')
            }
          }}
        >
          <FormField label="Subject">
            <Select
              value={panelSubjectId || defaultSubjectId}
              onChange={(e) => {
                setPanelSubjectId(e.target.value)
                setPanelTopicId('')
                setForm((prev) => ({ ...prev, learning_objective_id: '' }))
              }}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Topic">
            <Select
              value={panelTopicId}
              onChange={(e) => {
                setPanelTopicId(e.target.value)
                setForm((prev) => ({ ...prev, learning_objective_id: '' }))
              }}
              required
            >
              <option value="">Select a topic</option>
              {panelTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Learning Objective">
            <Select
              value={form.learning_objective_id}
              onChange={(e) => setForm((prev) => ({ ...prev, learning_objective_id: e.target.value }))}
              required
            >
              <option value="">Select a learning objective</option>
              {panelLos.map((lo) => (
                <option key={lo.id} value={lo.id}>{lo.title}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Stem">
            <Textarea value={form.stem} onChange={(event) => setForm((prev) => ({ ...prev, stem: event.target.value }))} rows={4} />
          </FormField>
          <FormField label="Question Type">
            <Select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER' }))}>
              <option value="MCQ">MCQ</option>
              <option value="MULTI_SELECT">MULTI_SELECT</option>
              <option value="SHORT_ANSWER">SHORT_ANSWER</option>
            </Select>
          </FormField>
          <FormField label="Difficulty">
            <Select value={form.difficulty_level} onChange={(event) => setForm((prev) => ({ ...prev, difficulty_level: event.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}>
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </Select>
          </FormField>
          <FormField label="Bloom Level">
            <Select value={form.bloom_level} onChange={(event) => setForm((prev) => ({ ...prev, bloom_level: event.target.value as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE' }))}>
              <option value="REMEMBER">REMEMBER</option>
              <option value="UNDERSTAND">UNDERSTAND</option>
              <option value="APPLY">APPLY</option>
              <option value="ANALYZE">ANALYZE</option>
              <option value="EVALUATE">EVALUATE</option>
              <option value="CREATE">CREATE</option>
            </Select>
            <BloomLevelGuide selected={form.bloom_level} />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setCreateOpen(false); setEditing(null) }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </SlidePanel>
    </>
  )
}
