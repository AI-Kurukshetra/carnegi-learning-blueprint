import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp, User } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import {
  useTeacherAssessmentById,
  useAssessmentAttempts,
  useAttemptDetail,
} from '../hooks/useTeacherData'
import type {
  QuestionBreakdownItem,
  StudentAttemptSummary,
} from '../services/assessments.service'

// ── Helpers ────────────────────────────────────────────────

function correctnessIcon(isCorrect: boolean | null) {
  if (isCorrect === true) return <CheckCircle size={15} className="text-green-600" />
  if (isCorrect === false) return <XCircle size={15} className="text-red-600" />
  return <MinusCircle size={15} className="text-slate-400" />
}

function difficultyTone(d: string): 'success' | 'warning' | 'danger' | 'default' {
  if (d === 'EASY') return 'success'
  if (d === 'HARD') return 'danger'
  if (d === 'MEDIUM') return 'warning'
  return 'default'
}

// ── Main Page ──────────────────────────────────────────────

export default function AssessmentResultsPage() {
  const { id: assessmentId } = useParams()
  const navigate = useNavigate()
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)

  const assessmentQuery = useTeacherAssessmentById(assessmentId ?? '')
  const attemptsQuery = useAssessmentAttempts(assessmentId ?? '')

  if (assessmentQuery.isLoading || attemptsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (assessmentQuery.isError || attemptsQuery.isError) {
    return (
      <ErrorState
        message="Failed to load results."
        onRetry={() => {
          void assessmentQuery.refetch()
          void attemptsQuery.refetch()
        }}
      />
    )
  }

  const assessment = assessmentQuery.data
  const attempts = attemptsQuery.data ?? []
  const submittedAttempts = attempts.filter((a) => a.status !== 'IN_PROGRESS')

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft size={16} /> Back
      </Button>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-text-main">{assessment?.title}</h2>
        <p className="mt-1 text-sm text-text-main/70">
          {submittedAttempts.length} submission{submittedAttempts.length !== 1 ? 's' : ''}
          {attempts.length > submittedAttempts.length && (
            <span className="ml-2 text-amber-600">
              ({attempts.length - submittedAttempts.length} in progress)
            </span>
          )}
        </p>
      </Card>

      {submittedAttempts.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-text-main/60">No submissions yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {submittedAttempts.map((attempt) => (
            <AttemptRow
              key={attempt.id}
              attempt={attempt}
              assessmentId={assessmentId ?? ''}
              isExpanded={selectedAttemptId === attempt.id}
              onToggle={() =>
                setSelectedAttemptId(selectedAttemptId === attempt.id ? null : attempt.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Attempt Row ────────────────────────────────────────────

function AttemptRow({
  attempt,
  assessmentId,
  isExpanded,
  onToggle,
}: {
  attempt: StudentAttemptSummary
  assessmentId: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const score = attempt.score ?? 0
  const total = attempt.total_marks
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-brand-blue/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10">
            <User size={14} className="text-brand-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-main">
              {attempt.student.first_name} {attempt.student.last_name}
            </p>
            <p className="text-xs text-text-main/50">{attempt.student.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-text-main">{pct}%</p>
            <p className="text-xs text-text-main/50">
              {score}/{total} marks
            </p>
          </div>
          <Badge
            tone={attempt.status === 'GRADED' ? 'success' : 'default'}
          >
            {attempt.status}
          </Badge>
          {attempt.submitted_at && (
            <span className="hidden text-xs text-text-main/40 sm:inline">
              {new Date(attempt.submitted_at).toLocaleString()}
            </span>
          )}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <AttemptDetail assessmentId={assessmentId} attemptId={attempt.id} />
      )}
    </Card>
  )
}

// ── Attempt Detail (fetches full breakdown) ────────────────

function AttemptDetail({
  assessmentId,
  attemptId,
}: {
  assessmentId: string
  attemptId: string
}) {
  const { data, isLoading, isError } = useAttemptDetail(assessmentId, attemptId)

  if (isLoading) {
    return (
      <div className="space-y-2 border-t border-brand-blue/10 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="border-t border-brand-blue/10 p-4">
        <p className="text-sm text-red-500">Failed to load attempt details.</p>
      </div>
    )
  }

  const breakdown = (data.question_breakdown ?? []) as QuestionBreakdownItem[]

  if (breakdown.length === 0) {
    return (
      <div className="border-t border-brand-blue/10 p-4">
        <p className="text-sm text-text-main/50">
          No question breakdown available for this attempt.
        </p>
      </div>
    )
  }

  const sorted = [...breakdown].sort((a, b) => a.sequence_order - b.sequence_order)

  return (
    <div className="border-t border-brand-blue/10 p-4">
      <h4 className="mb-3 text-sm font-semibold text-text-main">Question Breakdown</h4>
      <div className="space-y-3">
        {sorted.map((item, idx) => (
          <QuestionCard key={item.question_id} item={item} index={idx} />
        ))}
      </div>
    </div>
  )
}

// ── Question Card ──────────────────────────────────────────

function QuestionCard({ item, index }: { item: QuestionBreakdownItem; index: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/60 p-3">
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{correctnessIcon(item.is_correct)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-text-main">
              Q{index + 1}. {item.stem}
            </p>
            <span className="shrink-0 text-xs font-semibold text-slate-500">
              {item.marks_awarded}/{item.marks}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge tone="default">{item.type}</Badge>
            <Badge tone={difficultyTone(item.difficulty_level)}>{item.difficulty_level}</Badge>
            <Badge tone="default">{item.bloom_level}</Badge>
            {item.time_spent_seconds > 0 && (
              <span className="text-[10px] text-slate-400">{item.time_spent_seconds}s</span>
            )}
          </div>
          {item.learning_objective && (
            <p className="mt-1 text-[11px] text-slate-400">LO: {item.learning_objective}</p>
          )}
        </div>
      </div>

      {/* Options */}
      {item.options.length > 0 && (
        <div className="mt-2.5 space-y-1 pl-6">
          {item.options.map((opt) => {
            let cls = 'border-slate-200 bg-white'
            if (opt.is_correct && opt.was_selected) cls = 'border-green-400 bg-green-50'
            else if (opt.is_correct) cls = 'border-green-300 bg-green-50/50'
            else if (opt.was_selected) cls = 'border-red-400 bg-red-50'

            return (
              <div
                key={opt.id}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${cls}`}
              >
                {opt.was_selected && opt.is_correct && (
                  <CheckCircle size={12} className="shrink-0 text-green-600" />
                )}
                {opt.was_selected && !opt.is_correct && (
                  <XCircle size={12} className="shrink-0 text-red-600" />
                )}
                {!opt.was_selected && opt.is_correct && (
                  <CheckCircle size={12} className="shrink-0 text-green-400" />
                )}
                {!opt.was_selected && !opt.is_correct && (
                  <span className="inline-block h-3 w-3 shrink-0" />
                )}
                <span className="text-text-main">{opt.text}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Text response */}
      {item.text_response && (
        <div className="mt-2.5 pl-6">
          <p className="rounded bg-slate-100 p-2 text-xs text-slate-700">
            Student answer: {item.text_response}
          </p>
        </div>
      )}

      {item.is_correct === null && (
        <p className="mt-2 pl-6 text-xs text-amber-600">Pending review</p>
      )}
    </div>
  )
}
