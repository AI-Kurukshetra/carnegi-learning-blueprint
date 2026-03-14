import { Link } from 'react-router-dom'
import { Award, Clock, GraduationCap, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { useStudentProfile } from '../hooks/useStudentData'

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-500'
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function formatScore(score: number | null): string {
  if (score === null) return 'N/A'
  return `${Math.round(score)}%`
}

function StatMetric({
  icon,
  label,
  value,
  valueClass = 'text-text-main',
  accentClass,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
  accentClass: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-brand-blue/15 bg-white/60 px-4 py-5 text-center">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-text-main/60">{label}</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Card className="p-6">
        <Skeleton className="h-5 w-48" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const query = useStudentProfile()

  if (query.isLoading) return <DashboardSkeleton />
  if (query.isError) {
    return (
      <ErrorState
        message="Failed to load dashboard."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const profile = query.data!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">
          Welcome back, {profile.first_name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Here&apos;s an overview of your assessment performance.
        </p>
      </div>

      {/* Assessment Performance */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-brand-primary" />
            <h2 className="text-base font-semibold text-text-main">Assessment Performance</h2>
          </div>
          <Link to="/student/assessments">
            <Button type="button" variant="ghost" className="gap-1.5 text-xs">
              View Assessments
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatMetric
            icon={<Clock size={20} className="text-blue-600" />}
            label="Total Attempts"
            value={String(profile.stats.total_attempts)}
            accentClass="bg-blue-100/80"
          />
          <StatMetric
            icon={<Award size={20} className="text-green-600" />}
            label="Completed"
            value={String(profile.stats.completed_attempts)}
            accentClass="bg-green-100/80"
          />
          <StatMetric
            icon={<GraduationCap size={20} className="text-purple-600" />}
            label="Average Score"
            value={formatScore(profile.stats.average_score_percentage)}
            valueClass={scoreColor(profile.stats.average_score_percentage)}
            accentClass="bg-purple-100/80"
          />
        </div>
      </Card>
    </div>
  )
}
