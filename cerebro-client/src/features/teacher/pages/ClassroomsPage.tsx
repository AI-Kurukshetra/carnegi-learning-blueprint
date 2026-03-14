import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useTeacherClassrooms } from '../hooks/useTeacherData'
import type { EnrichedClassroom } from '../services/curriculum.service'

// ── Skeleton loader ────────────────────────────────────────────

function ClassroomsPageSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Classroom card ─────────────────────────────────────────────

interface ClassroomCardProps {
  classroom: EnrichedClassroom
  onClick: () => void
}

function ClassroomCard({ classroom, onClick }: ClassroomCardProps) {
  const studentCount = classroom.section?._count?.student_enrollments ?? 0

  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={onClick}
    >
      <Card className="h-full p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text-main leading-snug">{classroom.name}</h3>
          <Badge tone={classroom.is_active ? 'success' : 'danger'}>
            {classroom.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-main/80">{classroom.subject?.name ?? '—'}</span>
          {classroom.subject?.code && (
            <Badge tone="default">{classroom.subject.code}</Badge>
          )}
        </div>

        <div className="mt-3 space-y-1 text-xs text-text-main/60">
          <p>
            <span className="font-medium text-text-main/80">Section:</span>{' '}
            {classroom.section?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium text-text-main/80">Academic Year:</span>{' '}
            {classroom.academic_year?.name ?? '—'}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-text-main/70">
          <Users size={13} />
          <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
        </div>
      </Card>
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function ClassroomsPage() {
  const navigate = useNavigate()
  const query = useTeacherClassrooms()

  if (query.isLoading) return <ClassroomsPageSkeleton />
  if (query.isError) {
    return (
      <ErrorState
        message="Failed to load classrooms."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const classrooms = query.data ?? []

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-xl font-semibold text-text-main">My Classrooms</h2>
        <p className="text-sm text-text-main/70">
          Browse and manage your assigned classrooms.
        </p>
      </Card>

      {classrooms.length === 0 ? (
        <EmptyState
          title="No classrooms found"
          description="You have not been assigned to any classrooms yet."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
