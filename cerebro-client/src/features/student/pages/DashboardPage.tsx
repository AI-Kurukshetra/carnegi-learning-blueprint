import { Link } from 'react-router-dom'
import {
  Award,
  Clock,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Brain,
  BookOpen,
} from 'lucide-react'
import { AiBadge } from '@/components/shared/AiBadge'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { useStudentProfile, useMyAnalytics } from '../hooks/useStudentData'
import type { BloomStats, SubjectQuadrant } from '../services/progress.service'

// ── Helpers ──────────────────────────────────────────────────

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

const BLOOM_LABELS: Record<string, { label: string; skill: string; color: string }> = {
  REMEMBER: { label: 'Remember', skill: 'Recall', color: 'bg-blue-500' },
  UNDERSTAND: { label: 'Understand', skill: 'Comprehension', color: 'bg-cyan-500' },
  APPLY: { label: 'Apply', skill: 'Practical', color: 'bg-green-500' },
  ANALYZE: { label: 'Analyze', skill: 'Analytical', color: 'bg-amber-500' },
  EVALUATE: { label: 'Evaluate', skill: 'Decision Making', color: 'bg-orange-500' },
  CREATE: { label: 'Create', skill: 'Creative', color: 'bg-purple-500' },
}

// ── Stat Metric ──────────────────────────────────────────────

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

// ── Bloom Bar Chart ──────────────────────────────────────────

function BloomTaxonomyChart({ bloom }: { bloom: Record<string, BloomStats> }) {
  const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']

  return (
    <div className="space-y-2.5">
      {levels.map((level) => {
        const stats = bloom[level]
        if (!stats) return null
        const meta = BLOOM_LABELS[level]
        return (
          <div key={level}>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-main">{meta.label}</span>
                <span className="text-[10px] text-slate-400">({meta.skill})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">
                  {stats.correct}/{stats.total}
                </span>
                <span className="text-xs font-bold text-text-main">{stats.percentage}%</span>
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${meta.color} transition-all duration-500`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Subject Quadrant Card ────────────────────────────────────

function SubjectQuadrantCard({ quadrant }: { quadrant: SubjectQuadrant }) {
  const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']

  return (
    <div className="rounded-xl border border-brand-blue/15 bg-white/60 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-main">{quadrant.subject_name}</h4>
        <span
          className={`text-sm font-bold ${
            quadrant.score_percentage >= 70
              ? 'text-green-600'
              : quadrant.score_percentage >= 50
                ? 'text-amber-600'
                : 'text-red-600'
          }`}
        >
          {quadrant.score_percentage}%
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {quadrant.correct_answers}/{quadrant.total_questions} questions correct
      </p>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {levels.map((level) => {
          const stats = quadrant.bloom_breakdown[level]
          if (!stats || stats.total === 0) return null
          const meta = BLOOM_LABELS[level]
          return (
            <div
              key={level}
              className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-center"
            >
              <p className="text-[10px] text-slate-500">{meta.label}</p>
              <p
                className={`text-xs font-bold ${
                  stats.percentage >= 70
                    ? 'text-green-600'
                    : stats.percentage >= 50
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                {stats.percentage}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Dashboard Skeleton ───────────────────────────────────────

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

// ── Main Page ────────────────────────────────────────────────

export default function DashboardPage() {
  const query = useStudentProfile()
  const analyticsQuery = useMyAnalytics()

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
  const analytics = analyticsQuery.data?.analytics ?? null
  const generatedAt = analyticsQuery.data?.generated_at ?? null

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

      {/* Analytics & Focus Areas */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-blue/10 bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-indigo-900">Analytics & Focus Areas</h2>
            <AiBadge />
          </div>
          {generatedAt && (
            <span className="text-[11px] text-slate-400">
              Updated {new Date(generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {analyticsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        ) : !analytics ? (
          <div className="px-5 py-8 text-center">
            <Brain size={32} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              No analytics generated yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Your teacher will generate your personalized analytics report.
            </p>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* AI Summary */}
            <div>
              <p className="text-sm leading-relaxed text-text-main">{analytics.summary}</p>
            </div>

            {/* Overall Stats Row */}
            <div className="grid gap-3 sm:grid-cols-4">
              <MiniStat
                label="Questions Answered"
                value={String(analytics.overall_stats.total_questions_answered)}
                icon={<BookOpen size={14} className="text-blue-600" />}
              />
              <MiniStat
                label="Overall Accuracy"
                value={`${analytics.overall_stats.overall_accuracy}%`}
                icon={<Target size={14} className="text-green-600" />}
              />
              <MiniStat
                label="Assessments Taken"
                value={String(analytics.overall_stats.total_assessments)}
                icon={<GraduationCap size={14} className="text-purple-600" />}
              />
              <MiniStat
                label="Milestone Progress"
                value={`${analytics.overall_stats.milestone_completion_pct}%`}
                icon={<Award size={14} className="text-amber-600" />}
              />
            </div>

            {/* Two-column: Bloom Chart + Strengths/Growth */}
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              {/* Bloom Taxonomy Chart */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Brain size={14} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-text-main">
                    Bloom&apos;s Taxonomy Breakdown
                  </h3>
                </div>
                <BloomTaxonomyChart bloom={analytics.bloom_taxonomy} />
              </div>

              {/* Strengths & Growth */}
              <div className="space-y-4">
                {analytics.strengths_narrative && (
                  <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-green-600" />
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700">
                        Strengths
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed text-green-800">
                      {analytics.strengths_narrative}
                    </p>
                  </div>
                )}

                {analytics.growth_narrative && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Target size={13} className="text-amber-600" />
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Room for Growth
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed text-amber-800">
                      {analytics.growth_narrative}
                    </p>
                  </div>
                )}

                {analytics.focus_areas.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Focus Areas
                    </h4>
                    <ul className="space-y-1">
                      {analytics.focus_areas.map((area, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-600"
                        >
                          <Target
                            size={11}
                            className="mt-0.5 shrink-0 text-indigo-500"
                          />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Subject Quadrants */}
            {analytics.subject_quadrants.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen size={14} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-text-main">
                    Subject Performance
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {analytics.subject_quadrants.map((sq) => (
                    <SubjectQuadrantCard key={sq.subject_id} quadrant={sq} />
                  ))}
                </div>
              </div>
            )}

            {/* Study Recommendations */}
            {analytics.study_recommendations.length > 0 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-600" />
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Study Recommendations
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {analytics.study_recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs leading-relaxed text-indigo-800"
                    >
                      <Badge tone="default" className="mt-0.5 shrink-0 text-[9px]">
                        {i + 1}
                      </Badge>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Mini Stat ────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-brand-blue/10 bg-white/60 px-3 py-2.5">
      {icon}
      <div>
        <p className="text-sm font-bold text-text-main">{value}</p>
        <p className="text-[10px] text-slate-400">{label}</p>
      </div>
    </div>
  )
}
