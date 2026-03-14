import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAcademicYears, useClassrooms, useUsers } from '../hooks/useAdminData'

export default function DashboardPage() {
  const students = useUsers({ page: 1, limit: 1, role: 'STUDENT' })
  const teachers = useUsers({ page: 1, limit: 1, role: 'TEACHER' })
  const classrooms = useClassrooms({ page: 1, limit: 1 })
  const academicYears = useAcademicYears({ page: 1, limit: 50 })

  const isLoading =
    students.isLoading || teachers.isLoading || classrooms.isLoading || academicYears.isLoading
  const isError = students.isError || teachers.isError || classrooms.isError || academicYears.isError

  if (isLoading) {
    return <LoadingState message="Loading dashboard metrics..." />
  }

  if (isError) {
    return (
      <ErrorState
        message="Unable to load admin dashboard."
        onRetry={() => {
          void students.refetch()
          void teachers.refetch()
          void classrooms.refetch()
          void academicYears.refetch()
        }}
      />
    )
  }

  const studentCount = students.data?.meta.total ?? 0
  const teacherCount = teachers.data?.meta.total ?? 0
  const classroomCount = classrooms.data?.meta.total ?? 0
  const activeYear =
    academicYears.data?.data.find((year) => year.is_active)?.name ?? 'No active year'

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">School Admin Dashboard</h2>
            <p className="text-sm text-text-main/70">Operational overview powered by live APIs.</p>
          </div>
          <Link to="/admin/users">
            <Button>Manage Users</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/60">Students</p>
          <p className="mt-2 text-2xl font-bold text-brand-blue">{studentCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/60">Teachers</p>
          <p className="mt-2 text-2xl font-bold text-brand-blue">{teacherCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/60">Classrooms</p>
          <p className="mt-2 text-2xl font-bold text-brand-blue">{classroomCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-text-main/60">Active Academic Year</p>
          <p className="mt-2 text-base font-semibold text-text-main">{activeYear}</p>
        </Card>
      </div>
    </div>
  )
}
