import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileCheck,
  Loader2,
  PenTool,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAuthStore } from '@/store/auth.store'
import { AiBadge } from '@/components/shared/AiBadge'
import { useTeacherDashboard, useTeacherClassroomsWithAnalytics, useGenerateClassroomAnalytics } from '../hooks/useTeacherData'
import type { RecentAssessment, ClassroomWithAnalytics } from '../services/dashboard.service'

// ── Badge tone helpers ─────────────────────────────────────────

function assessmentStatusTone(status: string): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'CLOSED') return 'danger'
  return 'default'
}

// ── Metric card ────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: number
  icon: React.ReactNode
  accentClass: string
}

function MetricCard({ label, value, icon, accentClass }: MetricCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accentClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-text-main">{value}</p>
        <p className="text-sm text-text-main/60">{label}</p>
      </div>
    </Card>
  )
}

// ── Skeleton loader ────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="mt-3 h-6 w-16" />
            <Skeleton className="mt-1 h-4 w-28" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-48 w-full" />
      </Card>
    </div>
  )
}

// ── Classroom analytics helpers ────────────────────────────────

function getNextGenerationDate(generatedAt: string | null): string {
  if (!generatedAt) return 'Not yet generated'
  const generated = new Date(generatedAt)
  const nextMonth = new Date(generated.getFullYear(), generated.getMonth() + 1, 1)
  return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function canRegenerate(generatedAt: string | null): boolean {
  if (!generatedAt) return true
  const generated = new Date(generatedAt)
  const now = new Date()
  return now.getMonth() !== generated.getMonth() || now.getFullYear() !== generated.getFullYear()
}

function orientationIcon(orientation: string) {
  switch (orientation) {
    case 'recall-oriented':
    case 'comprehension-focused':
      return <BookOpen size={14} className="text-blue-500" />
    case 'analytical':
    case 'evaluative':
      return <Brain size={14} className="text-purple-500" />
    case 'creative':
      return <Sparkles size={14} className="text-amber-500" />
    default:
      return <Target size={14} className="text-slate-500" />
  }
}

// ── ClassroomAnalyticsCard ─────────────────────────────────────

function ClassroomAnalyticsCard({
  classroom,
  onGenerate,
  isGenerating,
  generatingId,
}: {
  classroom: ClassroomWithAnalytics
  onGenerate: (id: string) => void
  isGenerating: boolean
  generatingId: string | null
}) {
  const isThisGenerating = isGenerating && generatingId === classroom.id
  const analytics = classroom.analytics
  const canRegen = canRegenerate(classroom.analytics_generated_at)

  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text-main">{classroom.name}</p>
          <p className="text-xs text-slate-500">
            {classroom.subject?.name ?? 'N/A'} · {classroom.section?.name ?? ''} · {classroom.student_count} students
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{classroom.assessment_count} assessments</span>
        </div>
      </div>

      <div className="p-4">
        {isThisGenerating ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <Loader2 size={18} className="animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500">Generating analytics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-3">
            {/* Summary */}
            <p className="text-xs leading-relaxed text-text-main">{analytics.summary}</p>

            {/* Bloom orientation */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              {orientationIcon(analytics.bloom_profile.class_orientation)}
              <div>
                <p className="text-xs font-semibold text-text-main capitalize">
                  {analytics.bloom_profile.class_orientation.replace(/-/g, ' ')}
                </p>
                <p className="text-[11px] text-slate-500">{analytics.bloom_profile.orientation_description}</p>
              </div>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-center">
                <p className={`text-lg font-bold ${(analytics.performance_insights.average_score_pct ?? 0) >= 70 ? 'text-green-600' : (analytics.performance_insights.average_score_pct ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {analytics.performance_insights.average_score_pct ?? 0}%
                </p>
                <p className="text-[10px] text-slate-500">Avg Score</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-center">
                <p className={`text-lg font-bold ${(analytics.performance_insights.pass_rate_pct ?? 0) >= 70 ? 'text-green-600' : (analytics.performance_insights.pass_rate_pct ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {analytics.performance_insights.pass_rate_pct ?? 0}%
                </p>
                <p className="text-[10px] text-slate-500">Pass Rate</p>
              </div>
            </div>

            {/* Needs attention badge */}
            {analytics.performance_insights.needs_attention && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <TrendingDown size={13} className="text-red-500" />
                <p className="text-xs font-medium text-red-700">This classroom needs attention</p>
              </div>
            )}

            {/* Strengths */}
            {analytics.strengths.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-green-700">Strengths</p>
                <ul className="space-y-0.5">
                  {analytics.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <TrendingUp size={10} className="mt-0.5 shrink-0 text-green-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analytics.recommendations.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">Recommendations</p>
                <ul className="space-y-0.5">
                  {analytics.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <ChevronRight size={10} className="mt-0.5 shrink-0 text-indigo-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generation info */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <div className="text-[10px] text-slate-400">
                {classroom.analytics_generated_at && (
                  <span>Generated {new Date(classroom.analytics_generated_at).toLocaleDateString()}</span>
                )}
                <span className="mx-1">·</span>
                <span className="flex items-center gap-1 inline-flex">
                  <Calendar size={9} />
                  Next: {getNextGenerationDate(classroom.analytics_generated_at)}
                </span>
              </div>
              {canRegen && (
                <button
                  type="button"
                  onClick={() => onGenerate(classroom.id)}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  <RefreshCw size={10} />
                  Regenerate
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <BarChart3 size={24} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No analytics generated yet</p>
            <button
              type="button"
              onClick={() => onGenerate(classroom.id)}
              disabled={isGenerating}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              <Sparkles size={12} />
              Generate Analytics
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const query = useTeacherDashboard()
  const classroomsQuery = useTeacherClassroomsWithAnalytics()
  const generateMutation = useGenerateClassroomAnalytics()

  if (query.isLoading) return <DashboardSkeleton />
  if (query.isError) {
    return (
      <ErrorState
        message="Failed to load dashboard."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const data = query.data

  const metrics: MetricCardProps[] = [
    {
      label: 'Total Students',
      value: data?.total_students ?? 0,
      icon: <Users size={22} className="text-blue-600" />,
      accentClass: 'bg-blue-100/80',
    },
    {
      label: 'Published Assessments',
      value: data?.published_assessments ?? 0,
      icon: <FileCheck size={22} className="text-green-600" />,
      accentClass: 'bg-green-100/80',
    },
    {
      label: 'Total Assessments',
      value: data?.total_assessments ?? 0,
      icon: <ClipboardList size={22} className="text-purple-600" />,
      accentClass: 'bg-purple-100/80',
    },
    {
      label: 'Student Attempts',
      value: data?.total_attempts ?? 0,
      icon: <PenTool size={22} className="text-amber-600" />,
      accentClass: 'bg-amber-100/80',
    },
  ]

  const recentAssessments = data?.recent_assessments ?? []

  const columns: DataTableColumn<RecentAssessment>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <button
          type="button"
          className="font-semibold text-brand-blue hover:underline text-left"
          onClick={() => navigate(`/teacher/assessments/${row.id}`)}
        >
          {row.title}
        </button>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone="default">{row.type}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={assessmentStatusTone(row.status)}>{row.status}</Badge>
      ),
    },
    {
      key: 'total_marks',
      header: 'Total Marks',
      render: (row) => (
        <span className="text-text-main/80">{row.total_marks ?? '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => (
        <span className="text-text-main/70">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Welcome header */}
      <Card className="p-5">
        <h2 className="text-xl font-semibold text-text-main">
          Welcome back, {user?.first_name ?? 'Teacher'}!
        </h2>
        <p className="text-sm text-text-main/70">
          Here is a summary of your teaching activity.
        </p>
      </Card>

      {/* Metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Recent assessments */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-text-main">Recent Assessments</h3>
        {recentAssessments.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="Create your first assessment to get started."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={recentAssessments}
            rowKey={(row) => row.id}
          />
        )}
        <div className="mt-3 text-right">
          <Link
            to="/teacher/assessments"
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            View all assessments
          </Link>
        </div>
      </Card>

      {/* Classroom Analytics */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-primary" />
            <h3 className="font-semibold text-text-main">Classroom Analytics</h3>
            <AiBadge />
          </div>
        </div>

        {classroomsQuery.isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : classroomsQuery.isError ? (
          <p className="mt-4 text-sm text-slate-500">Failed to load classroom analytics.</p>
        ) : (classroomsQuery.data ?? []).length === 0 ? (
          <EmptyState title="No classrooms" description="You don't have any active classrooms yet." />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(classroomsQuery.data ?? []).map((classroom) => (
              <ClassroomAnalyticsCard
                key={classroom.id}
                classroom={classroom}
                onGenerate={(id) => {
                  generateMutation.mutate(id)
                }}
                isGenerating={generateMutation.isPending}
                generatingId={generateMutation.variables ?? null}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
