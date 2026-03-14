import { useState } from 'react'
import { ArrowLeft, Check, ChevronDown, ChevronUp, LoaderCircle, Sparkles, Trash2 } from 'lucide-react'
import { AiBadge } from '@/components/shared/AiBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/utils/cn'
import type { GeneratedQuestion, GeneratedQuestionOption } from '../services/ai-generation.service'
import {
  useApproveGeneratedQuestions,
  useCurriculumLearningObjectives,
  useCurriculumSubjects,
  useCurriculumTopics,
  useGenerateQuestions,
  useGenerationJobStatus,
} from '../hooks/useTeacherData'

// ── Types ─────────────────────────────────────────────────────

type FlowStep = 'config' | 'generating' | 'review'

interface ConfigForm {
  subjectId: string
  topicId: string
  learningObjectiveId: string
  questionType: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD'
  count: number
}

const DEFAULT_CONFIG: ConfigForm = {
  subjectId: '',
  topicId: '',
  learningObjectiveId: '',
  questionType: 'MCQ',
  difficultyLevel: 'MEDIUM',
  count: 5,
}

// ── Helper: difficulty badge tone ─────────────────────────────

function difficultyTone(level: string): 'success' | 'warning' | 'danger' | 'default' {
  if (level === 'EASY') return 'success'
  if (level === 'HARD') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'default'
}

// ── Step Indicator ────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Configure', 'Generating', 'Review & Save']
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

// ── Step 1: Configuration Form ────────────────────────────────

function ConfigStep({
  form,
  onChange,
  onGenerate,
  onCancel,
  isSubmitting,
}: {
  form: ConfigForm
  onChange: (patch: Partial<ConfigForm>) => void
  onGenerate: () => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const subjectsQuery = useCurriculumSubjects()
  const topicsQuery = useCurriculumTopics(form.subjectId)
  const losQuery = useCurriculumLearningObjectives(form.topicId)

  const subjects = subjectsQuery.data ?? []
  const topics = topicsQuery.data ?? []
  const los = losQuery.data ?? []

  const isValid = Boolean(form.learningObjectiveId)

  function handleSubjectChange(subjectId: string) {
    onChange({ subjectId, topicId: '', learningObjectiveId: '' })
  }

  function handleTopicChange(topicId: string) {
    onChange({ topicId, learningObjectiveId: '' })
  }

  return (
    <Card className="space-y-4 p-5">
      <p className="text-sm text-text-main/70">
        Select a learning objective and configure the generation parameters. The AI will create
        curriculum-aligned questions for your review before saving.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Subject">
          <Select value={form.subjectId} onChange={(e) => handleSubjectChange(e.target.value)}>
            <option value="">Select subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Topic">
          <Select
            value={form.topicId}
            onChange={(e) => handleTopicChange(e.target.value)}
            disabled={!form.subjectId}
          >
            <option value="">Select topic...</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Learning Objective">
        <Select
          value={form.learningObjectiveId}
          onChange={(e) => onChange({ learningObjectiveId: e.target.value })}
          disabled={!form.topicId}
        >
          <option value="">Select learning objective...</option>
          {los.map((lo) => (
            <option key={lo.id} value={lo.id}>
              {lo.title}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Question Type">
          <Select
            value={form.questionType}
            onChange={(e) => onChange({ questionType: e.target.value as ConfigForm['questionType'] })}
          >
            <option value="MCQ">MCQ</option>
            <option value="MULTI_SELECT">Multi-Select</option>
            <option value="SHORT_ANSWER">Short Answer</option>
          </Select>
        </FormField>
        <FormField label="Difficulty">
          <Select
            value={form.difficultyLevel}
            onChange={(e) => onChange({ difficultyLevel: e.target.value as ConfigForm['difficultyLevel'] })}
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </Select>
        </FormField>
        <FormField label="Count" hint="Between 1 and 10">
          <Input
            type="number"
            min={1}
            max={10}
            value={form.count}
            onChange={(e) =>
              onChange({ count: Math.min(10, Math.max(1, Number(e.target.value))) })
            }
          />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 border-t border-brand-blue/10 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onGenerate}
          disabled={!isValid || isSubmitting}
          className="gap-1.5"
        >
          <Sparkles size={14} />
          {isSubmitting ? 'Starting...' : 'Generate Questions'}
        </Button>
      </div>
    </Card>
  )
}

// ── Step 2: Generating State ───────────────────────────────────

function GeneratingStep({
  count,
  errorMessage,
  onRetry,
  onCancel,
}: {
  count: number
  errorMessage: string | null
  onRetry: () => void
  onCancel: () => void
}) {
  if (errorMessage) {
    return (
      <Card className="p-5">
        <ErrorState message={errorMessage} onRetry={onRetry} />
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={onCancel}>
            Back to Questions
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-2">
          <AiBadge />
          <LoaderCircle size={20} className="animate-spin text-brand-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold text-text-main">Generating questions with AI...</p>
          <p className="mt-1 text-sm text-text-main/70">
            Creating {count} curriculum-aligned question{count !== 1 ? 's' : ''}. This may take a moment.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                'h-2.5 w-2.5 rounded-full bg-brand-primary',
                i === 0 && 'animate-bounce [animation-delay:0ms]',
                i === 1 && 'animate-bounce [animation-delay:150ms]',
                i === 2 && 'animate-bounce [animation-delay:300ms]',
              )}
            />
          ))}
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
      </div>
    </Card>
  )
}

// ── Option Row (MCQ / MULTI_SELECT) ───────────────────────────

function OptionRow({
  option,
  index,
  questionType,
  onChange,
}: {
  option: GeneratedQuestionOption
  index: number
  questionType: 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER'
  onChange: (patch: Partial<GeneratedQuestionOption>) => void
}) {
  const isMulti = questionType === 'MULTI_SELECT'

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border p-2.5 text-sm',
        option.is_correct
          ? 'border-green-300 bg-green-50/60'
          : 'border-brand-blue/15 bg-white/70',
      )}
    >
      <div className="mt-0.5 flex shrink-0 items-center">
        <input
          type={isMulti ? 'checkbox' : 'radio'}
          checked={option.is_correct}
          onChange={(e) => onChange({ is_correct: e.target.checked })}
          className="h-4 w-4 accent-green-600"
          aria-label={`Option ${index + 1} correct toggle`}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <input
          type="text"
          value={option.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full rounded border border-brand-blue/15 bg-transparent px-2 py-1 text-sm text-text-main focus:border-brand-blue/40 focus:outline-none"
          placeholder="Option text..."
          aria-label={`Option ${index + 1} text`}
        />
        {option.rationale && (
          <p className="text-xs italic text-text-main/50">{option.rationale}</p>
        )}
      </div>
      {option.is_correct && (
        <span className="mt-0.5 shrink-0">
          <Check size={14} className="text-green-600" />
        </span>
      )}
    </div>
  )
}

// ── Question Review Card ───────────────────────────────────────

function QuestionReviewCard({
  question,
  index,
  onUpdate,
  onRemove,
}: {
  question: GeneratedQuestion
  index: number
  onUpdate: (updated: GeneratedQuestion) => void
  onRemove: () => void
}) {
  const [hintsExpanded, setHintsExpanded] = useState(false)

  function handleStemChange(stem: string) {
    onUpdate({ ...question, stem })
  }

  function handleMarksChange(marks: number) {
    onUpdate({ ...question, marks: Math.max(1, marks) })
  }

  function handleOptionChange(optionIndex: number, patch: Partial<GeneratedQuestionOption>) {
    const updatedOptions = (question.options ?? []).map((opt, i) =>
      i === optionIndex ? { ...opt, ...patch } : opt,
    )
    onUpdate({ ...question, options: updatedOptions })
  }

  const hasOptions = question.type !== 'SHORT_ANSWER' && (question.options?.length ?? 0) > 0
  const hasHints = question.hints.length > 0

  return (
    <div className="rounded-lg border border-brand-blue/15 bg-white/70 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 rounded-t-lg border-b border-brand-blue/10 bg-white/50 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
          {index + 1}
        </span>
        <Badge tone="default">{question.type}</Badge>
        <Badge tone={difficultyTone(question.difficulty_level)}>{question.difficulty_level}</Badge>
        <Badge tone="default">{question.bloom_level}</Badge>
        <AiBadge />
        <div className="ml-auto">
          <Button
            variant="ghost"
            onClick={onRemove}
            className="h-7 gap-1 px-2 text-xs text-status-error hover:bg-red-50"
            aria-label={`Remove question ${index + 1}`}
          >
            <Trash2 size={13} />
            Remove
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        {/* Stem */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-main/60">
            Question Stem
          </label>
          <Textarea
            value={question.stem}
            onChange={(e) => handleStemChange(e.target.value)}
            rows={3}
            className="min-h-0"
            aria-label={`Question ${index + 1} stem`}
          />
        </div>

        {/* Marks */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-text-main/60">Marks</label>
          <input
            type="number"
            min={1}
            value={question.marks}
            onChange={(e) => handleMarksChange(Number(e.target.value))}
            className="w-20 rounded-lg border border-brand-blue/20 bg-white/85 px-2 py-1 text-sm text-text-main"
            aria-label={`Question ${index + 1} marks`}
          />
        </div>

        {/* Options */}
        {hasOptions && (
          <div>
            <p className="mb-2 text-xs font-semibold text-text-main/60">
              Answer Options
              {question.type === 'MCQ' && (
                <span className="ml-1 font-normal text-text-main/40">(select one correct)</span>
              )}
              {question.type === 'MULTI_SELECT' && (
                <span className="ml-1 font-normal text-text-main/40">(select all correct)</span>
              )}
            </p>
            <div className="space-y-1.5">
              {(question.options ?? []).map((opt, i) => (
                <OptionRow
                  key={i}
                  option={opt}
                  index={i}
                  questionType={question.type}
                  onChange={(patch) => handleOptionChange(i, patch)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Hints */}
        {hasHints && (
          <div>
            <button
              type="button"
              onClick={() => setHintsExpanded((prev) => !prev)}
              className="flex items-center gap-1 text-xs font-semibold text-text-main/50 hover:text-text-main/70"
            >
              {hintsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Hints ({question.hints.length})
            </button>
            {hintsExpanded && (
              <ul className="mt-1.5 space-y-1 pl-4">
                {question.hints.map((hint, i) => (
                  <li key={i} className="text-xs text-text-main/60 before:mr-1 before:content-['•']">
                    {hint}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 3: Review & Edit Screen ──────────────────────────────

function ReviewStep({
  questions,
  onUpdate,
  onRemove,
  onApprove,
  onDiscard,
  isApproving,
}: {
  questions: GeneratedQuestion[]
  onUpdate: (index: number, updated: GeneratedQuestion) => void
  onRemove: (index: number) => void
  onApprove: () => void
  onDiscard: () => void
  isApproving: boolean
}) {
  if (questions.length === 0) {
    return (
      <Card className="p-5">
        <div className="py-6 text-center">
          <p className="font-semibold text-text-main">All questions removed</p>
          <p className="mt-1 text-sm text-text-main/60">
            You removed all generated questions. Go back to generate a new batch.
          </p>
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" onClick={onDiscard}>
              Back to Questions
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-blue/10 bg-white/40 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <AiBadge />
          <span className="text-sm font-semibold text-text-main">
            {questions.length} question{questions.length !== 1 ? 's' : ''} ready for review
          </span>
        </div>
        <p className="text-xs text-text-main/50">
          Edit questions below, then approve to save them to your question bank.
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionReviewCard
            key={i}
            question={q}
            index={i}
            onUpdate={(updated) => onUpdate(i, updated)}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>

      {/* Action bar */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="text-sm text-text-main/70">
          <span className="font-semibold text-text-main">{questions.length}</span>{' '}
          question{questions.length !== 1 ? 's' : ''} ready for approval
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onDiscard} disabled={isApproving}>
            Discard All
          </Button>
          <Button onClick={onApprove} disabled={isApproving} className="gap-1.5">
            <Check size={14} />
            {isApproving ? 'Saving...' : 'Approve & Save All'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ── Main AiGenerateFlow Component ─────────────────────────────

interface AiGenerateFlowProps {
  onComplete: () => void
  onCancel: () => void
}

export function AiGenerateFlow({ onComplete, onCancel }: AiGenerateFlowProps) {
  const [step, setStep] = useState<FlowStep>('config')
  const [config, setConfig] = useState<ConfigForm>(DEFAULT_CONFIG)
  const [jobId, setJobId] = useState<string | null>(null)
  const [reviewQuestions, setReviewQuestions] = useState<GeneratedQuestion[]>([])
  const [jobError, setJobError] = useState<string | null>(null)

  const generateMutation = useGenerateQuestions()
  const approveMutation = useApproveGeneratedQuestions()
  const jobQuery = useGenerationJobStatus(jobId)

  const jobStatus = jobQuery.data?.status
  const jobErrorMessage = jobQuery.data?.error_message ?? null

  // Transition from generating → review when job completes
  if (step === 'generating' && jobStatus === 'COMPLETED') {
    const generated = jobQuery.data?.generated_questions ?? []
    if (reviewQuestions.length === 0 && generated.length > 0) {
      setReviewQuestions(generated)
      setStep('review')
    } else if (reviewQuestions.length === 0 && generated.length === 0) {
      // Completed but no questions returned — treat as error
      setJobError('Generation completed but no questions were returned.')
    }
  }

  if (step === 'generating' && jobStatus === 'FAILED') {
    setJobError(jobErrorMessage ?? 'Generation failed. Please try again.')
  }

  function handleConfigChange(patch: Partial<ConfigForm>) {
    setConfig((prev) => ({ ...prev, ...patch }))
  }

  async function handleGenerate() {
    setJobError(null)
    try {
      const result = await generateMutation.mutateAsync({
        learning_objective_id: config.learningObjectiveId,
        question_type: config.questionType,
        difficulty_level: config.difficultyLevel,
        count: config.count,
      })
      setJobId(result.job_id)
      setStep('generating')
    } catch {
      setJobError('Failed to start generation. Please try again.')
    }
  }

  function handleRetry() {
    setJobId(null)
    setJobError(null)
    setReviewQuestions([])
    setStep('config')
  }

  function handleUpdateQuestion(index: number, updated: GeneratedQuestion) {
    setReviewQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)))
  }

  function handleRemoveQuestion(index: number) {
    setReviewQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleApprove() {
    if (!jobId) return
    try {
      await approveMutation.mutateAsync({ jobId, questions: reviewQuestions })
      onComplete()
    } catch {
      // Error is surfaced via approveMutation.isError if needed; keep UI in place
    }
  }

  const stepNumber = step === 'config' ? 1 : step === 'generating' ? 2 : 3

  return (
    <div className="space-y-4">
      {/* Page header */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2">
            <AiBadge />
            <h2 className="text-xl font-semibold text-text-main">Generate Questions with AI</h2>
          </div>
          <p className="mt-0.5 text-sm text-text-main/70">
            Configure parameters, review AI-generated questions, then approve to save.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StepIndicator current={stepNumber as 1 | 2 | 3} />
          <Button variant="ghost" onClick={onCancel} className="gap-1.5">
            <ArrowLeft size={14} />
            Back to Questions
          </Button>
        </div>
      </Card>

      {/* Approve error banner */}
      {approveMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to save questions. Please try again.
        </div>
      )}

      {step === 'config' && (
        <ConfigStep
          form={config}
          onChange={handleConfigChange}
          onGenerate={() => void handleGenerate()}
          onCancel={onCancel}
          isSubmitting={generateMutation.isPending}
        />
      )}

      {step === 'generating' && (
        <GeneratingStep
          count={config.count}
          errorMessage={jobError}
          onRetry={handleRetry}
          onCancel={onCancel}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          questions={reviewQuestions}
          onUpdate={handleUpdateQuestion}
          onRemove={handleRemoveQuestion}
          onApprove={() => void handleApprove()}
          onDiscard={onCancel}
          isApproving={approveMutation.isPending}
        />
      )}
    </div>
  )
}
