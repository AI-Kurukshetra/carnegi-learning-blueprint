import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import {
  useCloseTeacherAssessment,
  useDeleteTeacherAssessment,
  usePublishTeacherAssessment,
  useTeacherAssessmentById,
} from '../hooks/useTeacherData'
import type { AssessmentQuestionLink } from '../services/assessments.service'

// ── Badge tone helpers ────────────────────────────────────────

function statusTone(status: string): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'CLOSED') return 'danger'
  return 'default'
}

function difficultyTone(level: string): 'success' | 'warning' | 'danger' | 'default' {
  if (level === 'EASY') return 'success'
  if (level === 'HARD') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'default'
}

// ── Header Info Card ─────────────────────────────────────────

interface AssessmentHeaderProps {
  title: string
  description: string | null
  type: string
  status: string
  classroomId: string
  dueAt: string | null
  timeLimitMinutes: number | null
  totalMarks: number | null
  questionCount: number | null
}

function AssessmentHeader({
  title,
  description,
  type,
  status,
  classroomId,
  dueAt,
  timeLimitMinutes,
  totalMarks,
  questionCount,
}: AssessmentHeaderProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-text-main">{title}</h2>
            <Badge tone={statusTone(status)}>{status}</Badge>
            <Badge tone="default">{type}</Badge>
          </div>
          {description && (
            <p className="mt-1 text-sm text-text-main/70">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 md:grid-cols-3">
        <InfoItem label="Classroom" value={classroomId} />
        <InfoItem label="Due" value={dueAt ? new Date(dueAt).toLocaleString() : 'No due date'} />
        <InfoItem
          label="Time Limit"
          value={timeLimitMinutes ? `${timeLimitMinutes} min` : 'Unlimited'}
        />
        <InfoItem label="Questions in Bank" value={questionCount !== null ? String(questionCount) : '0'} />
        <InfoItem label="Total Marks" value={totalMarks !== null ? String(totalMarks) : '—'} />
      </div>
    </Card>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wide text-text-main/50">{label}</span>
      <p className="font-medium text-text-main">{value}</p>
    </div>
  )
}

// ── Action Bar ────────────────────────────────────────────────

interface ActionBarProps {
  assessmentId: string
  status: string
  onEdit: () => void
  onViewResults: () => void
}

function ActionBar({ assessmentId, status, onEdit, onViewResults }: ActionBarProps) {
  const toast = useToast()
  const publishMutation = usePublishTeacherAssessment()
  const closeMutation = useCloseTeacherAssessment()
  const deleteMutation = useDeleteTeacherAssessment()
  const navigate = useNavigate()

  async function handlePublish() {
    try {
      await publishMutation.mutateAsync(assessmentId)
      toast.success('Assessment published.')
    } catch {
      toast.error('Failed to publish assessment.')
    }
  }

  async function handleClose() {
    try {
      await closeMutation.mutateAsync(assessmentId)
      toast.success('Assessment closed.')
    } catch {
      toast.error('Failed to close assessment.')
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(assessmentId)
      toast.success('Assessment deleted.')
      navigate('/teacher/assessments')
    } catch {
      toast.error('Failed to delete assessment.')
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" onClick={onEdit}>
        Edit
      </Button>
      {status !== 'PUBLISHED' && (
        <Button onClick={() => void handlePublish()} disabled={publishMutation.isPending}>
          {publishMutation.isPending ? 'Publishing...' : 'Publish'}
        </Button>
      )}
      {status !== 'CLOSED' && (
        <Button
          variant="warning"
          onClick={() => void handleClose()}
          disabled={closeMutation.isPending}
        >
          {closeMutation.isPending ? 'Closing...' : 'Close'}
        </Button>
      )}
      <Button variant="ghost" onClick={onViewResults}>
        View Results
      </Button>
      <Button
        variant="danger"
        onClick={() => void handleDelete()}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  )
}

// ── Questions Table ───────────────────────────────────────────

interface QuestionRowData {
  id: string
  order_index: number
  stem: string
  type: string
  difficulty_level: string
  marks: number
}

function AssessmentQuestionsTable({ questionLinks }: { questionLinks: AssessmentQuestionLink[] }) {
  const columns: DataTableColumn<QuestionRowData>[] = [
    {
      key: 'order_index',
      header: '#',
      render: (row) => (
        <span className="font-bold text-brand-blue">{row.order_index + 1}</span>
      ),
    },
    {
      key: 'stem',
      header: 'Question',
      render: (row) => (
        <span className={cn('text-sm text-text-main line-clamp-2')}>{row.stem}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone="default">{row.type}</Badge>,
    },
    {
      key: 'difficulty_level',
      header: 'Difficulty',
      render: (row) => (
        <Badge tone={difficultyTone(row.difficulty_level)}>{row.difficulty_level}</Badge>
      ),
    },
    {
      key: 'marks',
      header: 'Marks',
      render: (row) => <span className="text-sm font-medium">{row.marks}</span>,
    },
  ]

  const rows: QuestionRowData[] = questionLinks.map((link) => ({
    id: link.question_id,
    order_index: link.order_index,
    stem: link.question_id,
    type: '—',
    difficulty_level: '—',
    marks: link.marks,
  }))

  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />
}

// ── Skeleton Loader ───────────────────────────────────────────

function AssessmentDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-40 w-full" />
      </Card>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function AssessmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useTeacherAssessmentById(id ?? '')

  if (query.isLoading) return <AssessmentDetailSkeleton />
  if (query.isError || !query.data) {
    return (
      <ErrorState
        message="Failed to load assessment."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const assessment = query.data
  const questionLinks = assessment.assessment_questions ?? []

  return (
    <div className="space-y-4">
      <AssessmentHeader
        title={assessment.title}
        description={assessment.description}
        type={assessment.type}
        status={assessment.status}
        classroomId={assessment.classroom_id}
        dueAt={assessment.due_at}
        timeLimitMinutes={assessment.time_limit_minutes}
        totalMarks={assessment.total_marks}
        questionCount={questionLinks.length}
      />

      <Card className="p-5">
        <ActionBar
          assessmentId={assessment.id}
          status={assessment.status}
          onEdit={() => navigate(`/teacher/assessments/${assessment.id}/edit`)}
          onViewResults={() => navigate(`/teacher/assessments/${assessment.id}/results`)}
        />
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-text-main">
          Questions
          {questionLinks.length > 0 && (
            <span className="ml-2 text-sm font-normal text-text-main/60">
              ({questionLinks.length})
            </span>
          )}
        </h3>
        {questionLinks.length === 0 ? (
          <p className="text-sm text-text-main/60">No questions added to this assessment yet.</p>
        ) : (
          <AssessmentQuestionsTable questionLinks={questionLinks} />
        )}
      </Card>
    </div>
  )
}
