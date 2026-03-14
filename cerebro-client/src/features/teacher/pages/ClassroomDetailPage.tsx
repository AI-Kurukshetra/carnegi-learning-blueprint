import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useTeacherClassroomById } from '../hooks/useTeacherData'
import type { ClassroomDetailStudent } from '../services/curriculum.service'

// ── Skeleton loader ────────────────────────────────────────────

function ClassroomDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-3 h-7 w-64" />
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

// ── Stat item ──────────────────────────────────────────────────

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-brand-blue/15 bg-white/60 px-4 py-3">
      <div className="text-brand-blue">{icon}</div>
      <div>
        <p className="text-lg font-bold text-text-main">{value}</p>
        <p className="text-xs text-text-main/60">{label}</p>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function ClassroomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useTeacherClassroomById(id ?? '')

  if (query.isLoading) return <ClassroomDetailSkeleton />
  if (query.isError || !query.data) {
    return (
      <ErrorState
        message="Failed to load classroom."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const classroom = query.data
  const students = classroom.students ?? []
  const studentCount = students.length
  const assessmentCount = classroom.assessment_count ?? classroom._count?.assessments ?? 0

  const columns: DataTableColumn<ClassroomDetailStudent>[] = [
    {
      key: 'student',
      header: 'Name',
      render: (row) => (
        <button
          type="button"
          className="font-medium text-brand-primary hover:underline"
          onClick={() => navigate(`/teacher/classrooms/${id}/students/${row.id}`)}
        >
          {row.first_name} {row.last_name}
        </button>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="text-text-main/70">{row.email}</span>
      ),
    },
    {
      key: 'enrolled_at',
      header: 'Enrolled Date',
      render: (row) => (
        <span className="text-text-main/70">
          {new Date(row.enrolled_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          variant="ghost"
          className="text-xs"
          onClick={() => navigate(`/teacher/classrooms/${id}/students/${row.id}`)}
        >
          View Progress
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="p-5">
        <Button
          variant="ghost"
          onClick={() => navigate('/teacher/classrooms')}
          className="mb-3 flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft size={15} />
          Back to Classrooms
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-text-main">{classroom.name}</h2>
              <Badge tone={classroom.is_active ? 'success' : 'danger'}>
                {classroom.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {classroom.subject?.code && (
                <Badge tone="default">{classroom.subject.code}</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-text-main/70">
              {classroom.subject?.name ?? '—'} &middot; {classroom.section?.name ?? '—'} &middot; {classroom.academic_year?.name ?? '—'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatItem icon={<Users size={18} />} label="Students" value={studentCount} />
          <StatItem icon={<BookOpen size={18} />} label="Assessments" value={assessmentCount} />
        </div>
      </Card>

      {/* Students table */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-text-main">
          Students
          {studentCount > 0 && (
            <span className="ml-2 text-sm font-normal text-text-main/60">({studentCount})</span>
          )}
        </h3>
        {students.length === 0 ? (
          <EmptyState
            title="No students enrolled"
            description="No students have been enrolled in this classroom yet."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={students}
            rowKey={(row) => row.id}
          />
        )}
      </Card>
    </div>
  )
}
