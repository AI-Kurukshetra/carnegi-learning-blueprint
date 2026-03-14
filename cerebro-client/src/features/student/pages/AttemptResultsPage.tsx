import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  ArrowLeft,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  Brain,
  BookOpen,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'
import {
  useStudentAssessmentById,
  useMyAttempts,
  useAttemptWithAnalytics,
} from '../hooks/useStudentData'
import type {
  AdaptiveAnalytics,
  AssessmentAttemptWithAnalytics,
  AssessmentWithQuestions,
  DifficultyBreakdown,
  LOBreakdown,
  QuestionBreakdownItem,
} from '../services/assessments.service'

// ── Helpers ───────────────────────────────────────────────

function strengthBadgeTone(s: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (s) {
    case 'STRONG':
      return 'success'
    case 'MODERATE':
      return 'warning'
    case 'WEAK':
      return 'danger'
    default:
      return 'default'
  }
}

function difficultyBarColor(d: string): string {
  switch (d) {
    case 'EASY':
      return 'bg-green-500'
    case 'MEDIUM':
      return 'bg-amber-500'
    case 'HARD':
      return 'bg-red-500'
    default:
      return 'bg-slate-500'
  }
}

function resolveCorrectnessIcon(isCorrect: boolean | null) {
  if (isCorrect === true) return <CheckCircle size={18} className="text-green-600" />
  if (isCorrect === false) return <XCircle size={18} className="text-red-600" />
  return <MinusCircle size={18} className="text-slate-400" />
}

// ── Page ──────────────────────────────────────────────────

export default function AttemptResultsPage() {
  const { id: assessmentId } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const stateAttemptId = (location.state as { attemptId?: string } | null)?.attemptId ?? null
  const { data: assessment, isLoading: loadingAssessment } = useStudentAssessmentById(
    assessmentId ?? '',
  )
  const { data: attempts, isLoading: loadingAttempts } = useMyAttempts(assessmentId ?? '')

  const attemptId =
    stateAttemptId ??
    attempts?.find((a) => a.status === 'SUBMITTED' || a.status === 'GRADED')?.id ??
    ''

  const { data: result, isLoading: loadingResult } = useAttemptWithAnalytics(
    assessmentId ?? '',
    attemptId,
  )

  const isLoading = loadingAssessment || loadingAttempts || loadingResult

  if (isLoading) {
    return <LoadingState message="Loading results..." />
  }

  if (!result || !assessment) {
    return (
      <Card className="p-6 text-center">
        <p className="text-text-main">No results found.</p>
        <Button
          type="button"
          className="mt-4"
          variant="secondary"
          onClick={() => navigate('/student/assessments')}
        >
          Back to Assessments
        </Button>
      </Card>
    )
  }

  const score = result.score ?? 0
  const totalMarks = result.total_marks
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
  const analytics = result.analytics as AdaptiveAnalytics | undefined
  const isAdaptive = assessment.is_adaptive && !!analytics

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate('/student/assessments')}
        className="gap-1"
      >
        <ArrowLeft size={16} /> Back to Assessments
      </Button>

      {/* Score Summary */}
      <Card className="p-6 text-center">
        <Trophy
          size={32}
          className={`mx-auto ${percentage >= 70 ? 'text-amber-500' : 'text-slate-400'}`}
        />
        <h1 className="mt-3 text-2xl font-bold text-text-main">{assessment.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isAdaptive ? 'Adaptive Assessment Results' : 'Assessment Results'}
        </p>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div>
            <p className="text-3xl font-bold text-brand-primary">
              {isAdaptive ? analytics.summary.percentage : percentage}%
            </p>
            <p className="text-xs text-slate-500">Score</p>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <p className="text-3xl font-bold text-text-main">
              {isAdaptive
                ? `${analytics.summary.total_correct}/${analytics.summary.total_questions}`
                : `${score}/${totalMarks}`}
            </p>
            <p className="text-xs text-slate-500">{isAdaptive ? 'Correct' : 'Marks'}</p>
          </div>
          {isAdaptive && (
            <>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-3xl font-bold text-text-main">
                  {Math.round(analytics.summary.average_time_per_question_seconds)}s
                </p>
                <p className="text-xs text-slate-500">Avg Time</p>
              </div>
            </>
          )}
        </div>

        {result.submitted_at && (
          <p className="mt-4 text-xs text-slate-500">
            Submitted {new Date(result.submitted_at).toLocaleString()}
          </p>
        )}
      </Card>

      {/* Adaptive Analytics Sections */}
      {isAdaptive && (
        <>
          <DifficultyBreakdownCard analytics={analytics} />

          {analytics.difficulty_progression.length > 0 && (
            <DifficultyProgressionCard analytics={analytics} />
          )}

          {Object.keys(analytics.by_bloom_level).length > 0 && (
            <BloomsTaxonomyCard analytics={analytics} />
          )}

          {analytics.by_learning_objective.length > 0 && (
            <LearningObjectivesCard analytics={analytics} />
          )}

          {analytics.time_per_question.length > 0 && (
            <TimeAnalysisCard analytics={analytics} />
          )}
        </>
      )}

      {/* Per-question breakdown (from JSONB snapshot) */}
      {result.question_breakdown && result.question_breakdown.length > 0 && (
        <QuestionBreakdownCard items={result.question_breakdown} />
      )}

      {/* Fallback: legacy breakdown for older attempts without snapshot */}
      {!result.question_breakdown && !isAdaptive && result.attempt_responses && result.attempt_responses.length > 0 && (
        <LegacyQuestionBreakdownCard result={result} assessment={assessment} />
      )}

      <div className="pb-8 text-center">
        <Link to="/student/assessments">
          <Button type="button" variant="secondary">
            Back to Assessments
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ── Section Components ────────────────────────────────────

function DifficultyBreakdownCard({ analytics }: { analytics: AdaptiveAnalytics }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-brand-primary" />
        <h2 className="text-lg font-semibold text-text-main">Performance by Difficulty</h2>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => {
          const data = analytics.by_difficulty[level]
          if (!data) return null
          return <DifficultyCard key={level} level={level} data={data} />
        })}
      </div>
    </Card>
  )
}

function DifficultyProgressionCard({ analytics }: { analytics: AdaptiveAnalytics }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Target size={18} className="text-brand-primary" />
        <h2 className="text-lg font-semibold text-text-main">Difficulty Progression</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        How difficulty changed as you answered questions
      </p>
      <div className="mt-4 flex items-end gap-1">
        {analytics.difficulty_progression.map((entry, i) => {
          const height =
            entry.difficulty === 'EASY' ? 'h-6' : entry.difficulty === 'MEDIUM' ? 'h-12' : 'h-20'
          const color = entry.is_correct ? 'bg-green-500' : 'bg-red-400'
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-0.5"
              title={`Q${entry.sequence_order}: ${entry.difficulty} - ${entry.is_correct ? 'Correct' : 'Wrong'}`}
            >
              <div className={`w-4 rounded-t transition-all ${height} ${color}`} />
              <span className="text-[9px] text-slate-400">{entry.sequence_order}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
        <span>Height = difficulty level</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-500" /> Correct
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-red-400" /> Wrong
        </span>
      </div>
    </Card>
  )
}

function BloomsTaxonomyCard({ analytics }: { analytics: AdaptiveAnalytics }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-brand-primary" />
        <h2 className="text-lg font-semibold text-text-main">Bloom's Taxonomy</h2>
      </div>
      <div className="mt-4 space-y-3">
        {Object.entries(analytics.by_bloom_level).map(([level, data]) => (
          <div key={level} className="flex items-center gap-3">
            <span className="w-24 text-xs font-medium text-slate-600">{level}</span>
            <div className="flex-1">
              <div className="h-4 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all"
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
            <span className="w-16 text-right text-xs text-slate-500">
              {data.correct}/{data.total} ({data.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LearningObjectivesCard({ analytics }: { analytics: AdaptiveAnalytics }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <BookOpen size={18} className="text-brand-primary" />
        <h2 className="text-lg font-semibold text-text-main">Strengths & Weaknesses</h2>
      </div>
      <div className="mt-4 space-y-3">
        {analytics.by_learning_objective.map((lo) => (
          <LOCard key={lo.learning_objective_id} lo={lo} />
        ))}
      </div>
    </Card>
  )
}

function TimeAnalysisCard({ analytics }: { analytics: AdaptiveAnalytics }) {
  const maxTime = Math.max(...analytics.time_per_question.map((e) => e.time_spent_seconds), 1)
  const totalMin = Math.floor(analytics.summary.total_time_seconds / 60)
  const totalSec = analytics.summary.total_time_seconds % 60
  const avgSec = Math.round(analytics.summary.average_time_per_question_seconds)

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-brand-primary" />
        <h2 className="text-lg font-semibold text-text-main">Time Analysis</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Total: {totalMin}m {totalSec}s | Avg: {avgSec}s per question
      </p>
      <div className="mt-4 flex items-end gap-1">
        {analytics.time_per_question.map((entry) => {
          const heightPx = Math.max(10, (entry.time_spent_seconds / maxTime) * 100)
          return (
            <div
              key={entry.sequence_order}
              className="flex flex-col items-center gap-0.5"
              title={`Q${entry.sequence_order}: ${entry.time_spent_seconds}s (${entry.difficulty})`}
            >
              <div
                className={`w-4 rounded-t ${difficultyBarColor(entry.difficulty)}`}
                style={{ height: `${heightPx}px` }}
              />
              <span className="text-[9px] text-slate-400">{entry.sequence_order}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-500" /> Easy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-amber-500" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-red-500" /> Hard
        </span>
      </div>
    </Card>
  )
}

function QuestionBreakdownCard({ items }: { items: QuestionBreakdownItem[] }) {
  const sorted = [...items].sort((a, b) => a.sequence_order - b.sequence_order)

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-text-main">Question Breakdown</h2>
      <div className="mt-4 space-y-4">
        {sorted.map((item, idx) => {
          const icon = resolveCorrectnessIcon(item.is_correct)

          return (
            <div
              key={item.question_id}
              className="rounded-lg border border-slate-200 bg-white/50 p-4"
            >
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-main">
                      Q{idx + 1}. {item.stem}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">
                      {item.marks_awarded}/{item.marks}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge tone="default">{item.type}</Badge>
                    <Badge
                      tone={
                        item.difficulty_level === 'EASY'
                          ? 'success'
                          : item.difficulty_level === 'HARD'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {item.difficulty_level}
                    </Badge>
                    {item.time_spent_seconds > 0 && (
                      <span className="text-[10px] text-slate-400">{item.time_spent_seconds}s</span>
                    )}
                  </div>
                  {item.learning_objective && (
                    <p className="mt-1 text-[11px] text-slate-400">LO: {item.learning_objective}</p>
                  )}
                </div>
              </div>

              {/* Options (MCQ / MULTI_SELECT) */}
              {item.options.length > 0 && (
                <div className="mt-3 space-y-1.5 pl-7">
                  {item.options.map((opt) => {
                    let cls = 'border-slate-200 bg-white'
                    if (opt.is_correct && opt.was_selected) {
                      cls = 'border-green-400 bg-green-50'
                    } else if (opt.is_correct) {
                      cls = 'border-green-300 bg-green-50/50'
                    } else if (opt.was_selected) {
                      cls = 'border-red-400 bg-red-50'
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${cls}`}
                      >
                        {opt.was_selected && opt.is_correct && (
                          <CheckCircle size={13} className="shrink-0 text-green-600" />
                        )}
                        {opt.was_selected && !opt.is_correct && (
                          <XCircle size={13} className="shrink-0 text-red-600" />
                        )}
                        {!opt.was_selected && opt.is_correct && (
                          <CheckCircle size={13} className="shrink-0 text-green-400" />
                        )}
                        {!opt.was_selected && !opt.is_correct && (
                          <span className="inline-block h-[13px] w-[13px] shrink-0" />
                        )}
                        <span className="text-text-main">{opt.text}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Text response (SHORT_ANSWER) */}
              {item.text_response && (
                <div className="mt-3 pl-7">
                  <p className="rounded bg-slate-100 p-2 text-xs text-slate-700">
                    Your answer: {item.text_response}
                  </p>
                </div>
              )}

              {item.is_correct === null && (
                <p className="mt-2 pl-7 text-xs text-amber-600">Pending teacher review</p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function LegacyQuestionBreakdownCard({
  result,
  assessment,
}: {
  result: AssessmentAttemptWithAnalytics
  assessment: AssessmentWithQuestions
}) {
  const questionMap = new Map(
    (assessment.assessment_questions ?? []).map((aq) => [aq.question_id, aq]),
  )
  const responses = result.attempt_responses ?? []

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-text-main">Question Breakdown</h2>
      <div className="mt-4 space-y-3">
        {responses.map((response, index) => {
          const aq = questionMap.get(response.question_id)
          const icon = resolveCorrectnessIcon(response.is_correct)

          return (
            <div
              key={response.id}
              className="rounded-lg border border-slate-200 bg-white/50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-main">
                      Q{index + 1}. {aq?.question?.stem ?? 'Question'}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">
                      {response.marks_awarded ?? 0}/{aq?.marks ?? 0}
                    </span>
                  </div>
                  {aq?.question?.type && (
                    <Badge tone="default" className="mt-1">
                      {aq.question.type}
                    </Badge>
                  )}
                  {response.is_correct === null && (
                    <p className="mt-1 text-xs text-amber-600">Pending teacher review</p>
                  )}
                  {response.text_response && (
                    <p className="mt-2 rounded bg-slate-100 p-2 text-xs text-slate-700">
                      Your answer: {response.text_response}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Leaf Components ───────────────────────────────────────

function DifficultyCard({ level, data }: { level: string; data: DifficultyBreakdown }) {
  const tone =
    level === 'EASY' ? 'success' : level === 'MEDIUM' ? 'warning' : ('danger' as const)

  return (
    <div className="rounded-lg border border-slate-200 bg-white/50 p-4">
      <div className="flex items-center justify-between">
        <Badge tone={tone}>{level}</Badge>
        <span className="text-sm font-bold text-text-main">{data.percentage}%</span>
      </div>
      <div className="mt-3 space-y-1 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Questions</span>
          <span>{data.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Correct</span>
          <span className="text-green-600">{data.correct}</span>
        </div>
        <div className="flex justify-between">
          <span>Wrong</span>
          <span className="text-red-600">{data.wrong}</span>
        </div>
        <div className="flex justify-between">
          <span>Avg Time</span>
          <span>{data.avg_time_seconds}s</span>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${difficultyBarColor(level)}`}
          style={{ width: `${data.percentage}%` }}
        />
      </div>
    </div>
  )
}

function LOCard({ lo }: { lo: LOBreakdown }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/50 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-main">{lo.title}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span>{lo.correct}/{lo.total} correct</span>
          <span>({lo.percentage}%)</span>
        </div>
      </div>
      <Badge tone={strengthBadgeTone(lo.strength)}>{lo.strength}</Badge>
    </div>
  )
}
