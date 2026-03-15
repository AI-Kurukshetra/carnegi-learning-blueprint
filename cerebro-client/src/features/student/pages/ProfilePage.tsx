import { User, Mail, Calendar, ShieldCheck, BookOpen, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useStudentProfile } from '../hooks/useStudentData'
import type { StudentClassroom, StudentEnrollment } from '../services/profile.service'

// ── Helpers ────────────────────────────────────────────────

function formatDate(date: string | null): string {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString()
}

function buildInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// ── Skeleton loader ────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </Card>
      <Card className="p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-32 w-full" />
      </Card>
    </div>
  )
}

// ── Info item ──────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-medium text-text-main">{value}</p>
    </div>
  )
}

// ── Classrooms table columns ───────────────────────────────

const classroomColumns: DataTableColumn<StudentClassroom>[] = [
  {
    key: 'subject',
    header: 'Subject',
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-text-main">{row.subject.name}</span>
        <Badge tone="default">{row.subject.code}</Badge>
      </div>
    ),
  },
  {
    key: 'name',
    header: 'Classroom',
    render: (row) => <span className="text-text-main/80">{row.name}</span>,
  },
  {
    key: 'teacher',
    header: 'Teacher',
    render: (row) => (
      <span className="font-medium text-text-main">
        {row.teacher.first_name} {row.teacher.last_name}
      </span>
    ),
  },
  {
    key: 'teacherEmail',
    header: 'Teacher Email',
    render: (row) => <span className="text-text-main/70">{row.teacher.email}</span>,
  },
]

// ── Enrollment card ────────────────────────────────────────

function EnrollmentCard({ enrollment }: { enrollment: StudentEnrollment }) {
  return (
    <div className="rounded-lg border border-brand-blue/15 bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-main">{enrollment.section.name}</p>
          <p className="text-xs text-text-main/70">{enrollment.grade.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={enrollment.academic_year.is_active ? 'success' : 'default'}>
            {enrollment.academic_year.name}
          </Badge>
          {enrollment.academic_year.is_active && (
            <Badge tone="success">Active</Badge>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Enrolled {formatDate(enrollment.enrolled_at)}
      </p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────

export default function ProfilePage() {
  const query = useStudentProfile()

  if (query.isLoading) return <ProfileSkeleton />
  if (query.isError) {
    return (
      <ErrorState
        message="Failed to load your profile."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const profile = query.data!
  const initials = buildInitials(profile.first_name, profile.last_name)
  const activeEnrollments = profile.enrollments.filter((e) => e.is_active)
  const allEnrollments = activeEnrollments.length > 0 ? activeEnrollments : profile.enrollments

  return (
    <div className="space-y-4">

      {/* A. Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-primary text-2xl font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-text-main">
              {profile.first_name} {profile.last_name}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-text-main/70">
              <Mail size={14} />
              <span>{profile.email}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="default">{profile.role}</Badge>
              {profile.is_verified && (
                <Badge tone="success">
                  <ShieldCheck size={11} className="mr-1 inline" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar size={12} />
              Member since {formatDate(profile.created_at)}
            </p>
          </div>
        </div>
      </Card>

      {/* B. Personal Information Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <User size={16} className="text-brand-primary" />
          <h2 className="text-base font-semibold text-text-main">Personal Information</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoItem label="First Name" value={profile.first_name} />
          <InfoItem label="Last Name" value={profile.last_name} />
          <InfoItem label="Email Address" value={profile.email} />
          <InfoItem label="Role" value={profile.role} />
          <InfoItem
            label="Last Login"
            value={profile.last_login_at ? formatDate(profile.last_login_at) : 'Never'}
          />
          <InfoItem label="Account Created" value={formatDate(profile.created_at)} />
        </div>
      </Card>

      {/* C. Enrollment Information Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-brand-primary" />
          <h2 className="text-base font-semibold text-text-main">Current Enrollment</h2>
        </div>
        <div className="mt-4">
          {allEnrollments.length === 0 ? (
            <EmptyState
              title="No enrollments found"
              description="You have not been enrolled in any section yet."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {allEnrollments.map((enrollment) => (
                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* D. Classrooms & Teachers Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-brand-primary" />
          <h2 className="text-base font-semibold text-text-main">My Classrooms & Teachers</h2>
        </div>
        <div className="mt-4">
          {profile.classrooms.length === 0 ? (
            <EmptyState
              title="No classrooms assigned"
              description="You have not been assigned to any classroom yet."
            />
          ) : (
            <DataTable
              columns={classroomColumns}
              rows={profile.classrooms}
              rowKey={(row) => row.id}
            />
          )}
        </div>
      </Card>

    </div>
  )
}
