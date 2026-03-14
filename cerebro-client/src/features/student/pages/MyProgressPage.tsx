import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  ClipboardList,
  Loader2,
  MessageSquare,
  Plus,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Skeleton } from '@/components/ui/Skeleton'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useToast } from '@/hooks/useToast'
import { useMyMilestones, useCreateMilestoneTask } from '../hooks/useStudentData'
import type { StudentMilestone, MilestoneTask } from '../services/progress.service'

function statusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 size={18} className="text-green-600" />
    case 'IN_PROGRESS':
      return <Loader2 size={18} className="text-amber-500" />
    default:
      return <Circle size={18} className="text-slate-400" />
  }
}

function statusTone(status: string): 'default' | 'success' | 'warning' {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'IN_PROGRESS':
      return 'warning'
    default:
      return 'default'
  }
}

function completionColor(pct: number): string {
  if (pct >= 80) return 'text-green-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function ProgressSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  )
}

function TaskItem({ task }: { task: MilestoneTask }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-text-main">{task.description}</p>
        {task.completion_pct !== null && (
          <span className={`shrink-0 text-xs font-bold ${completionColor(task.completion_pct)}`}>
            {task.completion_pct}%
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span>{new Date(task.created_at).toLocaleDateString()}</span>
        {task.reviewed_at && task.reviewed_by && (
          <span className="text-brand-primary">
            Reviewed by {task.reviewed_by.first_name} {task.reviewed_by.last_name}
          </span>
        )}
      </div>
      {task.teacher_comment && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded border border-blue-100 bg-blue-50/50 px-2 py-1.5">
          <MessageSquare size={11} className="mt-0.5 shrink-0 text-blue-500" />
          <p className="text-xs leading-relaxed text-blue-800">{task.teacher_comment}</p>
        </div>
      )}
    </div>
  )
}

function MilestoneCard({
  milestone,
  onAddTask,
}: {
  milestone: StudentMilestone
  onAddTask: (milestoneId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const tasks = milestone.tasks ?? []
  const isOverdue =
    milestone.due_date &&
    milestone.status !== 'COMPLETED' &&
    new Date(milestone.due_date) < new Date()

  return (
    <div className="rounded-lg border border-slate-200 bg-white/50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{statusIcon(milestone.status)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-sm font-semibold ${
                milestone.status === 'COMPLETED'
                  ? 'text-slate-400 line-through'
                  : 'text-text-main'
              }`}
            >
              {milestone.title}
            </p>
            <Badge tone={statusTone(milestone.status)}>
              {milestone.status.replace('_', ' ')}
            </Badge>
          </div>

          {milestone.description && (
            <p className="mt-1 text-sm text-slate-600">{milestone.description}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              {milestone.classroom.subject.name} — {milestone.classroom.name}
            </span>
            <span>
              Set by {milestone.created_by.first_name} {milestone.created_by.last_name}
            </span>
            {milestone.due_date && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : ''}`}>
                <Clock size={11} />
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {new Date(milestone.due_date).toLocaleDateString()}
              </span>
            )}
            {milestone.completed_at && (
              <span className="text-green-600">
                Completed {new Date(milestone.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Tasks section */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => onAddTask(milestone.id)}
            >
              <Plus size={12} />
              Add Progress
            </Button>
            {tasks.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
                onClick={() => setExpanded((prev) => !prev)}
              >
                <ClipboardList size={12} />
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
              </button>
            )}
          </div>

          {/* Expanded tasks */}
          {expanded && tasks.length > 0 && (
            <div className="mt-2 space-y-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MyProgressPage() {
  const toast = useToast()
  const query = useMyMilestones()
  const createTaskMutation = useCreateMilestoneTask()

  const [taskPanelMilestoneId, setTaskPanelMilestoneId] = useState<string | null>(null)
  const [taskDescription, setTaskDescription] = useState('')

  if (query.isLoading) return <ProgressSkeleton />
  if (query.isError) {
    return (
      <ErrorState
        message="Failed to load your progress."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const milestones = query.data ?? []
  const completed = milestones.filter((m) => m.status === 'COMPLETED').length
  const total = milestones.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const panelMilestone = milestones.find((m) => m.id === taskPanelMilestoneId) ?? null

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskPanelMilestoneId) return
    try {
      await createTaskMutation.mutateAsync({
        milestoneId: taskPanelMilestoneId,
        description: taskDescription,
      })
      toast.success('Progress added.')
      setTaskPanelMilestoneId(null)
      setTaskDescription('')
    } catch {
      toast.error('Failed to add progress.')
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">My Progress</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your learning milestones set by your teachers.
          </p>
        </div>

        {/* Summary */}
        {total > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-main">
                {completed} of {total} milestones completed
              </p>
              <span className="text-sm font-semibold text-brand-primary">{pct}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </Card>
        )}

        {/* Milestones list */}
        <Card className="p-5">
          {milestones.length === 0 ? (
            <EmptyState
              title="No milestones yet"
              description="Your teachers haven't set any milestones for you yet. Check back later!"
            />
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <MilestoneCard
                  key={m.id}
                  milestone={m}
                  onAddTask={(id) => {
                    setTaskPanelMilestoneId(id)
                    setTaskDescription('')
                  }}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Progress Panel */}
      <SlidePanel
        open={taskPanelMilestoneId !== null}
        onClose={() => setTaskPanelMilestoneId(null)}
        title="Add Progress"
      >
        {panelMilestone && (
          <div className="mb-4 rounded-lg border border-brand-blue/15 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Milestone</p>
            <p className="mt-0.5 text-sm font-semibold text-text-main">{panelMilestone.title}</p>
          </div>
        )}
        <form className="space-y-4" onSubmit={(e) => void handleCreateTask(e)}>
          <FormField label="Task Performed">
            <Textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe what you worked on or accomplished..."
              rows={4}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={() => setTaskPanelMilestoneId(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending || !taskDescription.trim()}>
              {createTaskMutation.isPending ? 'Adding...' : 'Add Progress'}
            </Button>
          </div>
        </form>
      </SlidePanel>
    </>
  )
}
