import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, FileText, Target, ArrowRight, PlayCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useStudentAssessments } from '../hooks/useStudentData'
import type { Assessment } from '@/types/domain.types'

const TABS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ALL', label: 'All' },
  { value: 'QUIZ', label: 'Quizzes' },
  { value: 'EXAM', label: 'Exams' },
  { value: 'PRACTICE', label: 'Practice' },
]

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

function formatDueDate(due_at: string | null): string {
  if (!due_at) return 'No due date'
  const date = new Date(due_at)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays} days`
  return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function isDueDateOverdue(due_at: string | null): boolean {
  return formatDueDate(due_at) === 'Overdue'
}

/** Map tab value to API params */
function tabToParams(tab: string): { completion?: 'PENDING' | 'COMPLETED'; type?: string } {
  switch (tab) {
    case 'PENDING':
      return { completion: 'PENDING' }
    case 'QUIZ':
    case 'EXAM':
    case 'PRACTICE':
      return { type: tab }
    default:
      return {}
  }
}

function emptyMessage(tab: string): string {
  switch (tab) {
    case 'PENDING':
      return 'No pending assessments. You\'re all caught up!'
    case 'QUIZ':
      return 'No quiz assessments assigned.'
    case 'EXAM':
      return 'No exam assessments assigned.'
    case 'PRACTICE':
      return 'No practice assessments assigned.'
    default:
      return 'You have no assigned assessments yet.'
  }
}

export default function AssessmentsPage() {
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('PENDING')

  const apiParams = tabToParams(activeTab)
  const query = useStudentAssessments({ page, limit: 12, ...apiParams })

  const assessments = query.data?.data ?? []
  const meta = query.data?.meta

  function handleTabChange(value: string) {
    setActiveTab(value)
    setPage(1)
  }

  if (query.isLoading) return <LoadingState message="Loading assessments..." />
  if (query.isError)
    return (
      <ErrorState
        message="Failed to load assessments."
        onRetry={() => void query.refetch()}
      />
    )

  const isPendingView = activeTab === 'PENDING'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-main">My Assessments</h1>
        <p className="mt-1 text-sm text-slate-600">View and take your assigned assessments</p>
      </div>

      <Tabs items={TABS} value={activeTab} onChange={handleTabChange} />

      {assessments.length === 0 ? (
        <EmptyState
          title="No assessments found"
          description={emptyMessage(activeTab)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              showTakeAction={isPendingView}
            />
          ))}
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <Pagination page={meta.page} totalPages={meta.total_pages} onChange={setPage} />
      )}
    </div>
  )
}

interface AssessmentWithLinkedQuestions extends Assessment {
  assessment_questions?: Array<{ question_id: string }>
}

function AssessmentCard({
  assessment,
  showTakeAction,
}: {
  assessment: AssessmentWithLinkedQuestions
  showTakeAction?: boolean
}) {
  const dueDateLabel = formatDueDate(assessment.due_at)
  const overdue = isDueDateOverdue(assessment.due_at)

  return (
    <Card className="flex flex-col justify-between gap-4 p-5 transition-shadow hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-text-main">
            {assessment.title}
          </h3>
          <div className="flex shrink-0 gap-1.5">
            {assessment.is_adaptive && <Badge tone="warning">Adaptive</Badge>}
            <Badge tone={typeBadgeTone(assessment.type)}>{assessment.type}</Badge>
          </div>
        </div>

        {assessment.description && (
          <p className="line-clamp-2 text-sm text-slate-600">{assessment.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FileText size={13} />
            {assessment.question_count ?? assessment.assessment_questions?.length ?? 0} questions
          </span>
          <span className="flex items-center gap-1">
            <Target size={13} />
            {assessment.total_marks ?? 0} marks
          </span>
          {assessment.time_limit_minutes ? (
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {assessment.time_limit_minutes} min
            </span>
          ) : null}
        </div>

        <p className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
          {dueDateLabel}
        </p>
      </div>

      <Link to={`/student/assessments/${assessment.id}`}>
        {showTakeAction ? (
          <Button type="button" className="w-full gap-2">
            <PlayCircle size={14} />
            Take Assessment
          </Button>
        ) : (
          <Button type="button" variant="secondary" className="w-full gap-2">
            View Assessment
            <ArrowRight size={14} />
          </Button>
        )}
      </Link>
    </Card>
  )
}
