import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Send, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import {
  useStudentAssessmentById,
  useStartAttempt,
  useSubmitResponse,
  useSubmitAttempt,
  useAttemptById,
  useStartAdaptiveAttempt,
  useSubmitAdaptiveResponse,
  useGetNextQuestion,
  useStartSemiAdaptiveAttempt,
  useSubmitSemiAdaptiveResponse,
  useGetSemiAdaptiveNextQuestion,
} from '../hooks/useStudentData'
import type {
  AssessmentQuestion,
  AssessmentWithQuestions,
  AdaptiveQuestionData,
  AdaptiveProgress,
  SemiAdaptiveProgress,
} from '../services/assessments.service'

// ── Difficulty helpers ─────────────────────────────────────

function difficultyColor(d: string): string {
  switch (d) {
    case 'EASY': return 'text-green-400'
    case 'MEDIUM': return 'text-amber-400'
    case 'HARD': return 'text-red-400'
    default: return 'text-slate-400'
  }
}

function difficultyBadgeTone(d: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (d) {
    case 'EASY': return 'success'
    case 'MEDIUM': return 'warning'
    case 'HARD': return 'danger'
    default: return 'default'
  }
}

// ── Root page: resolves assessment and delegates to the right mode ──

export default function ActiveAttemptPage() {
  const { id: assessmentId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const stateAttemptId = (location.state as { attemptId?: string } | null)?.attemptId ?? null

  const { data: assessment, isLoading: loadingAssessment } = useStudentAssessmentById(assessmentId ?? '')

  if (loadingAssessment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading assessment..." />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-text-main">Assessment not found.</p>
          <Button type="button" className="mt-4" onClick={() => navigate('/student/assessments')}>
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const mode = assessment.mode ?? (assessment.is_adaptive ? 'ADAPTIVE' : 'FIXED')

  if (mode === 'SEMI_ADAPTIVE') {
    return (
      <SemiAdaptiveAttempt
        assessmentId={assessmentId ?? ''}
        assessment={assessment}
        initialAttemptId={stateAttemptId}
      />
    )
  }

  if (mode === 'ADAPTIVE' || assessment.is_adaptive) {
    return (
      <AdaptiveAttempt
        assessmentId={assessmentId ?? ''}
        assessment={assessment}
        initialAttemptId={stateAttemptId}
      />
    )
  }

  return (
    <StandardAttempt
      assessmentId={assessmentId ?? ''}
      assessment={assessment}
      initialAttemptId={stateAttemptId}
    />
  )
}

// ── Standard (Non-Adaptive) Attempt ───────────────────────

interface StandardAttemptProps {
  assessmentId: string
  assessment: AssessmentWithQuestions
  initialAttemptId: string | null
}

function StandardAttempt({ assessmentId, assessment, initialAttemptId }: StandardAttemptProps) {
  const navigate = useNavigate()
  const toast = useToast()

  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { optionIds?: string[]; textResponse?: string }>>({})
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  const startAttemptMutation = useStartAttempt()
  const submitResponseMutation = useSubmitResponse()
  const submitAttemptMutation = useSubmitAttempt()
  const { data: attemptData } = useAttemptById(assessmentId, attemptId ?? '')

  // Auto-start attempt if none exists yet; guard with isPending to prevent double-fire under StrictMode
  useEffect(() => {
    if (!attemptId && !startAttemptMutation.isPending) {
      startAttemptMutation.mutateAsync(assessmentId).then((attempt) => {
        setAttemptId(attempt.id)
      }).catch(() => {
        toast.error('Failed to start assessment')
        navigate(`/student/assessments/${assessmentId}`)
      })
    }
  }, [assessmentId, attemptId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hydrate existing answers when resuming an in-progress attempt
  useEffect(() => {
    if (attemptData?.attempt_responses) {
      const existing: Record<string, { optionIds?: string[]; textResponse?: string }> = {}
      for (const r of attemptData.attempt_responses) {
        existing[r.question_id] = {
          optionIds: r.attempt_response_selections.map((s) => s.option_id),
          textResponse: r.text_response ?? undefined,
        }
      }
      // Local edits win over hydrated data via spread order
      setAnswers((prev) => ({ ...existing, ...prev }))
    }
  }, [attemptData])

  // If the attempt has a selected subset (question_count feature), filter to only those questions
  const allQuestions = assessment.assessment_questions ?? []
  const selectedIds = attemptData?.selected_question_ids
  const questions = selectedIds && selectedIds.length > 0
    ? allQuestions.filter((q) => selectedIds.includes(q.question_id))
    : allQuestions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex] as AssessmentQuestion | undefined
  const currentAnswer = currentQuestion ? answers[currentQuestion.question_id] : undefined

  const saveCurrentAnswer = useCallback(async () => {
    if (!attemptId || !currentQuestion) return
    const answer = answers[currentQuestion.question_id]
    if (!answer) return
    try {
      await submitResponseMutation.mutateAsync({
        assessmentId,
        attemptId,
        payload: {
          question_id: currentQuestion.question_id,
          option_ids: answer.optionIds,
          text_response: answer.textResponse,
        },
      })
    } catch {
      // Silent — will retry on next navigation or final submit
    }
  }, [attemptId, currentQuestion, answers, assessmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptionSelect = (questionId: string, optionId: string, type: string) => {
    setAnswers((prev) => {
      const current = prev[questionId]
      if (type === 'MCQ') {
        return { ...prev, [questionId]: { ...current, optionIds: [optionId] } }
      }
      // MULTI_SELECT: toggle
      const currentIds = current?.optionIds ?? []
      const next = currentIds.includes(optionId)
        ? currentIds.filter((id) => id !== optionId)
        : [...currentIds, optionId]
      return { ...prev, [questionId]: { ...current, optionIds: next } }
    })
  }

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], textResponse: text } }))
  }

  const handleNavigate = (nextIndex: number) => {
    void saveCurrentAnswer()
    setCurrentIndex(nextIndex)
  }

  const handleSubmitAttempt = async () => {
    if (!attemptId) return
    await saveCurrentAnswer()
    try {
      await submitAttemptMutation.mutateAsync({ assessmentId, attemptId })
      toast.success('Assessment submitted successfully!')
      navigate(`/student/assessments/${assessmentId}/results`, { state: { attemptId }, replace: true })
    } catch {
      toast.error('Failed to submit assessment. Please try again.')
    }
  }

  const isQuestionAnswered = (questionId: string): boolean => {
    const a = answers[questionId]
    return !!(a?.optionIds?.length || a?.textResponse?.trim())
  }

  const answeredCount = questions.filter((q) => isQuestionAnswered(q.question_id)).length

  if (!attemptId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Starting assessment..." />
      </div>
    )
  }

  if (totalQuestions === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-text-main">This assessment has no questions.</p>
          <Button type="button" className="mt-4" onClick={() => navigate(`/student/assessments/${assessmentId}`)}>
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 p-4 md:grid-cols-[200px_minmax(0,1fr)_220px]">
      {/* Left: Question navigator */}
      <aside className="rounded-xl border border-white/20 bg-white/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Questions</p>
        <p className="mt-1 text-xs text-slate-400">{answeredCount}/{totalQuestions} answered</p>
        <div className="mt-3 grid grid-cols-5 gap-1.5 md:grid-cols-4">
          {questions.map((q, index) => (
            <button
              key={q.question_id}
              type="button"
              onClick={() => handleNavigate(index)}
              className={[
                'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                index === currentIndex
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : isQuestionAnswered(q.question_id)
                    ? 'border-green-500/50 bg-green-500/20 text-green-300'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-800',
              ].join(' ')}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </aside>

      {/* Center: Current question */}
      <Card className="bg-white/95 p-6">
        {currentQuestion && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone="default">{currentQuestion.question.type}</Badge>
                <span className="text-xs text-slate-500">{currentQuestion.marks} marks</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-text-main">{currentQuestion.question.stem}</h2>

            <QuestionOptions
              question={currentQuestion.question}
              questionId={currentQuestion.question_id}
              selectedOptionIds={currentAnswer?.optionIds}
              textResponse={currentAnswer?.textResponse}
              onOptionSelect={handleOptionSelect}
              onTextChange={handleTextChange}
              disabled={false}
            />

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleNavigate(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              <Button
                type="button"
                onClick={() => handleNavigate(Math.min(totalQuestions - 1, currentIndex + 1))}
                disabled={currentIndex === totalQuestions - 1}
                className="gap-1"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Right: Submit actions */}
      <aside className="rounded-xl border border-white/20 bg-white/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Assessment</p>
        <p className="mt-2 text-sm text-slate-200 line-clamp-2">{assessment.title}</p>

        {assessment.time_limit_minutes ? (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
            <Clock size={13} />
            {assessment.time_limit_minutes} min limit
          </div>
        ) : null}

        <div className="mt-3 text-xs text-slate-400">
          {answeredCount} of {totalQuestions} answered
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          {showConfirmSubmit ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  {answeredCount < totalQuestions
                    ? `You have ${totalQuestions - answeredCount} unanswered question(s). Are you sure?`
                    : 'Submit your assessment? This cannot be undone.'}
                </span>
              </div>
              <Button
                type="button"
                onClick={() => { void handleSubmitAttempt() }}
                disabled={submitAttemptMutation.isPending}
                className="w-full gap-1"
              >
                <Send size={14} />
                {submitAttemptMutation.isPending ? 'Submitting...' : 'Confirm Submit'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowConfirmSubmit(false)}
                className="w-full text-slate-300"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full gap-1"
            >
              <Send size={14} />
              Submit Assessment
            </Button>
          )}
        </div>
      </aside>
    </div>
  )
}

// ── Semi-Adaptive Attempt ────────────────────────────────

interface SemiAdaptiveAttemptProps {
  assessmentId: string
  assessment: AssessmentWithQuestions
  initialAttemptId: string | null
}

function SemiAdaptiveAttempt({ assessmentId, assessment, initialAttemptId }: SemiAdaptiveAttemptProps) {
  const navigate = useNavigate()
  const toast = useToast()

  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId)
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestionData | null>(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [textResponse, setTextResponse] = useState('')
  const [progress, setProgress] = useState<SemiAdaptiveProgress | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(() => Date.now())
  const [answeredHistory, setAnsweredHistory] = useState<{ correct: boolean }[]>([])
  const [isAdvancing, setIsAdvancing] = useState(false)

  const startMutation = useStartSemiAdaptiveAttempt()
  const submitResponseMutation = useSubmitSemiAdaptiveResponse()
  const nextQuestionMutation = useGetSemiAdaptiveNextQuestion()
  const submitAttemptMutation = useSubmitAttempt()

  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (initialAttemptId) {
      setAttemptId(initialAttemptId)
      nextQuestionMutation.mutateAsync({ assessmentId, attemptId: initialAttemptId }).then((res) => {
        if (res.completed) {
          setIsCompleted(true)
        } else {
          setCurrentQuestion(res.current_question)
          setQuestionStartTime(Date.now())
        }
        setProgress(res.progress)
      }).catch(() => {
        toast.error('Failed to resume assessment')
        navigate(`/student/assessments/${assessmentId}`)
      })
      return
    }

    startMutation.mutateAsync(assessmentId).then((res) => {
      setAttemptId(res.attempt.id)
      if (res.current_question) {
        setCurrentQuestion(res.current_question)
        setQuestionStartTime(Date.now())
      } else {
        setIsCompleted(true)
      }
      setProgress(res.progress)
    }).catch(() => {
      toast.error('Failed to start assessment')
      navigate(`/student/assessments/${assessmentId}`)
    })
  }, [assessmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptionSelect = (optionId: string, type: string) => {
    if (isAdvancing) return
    if (type === 'MCQ') {
      setSelectedOptionIds([optionId])
    } else {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
    }
  }

  const handleSubmitAnswer = async () => {
    if (!attemptId || !currentQuestion || isAdvancing) return
    setIsAdvancing(true)
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    try {
      const result = await submitResponseMutation.mutateAsync({
        assessmentId,
        attemptId,
        payload: {
          question_id: currentQuestion.id,
          option_ids: selectedOptionIds.length > 0 ? selectedOptionIds : undefined,
          text_response: textResponse || undefined,
          time_spent_seconds: timeSpent,
        },
      })
      setProgress(result.progress)
      setAnsweredHistory((prev) => [...prev, { correct: result.feedback.is_correct }])
      // Immediately advance to the next question
      const res = await nextQuestionMutation.mutateAsync({ assessmentId, attemptId })
      setProgress(res.progress)
      setSelectedOptionIds([])
      setTextResponse('')
      if (res.completed) {
        setIsCompleted(true)
        setCurrentQuestion(null)
      } else {
        setCurrentQuestion(res.current_question)
        setQuestionStartTime(Date.now())
      }
    } catch {
      toast.error('Failed to submit answer')
    } finally {
      setIsAdvancing(false)
    }
  }

  const handleFinishAssessment = async () => {
    if (!attemptId) return
    try {
      await submitAttemptMutation.mutateAsync({ assessmentId, attemptId })
      toast.success('Assessment submitted!')
      navigate(`/student/assessments/${assessmentId}/results`, { state: { attemptId }, replace: true })
    } catch {
      toast.error('Failed to submit assessment')
    }
  }

  const hasAnswer = selectedOptionIds.length > 0 || textResponse.trim().length > 0

  if (!attemptId || (!currentQuestion && !isCompleted)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Preparing assessment..." />
      </div>
    )
  }

  const questionNumber = progress ? progress.questions_answered + 1 : 1

  const totalQuestions = progress?.total_questions ?? 0

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 p-4 md:grid-cols-[200px_minmax(0,1fr)_220px]">
      {/* Left: Progress */}
      <aside className="rounded-xl border border-white/20 bg-white/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Progress</p>
        {progress && (
          <div className="mt-2 space-y-2">
            <div className="text-xs text-slate-400">
              {progress.questions_answered} / {totalQuestions} questions
            </div>
            <div className="h-1.5 rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-primary transition-all"
                style={{
                  width: `${totalQuestions > 0 ? Math.min(100, (progress.questions_answered / totalQuestions) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {answeredHistory.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-slate-400">History</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {answeredHistory.map((h, i) => (
                <div
                  key={i}
                  className={['h-3 w-3 rounded-full', h.correct ? 'bg-green-500' : 'bg-red-500'].join(' ')}
                  title={`Q${i + 1}: ${h.correct ? 'Correct' : 'Wrong'}`}
                />
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Center: Question or completion screen */}
      <Card className="bg-white/95 p-6">
        {isCompleted ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle size={48} className="text-green-600" />
            <h2 className="mt-4 text-xl font-bold text-text-main">All Questions Completed</h2>
            <p className="mt-2 text-sm text-slate-600">
              You answered {progress?.questions_answered ?? 0} questions. Submit to see your results.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              {showConfirmSubmit ? (
                <>
                  <Button
                    type="button"
                    onClick={() => { void handleFinishAssessment() }}
                    disabled={submitAttemptMutation.isPending}
                    className="gap-1"
                  >
                    <Send size={14} />
                    {submitAttemptMutation.isPending ? 'Submitting...' : 'Confirm Submit'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowConfirmSubmit(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="button" className="gap-1" onClick={() => setShowConfirmSubmit(true)}>
                  <Send size={14} />
                  Submit Assessment
                </Button>
              )}
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Question {questionNumber} of {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone="default">{currentQuestion.type}</Badge>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-text-main">{currentQuestion.stem}</h2>

            <QuestionOptions
              question={currentQuestion}
              questionId={currentQuestion.id}
              selectedOptionIds={selectedOptionIds}
              textResponse={textResponse}
              onOptionSelect={(_qId, optId, type) => handleOptionSelect(optId, type)}
              onTextChange={(_qId, text) => setTextResponse(text)}
              disabled={isAdvancing}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => { void handleSubmitAnswer() }}
                disabled={!hasAnswer || isAdvancing}
                className="gap-1"
              >
                {isAdvancing ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Right: Assessment info */}
      <aside className="rounded-xl border border-white/20 bg-white/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Assessment</p>
        <p className="mt-2 text-sm text-slate-200 line-clamp-2">{assessment.title}</p>

        {assessment.time_limit_minutes ? (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
            <Clock size={13} />
            {assessment.time_limit_minutes} min limit
          </div>
        ) : null}

        <div className="mt-4 space-y-1.5 text-xs text-slate-400">
          <p>Questions are selected from the bank.</p>
          <p>Answering correctly may trigger challenge questions.</p>
        </div>

        {!isCompleted && progress && progress.questions_answered > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            {showConfirmSubmit ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>Submit early? You still have questions remaining.</span>
                </div>
                <Button
                  type="button"
                  onClick={() => { void handleFinishAssessment() }}
                  disabled={submitAttemptMutation.isPending}
                  className="w-full gap-1"
                >
                  <Send size={14} />
                  {submitAttemptMutation.isPending ? 'Submitting...' : 'Confirm'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="w-full text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full gap-1"
              >
                <Send size={14} />
                Finish Early
              </Button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

// ── Adaptive Attempt ───────────────────────────────────────

interface AdaptiveAttemptProps {
  assessmentId: string
  assessment: AssessmentWithQuestions
  initialAttemptId: string | null
}

interface AnswerHistoryEntry {
  correct: boolean
  difficulty: string
}

function AdaptiveAttempt({ assessmentId, assessment, initialAttemptId }: AdaptiveAttemptProps) {
  const navigate = useNavigate()
  const toast = useToast()

  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId)
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestionData | null>(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [textResponse, setTextResponse] = useState('')
  const [progress, setProgress] = useState<AdaptiveProgress | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(() => Date.now())
  const [answeredHistory, setAnsweredHistory] = useState<AnswerHistoryEntry[]>([])
  const [isAdvancing, setIsAdvancing] = useState(false)

  const startAdaptiveMutation = useStartAdaptiveAttempt()
  const submitAdaptiveResponseMutation = useSubmitAdaptiveResponse()
  const nextQuestionMutation = useGetNextQuestion()
  const submitAttemptMutation = useSubmitAttempt()

  // Bootstrap the adaptive session once. We use a ref so the effect body
  // only fires once even in React StrictMode double-invocation.
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (initialAttemptId) {
      // Resuming an existing attempt — fetch whichever question is next
      setAttemptId(initialAttemptId)
      nextQuestionMutation.mutateAsync({ assessmentId, attemptId: initialAttemptId }).then((res) => {
        if (res.completed) {
          setIsCompleted(true)
        } else {
          setCurrentQuestion(res.current_question)
          setQuestionStartTime(Date.now())
        }
        setProgress(res.progress)
      }).catch(() => {
        toast.error('Failed to resume assessment')
        navigate(`/student/assessments/${assessmentId}`)
      })
      return
    }

    startAdaptiveMutation.mutateAsync(assessmentId).then((res) => {
      setAttemptId(res.attempt.id)
      if (res.current_question) {
        setCurrentQuestion(res.current_question)
        setQuestionStartTime(Date.now())
      } else {
        // Edge case: assessment has zero questions
        setIsCompleted(true)
      }
      setProgress(res.progress)
    }).catch(() => {
      toast.error('Failed to start assessment')
      navigate(`/student/assessments/${assessmentId}`)
    })
  }, [assessmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptionSelect = (optionId: string, type: string) => {
    if (isAdvancing) return
    if (type === 'MCQ') {
      setSelectedOptionIds([optionId])
    } else {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
    }
  }

  const handleSubmitAnswer = async () => {
    if (!attemptId || !currentQuestion || isAdvancing) return
    setIsAdvancing(true)
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    try {
      const result = await submitAdaptiveResponseMutation.mutateAsync({
        assessmentId,
        attemptId,
        payload: {
          question_id: currentQuestion.id,
          option_ids: selectedOptionIds.length > 0 ? selectedOptionIds : undefined,
          text_response: textResponse || undefined,
          time_spent_seconds: timeSpent,
        },
      })
      setProgress(result.progress)
      setAnsweredHistory((prev) => [
        ...prev,
        { correct: result.feedback.is_correct, difficulty: currentQuestion.difficulty_level },
      ])
      // Immediately advance to the next question
      const res = await nextQuestionMutation.mutateAsync({ assessmentId, attemptId })
      setProgress(res.progress)
      setSelectedOptionIds([])
      setTextResponse('')
      if (res.completed) {
        setIsCompleted(true)
        setCurrentQuestion(null)
      } else {
        setCurrentQuestion(res.current_question)
        setQuestionStartTime(Date.now())
      }
    } catch {
      toast.error('Failed to submit answer')
    } finally {
      setIsAdvancing(false)
    }
  }

  const handleFinishAssessment = async () => {
    if (!attemptId) return
    try {
      await submitAttemptMutation.mutateAsync({ assessmentId, attemptId })
      toast.success('Assessment submitted!')
      navigate(`/student/assessments/${assessmentId}/results`, { state: { attemptId }, replace: true })
    } catch {
      toast.error('Failed to submit assessment')
    }
  }

  const hasAnswer = selectedOptionIds.length > 0 || textResponse.trim().length > 0

  // Show a spinner while bootstrapping (no attemptId yet and not completed)
  if (!attemptId || (!currentQuestion && !isCompleted)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Preparing adaptive assessment..." />
      </div>
    )
  }

  const questionNumber = progress ? progress.questions_answered + 1 : 1

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 p-4 md:grid-cols-[200px_minmax(0,1fr)_220px]">
      {/* Left: Progress & history */}
      <aside className="rounded-xl border border-white/20 bg-white/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Progress</p>
        {progress && (
          <div className="mt-2 space-y-2">
            <div className="text-xs text-slate-400">
              {progress.questions_answered} / {progress.max_questions} questions
            </div>
            <div className="h-1.5 rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-primary transition-all"
                style={{
                  width: `${Math.min(100, (progress.questions_answered / progress.max_questions) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingUp size={12} className={difficultyColor(progress.current_difficulty)} />
              <span className={difficultyColor(progress.current_difficulty)}>
                {progress.current_difficulty}
              </span>
            </div>
          </div>
        )}

        {answeredHistory.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-slate-400">History</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {answeredHistory.map((h, i) => (
                <div
                  key={i} // index is stable here — list only grows
                  className={['h-3 w-3 rounded-full', h.correct ? 'bg-green-500' : 'bg-red-500'].join(' ')}
                  title={`Q${i + 1}: ${h.correct ? 'Correct' : 'Wrong'} (${h.difficulty})`}
                />
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Center: Question or completion screen */}
      <Card className="bg-white/95 p-6">
        {isCompleted ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle size={48} className="text-green-600" />
            <h2 className="mt-4 text-xl font-bold text-text-main">All Questions Completed</h2>
            <p className="mt-2 text-sm text-slate-600">
              You answered {progress?.questions_answered ?? 0} questions. Submit to see your results.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              {showConfirmSubmit ? (
                <>
                  <Button
                    type="button"
                    onClick={() => { void handleFinishAssessment() }}
                    disabled={submitAttemptMutation.isPending}
                    className="gap-1"
                  >
                    <Send size={14} />
                    {submitAttemptMutation.isPending ? 'Submitting...' : 'Confirm Submit'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowConfirmSubmit(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="button" className="gap-1" onClick={() => setShowConfirmSubmit(true)}>
                  <Send size={14} />
                  Submit Assessment
                </Button>
              )}
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Question {questionNumber}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone={difficultyBadgeTone(currentQuestion.difficulty_level)}>
                  {currentQuestion.difficulty_level}
                </Badge>
                <Badge tone="default">{currentQuestion.type}</Badge>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-text-main">{currentQuestion.stem}</h2>

            <QuestionOptions
              question={currentQuestion}
              questionId={currentQuestion.id}
              selectedOptionIds={selectedOptionIds}
              textResponse={textResponse}
              onOptionSelect={(_qId, optId, type) => handleOptionSelect(optId, type)}
              onTextChange={(_qId, text) => setTextResponse(text)}
              disabled={isAdvancing}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => { void handleSubmitAnswer() }}
                disabled={!hasAnswer || isAdvancing}
                className="gap-1"
              >
                {isAdvancing ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Right: Assessment info & early finish */}
      <aside className="rounded-xl border border-white/20 bg-white/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Adaptive Assessment</p>
        <p className="mt-2 text-sm text-slate-200 line-clamp-2">{assessment.title}</p>

        {assessment.time_limit_minutes ? (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
            <Clock size={13} />
            {assessment.time_limit_minutes} min limit
          </div>
        ) : null}

        <div className="mt-4 space-y-1.5 text-xs text-slate-400">
          <p>Questions adapt to your skill level.</p>
          <p>Answer correctly to unlock harder questions.</p>
        </div>

        {/* Early finish — only shown once at least one question is answered and not yet complete */}
        {!isCompleted && progress && progress.questions_answered > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            {showConfirmSubmit ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>Submit early? You can still answer more questions.</span>
                </div>
                <Button
                  type="button"
                  onClick={() => { void handleFinishAssessment() }}
                  disabled={submitAttemptMutation.isPending}
                  className="w-full gap-1"
                >
                  <Send size={14} />
                  {submitAttemptMutation.isPending ? 'Submitting...' : 'Confirm'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="w-full text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full gap-1"
              >
                <Send size={14} />
                Finish Early
              </Button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

// ── Shared: Question options renderer ─────────────────────
//
// Accepts both AssessmentQuestion['question'] (standard) and AdaptiveQuestionData (adaptive)
// via a structural duck-type — both share { type, question_options }.

interface QuestionShape {
  type: string
  question_options: Array<{ id: string; text: string; order_index: number }>
}

interface QuestionOptionsProps {
  question: QuestionShape
  questionId: string
  selectedOptionIds?: string[]
  textResponse?: string
  onOptionSelect: (questionId: string, optionId: string, type: string) => void
  onTextChange: (questionId: string, text: string) => void
  disabled: boolean
}

function QuestionOptions({
  question,
  questionId,
  selectedOptionIds,
  textResponse,
  onOptionSelect,
  onTextChange,
  disabled,
}: QuestionOptionsProps) {
  if (question.type === 'SHORT_ANSWER') {
    return (
      <textarea
        value={textResponse ?? ''}
        onChange={(e) => onTextChange(questionId, e.target.value)}
        placeholder="Type your answer here..."
        rows={4}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-text-main placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-60"
      />
    )
  }

  return (
    <div className="space-y-2">
      {question.type === 'MULTI_SELECT' && (
        <p className="text-xs text-slate-500">Select all that apply</p>
      )}
      {question.question_options.map((option) => {
        const isSelected = selectedOptionIds?.includes(option.id) ?? false

        const optionClass = isSelected
          ? 'border-brand-primary bg-brand-primary/10 text-text-main'
          : 'border-slate-200 bg-white text-text-main hover:border-brand-primary/50 hover:bg-slate-50'

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onOptionSelect(questionId, option.id, question.type)}
            disabled={disabled}
            className={`w-full rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-default ${optionClass}`}
          >
            {option.text}
          </button>
        )
      })}
    </div>
  )
}
