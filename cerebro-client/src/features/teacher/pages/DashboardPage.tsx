import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, FileCheck, PenTool, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAuthStore } from '@/store/auth.store'
import { useTeacherDashboard } from '../hooks/useTeacherData'
import type { RecentAssessment } from '../services/dashboard.service'

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

// ── Main page ──────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const query = useTeacherDashboard()

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
    </div>
  )
}
