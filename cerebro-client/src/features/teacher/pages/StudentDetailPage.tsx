import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  Lightbulb,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { AiBadge } from '@/components/shared/AiBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/shared/LoadingState'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import {
  useStudentProgress,
  useStudentInsight,
  useGenerateStudentInsight,
  useGenerateStudentAnalytics,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useReviewMilestoneTask,
} from '../hooks/useTeacherData'
import type { AssessmentSummaryItem, Milestone, MilestoneTask } from '../services/student-progress.service'

// ── Helpers ──────────────────────────────────────────────────

function scoreColor(pct: number | null): string {
  if (pct === null) return 'text-slate-500'
  if (pct >= 70) return 'text-green-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function statusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 size={18} className="text-green-600" />
    case 'IN_PROGRESS':
      return <Loader2 size={18} className="text-amber-500" />
    default:
      return <Circle size={18} className="text-slate-300" />
  }
}

function statusBadgeTone(status: string): 'default' | 'success' | 'warning' {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'IN_PROGRESS':
      return 'warning'
    default:
      return 'default'
  }
}

function statusLineColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-400'
    case 'IN_PROGRESS':
      return 'bg-amber-400'
    default:
      return 'bg-slate-200'
  }
}

function completionColor(pct: number): string {
  if (pct >= 80) return 'text-green-600 bg-green-50'
  if (pct >= 50) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

// ── Main page ────────────────────────────────────────────────

export default function StudentDetailPage() {
  const { id: classroomId, studentId } = useParams<{
    id: string
    studentId: string
  }>()
  const navigate = useNavigate()
  const toast = useToast()

  const query = useStudentProgress(classroomId ?? '', studentId ?? '')
  const insightQuery = useStudentInsight(classroomId ?? '', studentId ?? '')
  const generateMutation = useGenerateStudentInsight()
  const analyticsMutation = useGenerateStudentAnalytics()
  const createMutation = useCreateMilestone()
  const updateMutation = useUpdateMilestone()
  const deleteMutation = useDeleteMilestone()
  const reviewMutation = useReviewMilestoneTask()

  const [panelOpen, setPanelOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', due_date: '' })

  // Review panel state
  const [reviewMilestone, setReviewMilestone] = useState<Milestone | null>(null)
  const [reviewForms, setReviewForms] = useState<Record<string, { completion_pct: string; teacher_comment: string }>>({})

  if (query.isLoading) return <LoadingState message="Loading student details..." />
  if (query.isError || !query.data) {
    return (
      <ErrorState
        message="Failed to load student details."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const { student, assessments, milestones } = query.data
  const insight = insightQuery.data?.insight ?? null
  const milestoneCompletionPct =
    milestones.data.length > 0
      ? Math.round(milestones.data.reduce((sum, m) => sum + m.completion_pct, 0) / milestones.data.length)
      : 0

  const assessmentColumns: DataTableColumn<AssessmentSummaryItem>[] = [
    {
      key: 'title',
      header: 'Assessment',
      render: (row) => (
        <div>
          <span className="font-medium text-text-main">{row.assessment_title}</span>
          {row.is_adaptive && (
            <Badge tone="warning" className="ml-2">Adaptive</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge>{row.assessment_type}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={row.status === 'GRADED' || row.status === 'SUBMITTED' ? 'success' : 'warning'}>{row.status}</Badge>,
    },
    {
      key: 'score',
      header: 'Score',
      render: (row) => (
        <span className={`font-semibold ${scoreColor(row.score_pct)}`}>
          {row.score_pct !== null ? `${row.score_pct}%` : '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span className="text-sm text-slate-500">
          {new Date(row.started_at).toLocaleDateString()}
        </span>
      ),
    },
  ]

  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!classroomId || !studentId) return
    try {
      await createMutation.mutateAsync({
        classroomId,
        studentId,
        payload: {
          title: form.title,
          description: form.description || undefined,
          due_date: form.due_date || undefined,
        },
      })
      toast.success('Milestone created.')
      setPanelOpen(false)
      setForm({ title: '', description: '', due_date: '' })
    } catch {
      toast.error('Failed to create milestone.')
    }
  }

  async function handleStatusToggle(milestone: Milestone) {
    const nextStatus =
      milestone.status === 'NOT_STARTED'
        ? 'IN_PROGRESS'
        : milestone.status === 'IN_PROGRESS'
          ? 'COMPLETED'
          : 'NOT_STARTED'
    try {
      await updateMutation.mutateAsync({
        milestoneId: milestone.id,
        payload: { status: nextStatus as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' },
      })
    } catch {
      toast.error('Failed to update milestone.')
    }
  }

  async function handleDelete(milestoneId: string) {
    try {
      await deleteMutation.mutateAsync(milestoneId)
      toast.success('Milestone deleted.')
    } catch {
      toast.error('Failed to delete milestone.')
    }
  }

  function openReviewPanel(milestone: Milestone) {
    const tasks = milestone.tasks ?? []
    const forms: Record<string, { completion_pct: string; teacher_comment: string }> = {}
    for (const task of tasks) {
      forms[task.id] = {
        completion_pct: task.completion_pct !== null ? String(task.completion_pct) : '',
        teacher_comment: task.teacher_comment ?? '',
      }
    }
    setReviewForms(forms)
    setReviewMilestone(milestone)
  }

  async function handleReviewTask(taskId: string) {
    const formData = reviewForms[taskId]
    if (!formData || formData.completion_pct === '') return
    try {
      await reviewMutation.mutateAsync({
        taskId,
        payload: {
          completion_pct: Number(formData.completion_pct),
          teacher_comment: formData.teacher_comment || undefined,
        },
      })
      toast.success('Task reviewed.')
    } catch {
      toast.error('Failed to review task.')
    }
  }

  async function handleGenerateInsight() {
    if (!classroomId || !studentId) return
    try {
      await generateMutation.mutateAsync({ classroomId, studentId })
      toast.success('AI overview generated.')
    } catch {
      toast.error('Failed to generate AI overview.')
    }
  }

  async function handleGenerateAnalytics() {
    if (!classroomId || !studentId) return
    try {
      await analyticsMutation.mutateAsync({ classroomId, studentId })
      toast.success('Student analytics generated successfully.')
    } catch {
      toast.error('Failed to generate analytics.')
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Back + Header */}
        <Card className="p-5">
          <Button
            variant="ghost"
            onClick={() => navigate(`/teacher/classrooms/${classroomId}`)}
            className="mb-3 flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft size={15} />
            Back to Classroom
          </Button>

          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-white">
              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-text-main">
                {student.first_name} {student.last_name}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail size={13} />
                {student.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Two-column layout */}
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* ── Left Column ──────────────────────────────── */}
          <div className="space-y-4">
            {/* Assessment Performance Summary */}
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-primary" />
                <h2 className="text-base font-semibold text-text-main">Assessment Performance</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <StatBox label="Total Taken" value={String(assessments.summary.total_taken)} icon={<Clock size={18} className="text-blue-600" />} accent="bg-blue-100/80" />
                <StatBox label="Submitted" value={String(assessments.summary.total_submitted)} icon={<Award size={18} className="text-green-600" />} accent="bg-green-100/80" />
                <StatBox label="Avg Score" value={assessments.summary.average_score_pct !== null ? `${assessments.summary.average_score_pct}%` : 'N/A'} valueClass={scoreColor(assessments.summary.average_score_pct)} icon={<Target size={18} className="text-purple-600" />} accent="bg-purple-100/80" />
                <StatBox label="Highest" value={assessments.summary.highest_score_pct !== null ? `${assessments.summary.highest_score_pct}%` : 'N/A'} valueClass={scoreColor(assessments.summary.highest_score_pct)} icon={<TrendingUp size={18} className="text-emerald-600" />} accent="bg-emerald-100/80" />
              </div>
            </Card>

            {/* AI Insight Card */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-brand-blue/10 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-indigo-900">AI Student Overview</h3>
                  <AiBadge />
                </div>
                <Button
                  variant="ghost"
                  className="gap-1.5 text-xs text-indigo-600 hover:text-indigo-800"
                  onClick={() => void handleGenerateInsight()}
                  disabled={generateMutation.isPending}
                >
                  <RefreshCw size={13} className={generateMutation.isPending ? 'animate-spin' : ''} />
                  {generateMutation.isPending ? 'Generating...' : 'Generate Latest'}
                </Button>
              </div>
              <div className="p-5">
                {generateMutation.isPending ? (
                  <div className="flex items-center gap-3 py-6">
                    <Loader2 size={18} className="animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500">Generating AI overview...</p>
                  </div>
                ) : insightQuery.isLoading ? (
                  <div className="flex items-center gap-3 py-6">
                    <Loader2 size={18} className="animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500">Loading...</p>
                  </div>
                ) : insight ? (
                  <div className="space-y-4">
                    {insightQuery.data?.generated_at && (
                      <p className="text-[11px] text-slate-400">
                        Generated {new Date(insightQuery.data.generated_at).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed text-text-main">{insight.summary}</p>
                    {insight.strengths.length > 0 && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-green-600" />
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700">Strengths</h4>
                        </div>
                        <ul className="space-y-1">
                          {insight.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-green-500" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.areas_for_improvement.length > 0 && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <TrendingDown size={13} className="text-amber-600" />
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700">Areas to Improve</h4>
                        </div>
                        <ul className="space-y-1">
                          {insight.areas_for_improvement.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <Target size={12} className="mt-0.5 shrink-0 text-amber-500" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.recommended_next_milestone && (
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <Lightbulb size={13} className="text-indigo-600" />
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Recommended Next Milestone</h4>
                        </div>
                        <p className="text-sm font-medium text-indigo-900">{insight.recommended_next_milestone.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-indigo-700/80">{insight.recommended_next_milestone.description}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-slate-500">No AI overview generated yet.</p>
                    <Button
                      variant="ghost"
                      className="mt-2 gap-1.5 text-xs text-indigo-600"
                      onClick={() => void handleGenerateInsight()}
                      disabled={generateMutation.isPending}
                    >
                      <Sparkles size={13} />
                      Generate Overview
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Generate Analytics CTA */}
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100/80">
                  <BarChart3 size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-main">Student Analytics</h3>
                  <p className="text-xs text-slate-500">
                    Generate AI-powered analytics visible on the student&apos;s dashboard
                  </p>
                </div>
              </div>
              <Button
                onClick={() => void handleGenerateAnalytics()}
                disabled={analyticsMutation.isPending}
                className="gap-1.5 text-xs"
              >
                {analyticsMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Generate Analytics
                  </>
                )}
              </Button>
            </Card>

            {/* Assessment History */}
            <Card className="p-5">
              <h2 className="mb-3 font-semibold text-text-main">Assessment History</h2>
              {assessments.data.length === 0 ? (
                <EmptyState title="No assessments taken" description="This student hasn't attempted any assessments yet." />
              ) : (
                <DataTable columns={assessmentColumns} rows={assessments.data} rowKey={(row) => row.attempt_id} />
              )}
            </Card>
          </div>

          {/* ── Right Column ─────────────────────────────── */}
          <div className="space-y-4">
            {/* Milestone Progress Header */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-brand-primary" />
                  <h2 className="text-base font-semibold text-text-main">Milestones</h2>
                </div>
                <Button
                  onClick={() => {
                    setPanelOpen(true)
                    setForm({ title: '', description: '', due_date: '' })
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus size={13} />
                  Add
                </Button>
              </div>

              {milestones.summary.total > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{milestones.summary.completed}/{milestones.summary.total} completed</span>
                    <span className="font-semibold text-brand-primary">{milestoneCompletionPct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                      style={{ width: `${milestoneCompletionPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Vertical Timeline */}
              <div className="mt-5">
                {milestones.data.length === 0 ? (
                  <EmptyState title="No milestones yet" description="Add learning goals for this student." />
                ) : (
                  <div className="relative">
                    {milestones.data.map((m, index) => {
                      const isLast = index === milestones.data.length - 1
                      const tasks = m.tasks ?? []
                      return (
                        <div key={m.id} className="relative flex gap-3 pb-5 last:pb-0">
                          {!isLast && (
                            <div
                              className={`absolute left-[9px] top-[26px] w-0.5 ${statusLineColor(m.status)}`}
                              style={{ height: 'calc(100% - 14px)' }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => void handleStatusToggle(m)}
                            className="z-10 mt-0.5 shrink-0"
                            title="Toggle status"
                          >
                            {statusIcon(m.status)}
                          </button>
                          <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white/60 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium leading-tight ${m.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-text-main'}`}>
                                    {m.title}
                                  </p>
                                  <Badge tone={statusBadgeTone(m.status)} className="shrink-0 text-[10px]">
                                    {m.status.replace('_', ' ')}
                                  </Badge>
                                  {m.completion_pct > 0 && (
                                    <span className={`text-xs font-bold ${m.completion_pct >= 80 ? 'text-green-600' : m.completion_pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                      {m.completion_pct}%
                                    </span>
                                  )}
                                </div>
                                {m.description && (
                                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{m.description}</p>
                                )}
                                {m.due_date && (
                                  <p className="mt-1.5 text-[11px] text-slate-400">
                                    Due: {new Date(m.due_date).toLocaleDateString()}
                                  </p>
                                )}

                                {/* Tasks summary */}
                                {tasks.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {tasks.slice(0, 2).map((task) => (
                                      <div key={task.id} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                        <ClipboardCheck size={10} className={task.reviewed_at ? 'text-green-500' : 'text-slate-300'} />
                                        <span className="truncate">{task.description}</span>
                                        {task.completion_pct !== null && (
                                          <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold ${completionColor(task.completion_pct)}`}>
                                            {task.completion_pct}%
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                    {tasks.length > 2 && (
                                      <p className="text-[10px] text-slate-400">+{tasks.length - 2} more</p>
                                    )}
                                  </div>
                                )}

                                {/* Review tasks button */}
                                {tasks.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    className="mt-2 gap-1 text-[11px]"
                                    onClick={() => openReviewPanel(m)}
                                  >
                                    <ClipboardCheck size={11} />
                                    Review Tasks ({tasks.length})
                                  </Button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleDelete(m.id)}
                                className="shrink-0 p-0.5 text-slate-300 hover:text-red-500"
                                title="Delete milestone"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>
      </div>

      {/* Add Milestone Panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add Milestone"
      >
        <form className="space-y-4" onSubmit={(e) => void handleCreateMilestone(e)}>
          <FormField label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Master quadratic equations"
              required
            />
          </FormField>
          <FormField label="Description (optional)">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What the student should achieve..."
              rows={4}
            />
          </FormField>
          <FormField label="Due Date (optional)">
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !form.title.trim()}>
              {createMutation.isPending ? 'Creating...' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      {/* Review Tasks Panel */}
      <SlidePanel
        open={reviewMilestone !== null}
        onClose={() => setReviewMilestone(null)}
        title="Review Tasks"
      >
        {reviewMilestone && (
          <>
            <div className="mb-5 rounded-lg border border-brand-blue/15 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">Milestone</p>
              <p className="mt-0.5 text-sm font-semibold text-text-main">{reviewMilestone.title}</p>
              <Badge tone={statusBadgeTone(reviewMilestone.status)} className="mt-1">
                {reviewMilestone.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-4">
              {(reviewMilestone.tasks ?? []).map((task) => (
                <ReviewTaskCard
                  key={task.id}
                  task={task}
                  formData={reviewForms[task.id] ?? { completion_pct: '', teacher_comment: '' }}
                  onFormChange={(field, value) =>
                    setReviewForms((prev) => ({
                      ...prev,
                      [task.id]: { ...prev[task.id], [field]: value },
                    }))
                  }
                  onSubmit={() => void handleReviewTask(task.id)}
                  isPending={reviewMutation.isPending}
                />
              ))}
            </div>
          </>
        )}
      </SlidePanel>
    </>
  )
}

// ── Review Task Card ─────────────────────────────────────────

function ReviewTaskCard({
  task,
  formData,
  onFormChange,
  onSubmit,
  isPending,
}: {
  task: MilestoneTask
  formData: { completion_pct: string; teacher_comment: string }
  onFormChange: (field: 'completion_pct' | 'teacher_comment', value: string) => void
  onSubmit: () => void
  isPending: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-text-main">{task.description}</p>
      <p className="mt-1 text-[11px] text-slate-400">
        Added {new Date(task.created_at).toLocaleDateString()}
      </p>

      {task.reviewed_at && task.reviewed_by && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green-600">
          <CheckCircle2 size={11} />
          <span>
            Reviewed by {task.reviewed_by.first_name} {task.reviewed_by.last_name} on {new Date(task.reviewed_at).toLocaleDateString()}
          </span>
        </div>
      )}

      {task.teacher_comment && task.reviewed_at && (
        <div className="mt-2 flex items-start gap-1.5 rounded border border-blue-100 bg-blue-50/50 px-2 py-1.5">
          <MessageSquare size={11} className="mt-0.5 shrink-0 text-blue-500" />
          <p className="text-xs leading-relaxed text-blue-800">{task.teacher_comment}</p>
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-[100px_1fr]">
        <FormField label="Completion %">
          <Select
            value={formData.completion_pct}
            onChange={(e) => onFormChange('completion_pct', e.target.value)}
          >
            <option value="">—</option>
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
              <option key={v} value={String(v)}>{v}%</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Comment">
          <Textarea
            value={formData.teacher_comment}
            onChange={(e) => onFormChange('teacher_comment', e.target.value)}
            placeholder="Add feedback for the student..."
            rows={2}
          />
        </FormField>
      </div>

      <div className="mt-2 flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={isPending || formData.completion_pct === ''}
          className="gap-1 text-xs"
        >
          <ClipboardCheck size={12} />
          {isPending ? 'Saving...' : task.reviewed_at ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </div>
  )
}

// ── Stat component ───────────────────────────────────────────

function StatBox({
  label,
  value,
  valueClass = 'text-text-main',
  icon,
  accent,
}: {
  label: string
  value: string
  valueClass?: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-blue/15 bg-white/60 px-4 py-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <div>
        <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
        <p className="text-xs text-text-main/60">{label}</p>
      </div>
    </div>
  )
}
