import { useParams, useNavigate, Link } from 'react-router-dom'
import { Clock, FileText, Target, BookOpen, CheckCircle, PlayCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useToast } from '@/hooks/useToast'
import { useStudentAssessmentById, useMyAttempts, useStartAttempt } from '../hooks/useStudentData'

function typeBadgeTone(type: string): 'default' | 'success' | 'warning' | 'danger' {
  switch (type) {
    case 'QUIZ':
      return 'default'
    case 'EXAM':
      return 'danger'
    case 'PRACTICE':
      return 'success'
    default:
      return 'default'
  }
}

function formatDueDate(dueAt: string): string {
  return new Date(dueAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AssessmentInfoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const {
    data: assessment,
    isLoading: loadingAssessment,
    error: assessmentError,
    refetch: refetchAssessment,
  } = useStudentAssessmentById(id ?? '')

  const {
    data: attempts,
    isLoading: loadingAttempts,
    error: attemptsError,
    refetch: refetchAttempts,
  } = useMyAttempts(id ?? '')

  const startAttemptMutation = useStartAttempt()

  if (loadingAssessment || loadingAttempts) {
    return <LoadingState message="Loading assessment details..." />
  }

  if (assessmentError) {
    return (
      <ErrorState
        message="Failed to load assessment details."
        onRetry={() => { void refetchAssessment() }}
      />
    )
  }

  if (attemptsError) {
    return (
      <ErrorState
        message="Failed to load your attempt history."
        onRetry={() => { void refetchAttempts() }}
      />
    )
  }

  if (!assessment) {
    return <ErrorState message="Assessment not found." />
  }

  const inProgressAttempt = attempts?.find((a) => a.status === 'IN_PROGRESS')
  const completedAttempt = attempts?.find(
    (a) => a.status === 'SUBMITTED' || a.status === 'GRADED',
  )

  const handleStart = async () => {
    try {
      const attempt = await startAttemptMutation.mutateAsync(assessment.id)
      navigate(`/student/assessments/${assessment.id}/attempt`, {
        state: { attemptId: attempt.id },
      })
    } catch {
      toast.error('Failed to start assessment. Please try again.')
    }
  }

  const adaptiveConfig = assessment.adaptive_config
  const questionCount = assessment.is_adaptive
    ? (adaptiveConfig?.max_questions ?? 20)
    : (assessment.assessment_questions?.length ?? assessment.question_count ?? 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-main">{assessment.title}</h1>
            {assessment.description && (
              <p className="mt-2 text-sm text-slate-600">{assessment.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {assessment.is_adaptive && (
              <Badge tone="warning">Adaptive</Badge>
            )}
            <Badge tone={typeBadgeTone(assessment.type)}>{assessment.type}</Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <FileText size={15} />
            {questionCount} questions
          </span>
          <span className="flex items-center gap-1.5">
            <Target size={15} />
            {assessment.total_marks ?? 0} marks
          </span>
          {assessment.time_limit_minutes ? (
            <span className="flex items-center gap-1.5">
              <Clock size={15} />
              {assessment.time_limit_minutes} minutes
            </span>
          ) : null}
          {assessment.due_at ? (
            <span className="flex items-center gap-1.5">
              <Clock size={15} />
              Due: {formatDueDate(assessment.due_at)}
            </span>
          ) : null}
        </div>
      </Card>

      {/* Attempt Status & Actions */}
      <Card className="p-6">
        {completedAttempt ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="font-semibold text-text-main">Assessment Completed</p>
                <p className="text-sm text-slate-600">
                  Score: {completedAttempt.score ?? 0} / {completedAttempt.total_marks} marks
                </p>
              </div>
            </div>
            <Link
              to={`/student/assessments/${assessment.id}/results`}
              state={{ attemptId: completedAttempt.id }}
            >
              <Button type="button" variant="secondary">
                View Results
              </Button>
            </Link>
          </div>
        ) : inProgressAttempt ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlayCircle size={20} className="text-amber-600" />
              <div>
                <p className="font-semibold text-text-main">Assessment In Progress</p>
                <p className="text-sm text-slate-600">
                  Started {new Date(inProgressAttempt.started_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => { void handleStart() }}
              disabled={startAttemptMutation.isPending}
            >
              {startAttemptMutation.isPending ? 'Resuming...' : 'Resume Assessment'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-brand-primary" />
              <div>
                <p className="font-semibold text-text-main">Ready to Start</p>
                <p className="text-sm text-slate-600">
                  You haven't attempted this assessment yet.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => { void handleStart() }}
              disabled={startAttemptMutation.isPending}
            >
              {startAttemptMutation.isPending ? 'Starting...' : 'Start Assessment'}
            </Button>
          </div>
        )}
      </Card>

      {/* Questions Preview */}
      {assessment.assessment_questions && assessment.assessment_questions.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-main">Questions</h2>
          <div className="mt-3 space-y-2">
            {assessment.assessment_questions.map((aq, index) => (
              <div
                key={aq.question_id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/50 p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-main">{aq.question?.stem ?? 'Question'}</p>
                  <div className="mt-1 flex gap-2">
                    <span className="text-xs text-slate-500">{aq.question?.type ?? ''}</span>
                    <span className="text-xs text-slate-500">{aq.marks} marks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
