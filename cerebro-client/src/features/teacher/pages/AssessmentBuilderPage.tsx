import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus, Sparkles, Trash2 } from 'lucide-react'
import { AiBadge } from '@/components/shared/AiBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useToast } from '@/hooks/useToast'
import type { Question } from '@/types/domain.types'
import { cn } from '@/utils/cn'
import { GenerateQuestionsModal } from '../components/GenerateQuestionsModal'
import {
  useAddQuestionToTeacherAssessment,
  useCreateTeacherAssessment,
  useCurriculumLearningObjectives,
  useCurriculumSubjects,
  useCurriculumTopics,
  usePublishTeacherAssessment,
  useTeacherClassrooms,
  useTeacherQuestions,
  useUpdateTeacherAssessment,
} from '../hooks/useTeacherData'

// ── Types ───────────────────────────────────────────────────

interface DetailsForm {
  title: string
  description: string
  type: 'QUIZ' | 'EXAM' | 'PRACTICE'
  classroom_id: string
  due_at: string
  time_limit_minutes: string
  question_count: string
  has_randomized_questions: boolean
}

interface SelectedQuestion {
  question: Question
  marks: number
  order_index: number
}

interface QuestionFilters {
  subjectId: string
  topicId: string
  loId: string
  difficulty: '' | 'EASY' | 'MEDIUM' | 'HARD'
  type: '' | 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
}

const DEFAULT_DETAILS: DetailsForm = {
  title: '',
  description: '',
  type: 'QUIZ',
  classroom_id: '',
  due_at: '',
  time_limit_minutes: '',
  question_count: '',
  has_randomized_questions: false,
}

const DEFAULT_FILTERS: QuestionFilters = {
  subjectId: '',
  topicId: '',
  loId: '',
  difficulty: '',
  type: '',
}

// ── Step Indicator ───────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Details', 'Questions', 'Review']
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const num = i + 1
        const active = num === current
        const done = num < current
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-brand-blue/20" />}
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                active && 'bg-brand-primary text-white',
                done && 'bg-green-500 text-white',
                !active && !done && 'bg-brand-blue/10 text-text-main/60',
              )}
            >
              {num}
            </div>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                active ? 'text-text-main' : 'text-text-main/60',
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Details Form ─────────────────────────────────────

function DetailsStep({
  form,
  onChange,
  onNext,
}: {
  form: DetailsForm
  onChange: (patch: Partial<DetailsForm>) => void
  onNext: () => void
}) {
  const classroomsQuery = useTeacherClassrooms()
  const classrooms = classroomsQuery.data ?? []

  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-semibold text-text-main">Assessment Details</h3>
      <FormField label="Title *">
        <Input
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Chapter 3 Quiz"
        />
      </FormField>
      <FormField label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional description for students"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type">
          <Select
            value={form.type}
            onChange={(e) => onChange({ type: e.target.value as DetailsForm['type'] })}
          >
            <option value="QUIZ">Quiz</option>
            <option value="EXAM">Exam</option>
            <option value="PRACTICE">Practice</option>
          </Select>
        </FormField>
        <FormField label="Classroom">
          {classroomsQuery.isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={form.classroom_id}
              onChange={(e) => onChange({ classroom_id: e.target.value })}
            >
              <option value="">Select classroom...</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Due Date">
          <Input
            type="datetime-local"
            value={form.due_at}
            onChange={(e) => onChange({ due_at: e.target.value })}
          />
        </FormField>
        <FormField label="Time Limit (minutes)">
          <Input
            type="number"
            min={1}
            value={form.time_limit_minutes}
            onChange={(e) => onChange({ time_limit_minutes: e.target.value })}
            placeholder="e.g. 60"
          />
        </FormField>
        <FormField label="Questions per Student" hint="Sets semi-adaptive mode: N questions + 5 challenge reserves. Harder questions are injected when students answer correctly.">
          <Input
            type="number"
            min={1}
            value={form.question_count}
            onChange={(e) => onChange({ question_count: e.target.value })}
            placeholder="All questions (fixed mode)"
          />
        </FormField>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-text-main">
        <input
          type="checkbox"
          checked={form.has_randomized_questions}
          onChange={(e) => onChange({ has_randomized_questions: e.target.checked })}
          className="h-4 w-4 rounded border-brand-blue/30"
        />
        Randomize question order for each student
      </label>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!form.title.trim()} className="gap-1.5">
          Next
          <ChevronRight size={15} />
        </Button>
      </div>
    </Card>
  )
}

// ── Question Filters Panel ────────────────────────────────────

function QuestionFiltersPanel({
  filters,
  onChange,
}: {
  filters: QuestionFilters
  onChange: (patch: Partial<QuestionFilters>) => void
}) {
  const subjectsQuery = useCurriculumSubjects()
  const topicsQuery = useCurriculumTopics(filters.subjectId)
  const losQuery = useCurriculumLearningObjectives(filters.topicId)

  const subjects = subjectsQuery.data ?? []
  const topics = topicsQuery.data ?? []
  const los = losQuery.data ?? []

  return (
    <div className="space-y-2">
      <Select
        value={filters.subjectId}
        onChange={(e) => onChange({ subjectId: e.target.value, topicId: '', loId: '' })}
      >
        <option value="">All subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select
        value={filters.topicId}
        onChange={(e) => onChange({ topicId: e.target.value, loId: '' })}
        disabled={!filters.subjectId}
      >
        <option value="">All topics</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      <Select
        value={filters.loId}
        onChange={(e) => onChange({ loId: e.target.value })}
        disabled={!filters.topicId}
      >
        <option value="">All objectives</option>
        {los.map((lo) => (
          <option key={lo.id} value={lo.id}>
            {lo.title}
          </option>
        ))}
      </Select>
      <Select
        value={filters.difficulty}
        onChange={(e) => onChange({ difficulty: e.target.value as QuestionFilters['difficulty'] })}
      >
        <option value="">All difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </Select>
      <Select
        value={filters.type}
        onChange={(e) => onChange({ type: e.target.value as QuestionFilters['type'] })}
      >
        <option value="">All types</option>
        <option value="MCQ">MCQ</option>
        <option value="MULTI_SELECT">Multi-Select</option>
        <option value="SHORT_ANSWER">Short Answer</option>
      </Select>
    </div>
  )
}

// ── Difficulty badge tone helper ─────────────────────────────

function difficultyTone(level: string): 'success' | 'warning' | 'danger' | 'default' {
  if (level === 'EASY') return 'success'
  if (level === 'HARD') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'default'
}

// ── Available Question Card ───────────────────────────────────

function AvailableQuestionCard({
  question,
  selected,
  onAdd,
}: {
  question: Question
  selected: boolean
  onAdd: (q: Question) => void
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-sm transition-colors',
        selected
          ? 'border-brand-blue/40 bg-brand-blue/5'
          : 'border-brand-blue/15 bg-white/80 hover:border-brand-blue/30',
      )}
    >
      <p className="line-clamp-2 font-medium text-text-main">{question.stem}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge tone="default">{question.type}</Badge>
        <Badge tone={difficultyTone(question.difficulty_level)}>{question.difficulty_level}</Badge>
        <Badge tone="default">{question.bloom_level}</Badge>
        {question.is_ai_generated && <AiBadge />}
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          variant="ghost"
          onClick={() => onAdd(question)}
          disabled={selected}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Plus size={12} />
          {selected ? 'Added' : 'Add'}
        </Button>
      </div>
    </div>
  )
}

// ── Selected Question Row ─────────────────────────────────────

function SelectedQuestionRow({
  item,
  index,
  total,
  onMarksChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: SelectedQuestion
  index: number
  total: number
  onMarksChange: (marks: number) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-brand-blue/15 bg-white/80 p-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-text-main">{item.question.stem}</p>
        <div className="mt-1 flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-text-main/70">
            Marks:
            <input
              type="number"
              min={1}
              value={item.marks}
              onChange={(e) => onMarksChange(Math.max(1, Number(e.target.value)))}
              className="w-14 rounded border border-brand-blue/20 bg-white px-1 py-0.5 text-xs"
            />
          </label>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <Button
          variant="ghost"
          onClick={onMoveUp}
          disabled={index === 0}
          className="h-6 w-6 p-0"
          aria-label="Move up"
        >
          <ArrowUp size={12} />
        </Button>
        <Button
          variant="ghost"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="h-6 w-6 p-0"
          aria-label="Move down"
        >
          <ArrowDown size={12} />
        </Button>
        <Button
          variant="danger"
          onClick={onRemove}
          className="h-6 w-6 p-0"
          aria-label="Remove question"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Question Selection ────────────────────────────────

function QuestionsStep({
  selectedQuestions,
  onAdd,
  onRemove,
  onMarksChange,
  onMoveUp,
  onMoveDown,
  onBack,
  onNext,
}: {
  selectedQuestions: SelectedQuestion[]
  onAdd: (q: Question) => void
  onRemove: (id: string) => void
  onMarksChange: (id: string, marks: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onBack: () => void
  onNext: () => void
}) {
  const [filters, setFilters] = useState<QuestionFilters>(DEFAULT_FILTERS)
  const [aiModalOpen, setAiModalOpen] = useState(false)

  const questionsQuery = useTeacherQuestions({
    page: 1,
    limit: 50,
    learning_objective_id: filters.loId || undefined,
  })

  const allQuestions = questionsQuery.data?.data ?? []
  const selectedIds = new Set(selectedQuestions.map((sq) => sq.question.id))

  const filteredQuestions = allQuestions.filter((q) => {
    if (filters.difficulty && q.difficulty_level !== filters.difficulty) return false
    if (filters.type && q.type !== filters.type) return false
    return true
  })

  const totalMarks = selectedQuestions.reduce((acc, sq) => acc + sq.marks, 0)

  function handleFiltersChange(patch: Partial<QuestionFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-text-main">Question Bank</h3>
            <Button
              variant="secondary"
              onClick={() => setAiModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <AiBadge />
              <Sparkles size={12} />
              Generate with AI
            </Button>
          </div>
          <QuestionFiltersPanel filters={filters} onChange={handleFiltersChange} />
          <div className="space-y-2">
            {questionsQuery.isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            )}
            {questionsQuery.isError && (
              <ErrorState
                message="Failed to load questions."
                onRetry={() => void questionsQuery.refetch()}
              />
            )}
            {!questionsQuery.isLoading && !questionsQuery.isError && filteredQuestions.length === 0 && (
              <EmptyState
                title="No questions found"
                description="Try adjusting the filters or generate questions with AI."
              />
            )}
            {filteredQuestions.map((q) => (
              <AvailableQuestionCard
                key={q.id}
                question={q}
                selected={selectedIds.has(q.id)}
                onAdd={onAdd}
              />
            ))}
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <h3 className="font-semibold text-text-main">
            Selected Questions
            {selectedQuestions.length > 0 && (
              <span className="ml-2 rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs text-brand-blue">
                {selectedQuestions.length}
              </span>
            )}
          </h3>
          {selectedQuestions.length === 0 ? (
            <EmptyState
              title="No questions selected"
              description="Add questions from the bank on the left."
            />
          ) : (
            <div className="space-y-2">
              {selectedQuestions.map((item, index) => (
                <SelectedQuestionRow
                  key={item.question.id}
                  item={item}
                  index={index}
                  total={selectedQuestions.length}
                  onMarksChange={(marks) => onMarksChange(item.question.id, marks)}
                  onRemove={() => onRemove(item.question.id)}
                  onMoveUp={() => onMoveUp(index)}
                  onMoveDown={() => onMoveDown(index)}
                />
              ))}
            </div>
          )}
          {selectedQuestions.length > 0 && (
            <div className="border-t border-brand-blue/15 pt-2 text-sm font-semibold text-text-main">
              Total marks: {totalMarks}
            </div>
          )}
        </Card>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ChevronLeft size={15} />
          Back
        </Button>
        <Button onClick={onNext} disabled={selectedQuestions.length === 0} className="gap-1.5">
          Next
          <ChevronRight size={15} />
        </Button>
      </div>

      <GenerateQuestionsModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onComplete={() => {
          setAiModalOpen(false)
          void questionsQuery.refetch()
        }}
      />
    </>
  )
}

// ── Step 3: Review & Publish ──────────────────────────────────

function ReviewStep({
  details,
  selectedQuestions,
  saving,
  publishing,
  onBack,
  onSaveDraft,
  onPublish,
}: {
  details: DetailsForm
  selectedQuestions: SelectedQuestion[]
  saving: boolean
  publishing: boolean
  onBack: () => void
  onSaveDraft: () => void
  onPublish: () => void
}) {
  const totalMarks = selectedQuestions.reduce((acc, sq) => acc + sq.marks, 0)

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-text-main">Assessment Summary</h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <SummaryRow label="Title" value={details.title} />
          <SummaryRow label="Type" value={details.type} />
          <SummaryRow
            label="Due Date"
            value={details.due_at ? new Date(details.due_at).toLocaleString() : 'Not set'}
          />
          <SummaryRow
            label="Time Limit"
            value={details.time_limit_minutes ? `${details.time_limit_minutes} min` : 'Unlimited'}
          />
          <SummaryRow label="Questions in Bank" value={String(selectedQuestions.length)} />
          <SummaryRow
            label="Questions per Student"
            value={details.question_count ? details.question_count : `All (${selectedQuestions.length})`}
          />
          <SummaryRow
            label="Mode"
            value={details.question_count ? 'Semi-Adaptive (challenge injection)' : 'Fixed'}
          />
          <SummaryRow label="Total Marks" value={String(totalMarks)} />
          <SummaryRow
            label="Randomized"
            value={details.has_randomized_questions ? 'Yes' : 'No'}
          />
        </div>
        {details.description && (
          <p className="mt-3 text-sm text-text-main/70">{details.description}</p>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-text-main">Questions Preview</h3>
        <ol className="space-y-2">
          {selectedQuestions.map((item, index) => (
            <li
              key={item.question.id}
              className="flex items-start gap-3 rounded-lg border border-brand-blue/10 bg-white/80 p-3 text-sm"
            >
              <span className="font-bold text-brand-blue">{index + 1}.</span>
              <span className="flex-1 text-text-main">{item.question.stem}</span>
              <span className="shrink-0 text-xs text-text-main/60">{item.marks} mark{item.marks !== 1 ? 's' : ''}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ChevronLeft size={15} />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onSaveDraft} disabled={saving || publishing}>
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button onClick={onPublish} disabled={saving || publishing}>
            {publishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-main/60">{label}: </span>
      <span className="font-medium text-text-main">{value}</span>
    </div>
  )
}

// ── Assessment creation helpers ───────────────────────────────

async function saveAssessment(
  details: DetailsForm,
  selectedQuestions: SelectedQuestion[],
  createMutation: ReturnType<typeof useCreateTeacherAssessment>,
  addQuestionMutation: ReturnType<typeof useAddQuestionToTeacherAssessment>,
) {
  const assessment = await createMutation.mutateAsync({
    classroom_id: details.classroom_id,
    title: details.title,
    description: details.description || undefined,
    type: details.type,
    due_at: details.due_at ? new Date(details.due_at).toISOString() : undefined,
    time_limit_minutes: details.time_limit_minutes ? Number(details.time_limit_minutes) : undefined,
    question_count: details.question_count ? Number(details.question_count) : undefined,
    has_randomized_questions: details.has_randomized_questions,
  })

  for (const item of selectedQuestions) {
    await addQuestionMutation.mutateAsync({
      id: assessment.id,
      payload: {
        question_id: item.question.id,
        order_index: item.order_index,
        marks: item.marks,
      },
    })
  }

  return assessment
}

// ── Main Page ─────────────────────────────────────────────────

export default function AssessmentBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [details, setDetails] = useState<DetailsForm>(DEFAULT_DETAILS)
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const createAssessment = useCreateTeacherAssessment()
  const updateAssessment = useUpdateTeacherAssessment()
  const addQuestion = useAddQuestionToTeacherAssessment()
  const publishAssessment = usePublishTeacherAssessment()

  void isEdit
  void updateAssessment

  function handleDetailsChange(patch: Partial<DetailsForm>) {
    setDetails((prev) => ({ ...prev, ...patch }))
  }

  function handleAddQuestion(question: Question) {
    setSelectedQuestions((prev) => {
      if (prev.some((sq) => sq.question.id === question.id)) return prev
      return [...prev, { question, marks: 1, order_index: prev.length }]
    })
  }

  function handleRemoveQuestion(questionId: string) {
    setSelectedQuestions((prev) =>
      prev
        .filter((sq) => sq.question.id !== questionId)
        .map((sq, i) => ({ ...sq, order_index: i })),
    )
  }

  function handleMarksChange(questionId: string, marks: number) {
    setSelectedQuestions((prev) =>
      prev.map((sq) => (sq.question.id === questionId ? { ...sq, marks } : sq)),
    )
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    setSelectedQuestions((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((sq, i) => ({ ...sq, order_index: i }))
    })
  }

  function handleMoveDown(index: number) {
    setSelectedQuestions((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((sq, i) => ({ ...sq, order_index: i }))
    })
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const assessment = await saveAssessment(details, selectedQuestions, createAssessment, addQuestion)
      toast.success('Assessment saved as draft.')
      navigate(`/teacher/assessments/${assessment.id}`)
    } catch {
      toast.error('Failed to save assessment.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      const assessment = await saveAssessment(details, selectedQuestions, createAssessment, addQuestion)
      await publishAssessment.mutateAsync(assessment.id)
      toast.success('Assessment published.')
      navigate(`/teacher/assessments/${assessment.id}`)
    } catch {
      toast.error('Failed to publish assessment.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between p-5">
        <div>
          <h2 className="text-xl font-semibold text-text-main">
            {isEdit ? 'Edit Assessment' : 'New Assessment'}
          </h2>
          <p className="text-sm text-text-main/70">
            {isEdit ? 'Update assessment details and questions.' : 'Build your assessment step by step.'}
          </p>
        </div>
        <StepIndicator current={step} />
      </Card>

      {step === 1 && (
        <DetailsStep form={details} onChange={handleDetailsChange} onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <QuestionsStep
          selectedQuestions={selectedQuestions}
          onAdd={handleAddQuestion}
          onRemove={handleRemoveQuestion}
          onMarksChange={handleMarksChange}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <ReviewStep
          details={details}
          selectedQuestions={selectedQuestions}
          saving={saving}
          publishing={publishing}
          onBack={() => setStep(2)}
          onSaveDraft={() => void handleSaveDraft()}
          onPublish={() => void handlePublish()}
        />
      )}
    </div>
  )
}
