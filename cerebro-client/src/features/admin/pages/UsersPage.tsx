import { useDeferredValue, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useToast } from '@/hooks/useToast'
import type { User } from '@/types/domain.types'
import {
  useAdminClassrooms,
  useAutoAssignEnrollments,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '../hooks/useAdminData'
import type { AdminEnrichedClassroom } from '../services/users.service'

// ── Form state types ───────────────────────────────────────

type UserRole = 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT'

interface CreateFormState {
  email: string
  password: string
  role: UserRole
  first_name: string
  last_name: string
  classroom_id: string
}

interface EditFormState {
  email: string
  role: UserRole
  first_name: string
  last_name: string
  classroom_id: string
}

const DEFAULT_CREATE_FORM: CreateFormState = {
  email: '',
  password: '',
  role: 'TEACHER',
  first_name: '',
  last_name: '',
  classroom_id: '',
}

const DEFAULT_EDIT_FORM: EditFormState = {
  email: '',
  role: 'TEACHER',
  first_name: '',
  last_name: '',
  classroom_id: '',
}

// ── Classroom select options ───────────────────────────────

function buildClassroomLabel(classroom: AdminEnrichedClassroom): string {
  const subject = classroom.subject?.name ?? ''
  const section = classroom.section?.name ?? ''
  if (subject && section) return `${classroom.name} — ${subject} (${section})`
  if (section) return `${classroom.name} (${section})`
  if (subject) return `${classroom.name} — ${subject}`
  return classroom.name
}

interface ClassroomSelectFieldProps {
  value: string
  onChange: (classroomId: string) => void
  classrooms: AdminEnrichedClassroom[]
  isLoading: boolean
}

function ClassroomSelectField({ value, onChange, classrooms, isLoading }: ClassroomSelectFieldProps) {
  return (
    <FormField label="Assign to Classroom" hint="Optional — assigns the user to a classroom">
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading}
      >
        <option value="">-- No classroom --</option>
        {classrooms.map((classroom) => (
          <option key={classroom.id} value={classroom.id}>
            {buildClassroomLabel(classroom)}
          </option>
        ))}
      </Select>
    </FormField>
  )
}

// ── Main page ──────────────────────────────────────────────

export default function UsersPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL')
  const [page, setPage] = useState(1)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null)

  const [createForm, setCreateForm] = useState<CreateFormState>(DEFAULT_CREATE_FORM)
  const [editForm, setEditForm] = useState<EditFormState>(DEFAULT_EDIT_FORM)

  const usersQuery = useUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter === 'ALL' ? undefined : roleFilter,
  })
  const classroomsQuery = useAdminClassrooms()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  const autoAssignMutation = useAutoAssignEnrollments()

  const classrooms = classroomsQuery.data?.data ?? []

  function handleOpenCreate() {
    setCreateForm(DEFAULT_CREATE_FORM)
    setIsCreateOpen(true)
  }

  function handleOpenEdit(user: User) {
    setEditingUser(user)
    setEditForm({
      email: user.email,
      role: user.role as UserRole,
      first_name: user.first_name,
      last_name: user.last_name,
      classroom_id: '',
    })
  }

  function handleCreateRoleChange(role: UserRole) {
    setCreateForm((prev) => ({
      ...prev,
      role,
      classroom_id: (role !== 'STUDENT' && role !== 'TEACHER') ? '' : prev.classroom_id,
    }))
  }

  function handleEditRoleChange(role: UserRole) {
    setEditForm((prev) => ({
      ...prev,
      role,
      classroom_id: (role !== 'STUDENT' && role !== 'TEACHER') ? '' : prev.classroom_id,
    }))
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    try {
      const payload = {
        ...createForm,
        classroom_id: createForm.classroom_id || undefined,
      }
      await createUserMutation.mutateAsync(payload)
      toast.success('User created successfully.')
      setIsCreateOpen(false)
      setCreateForm(DEFAULT_CREATE_FORM)
    } catch {
      toast.error('Failed to create user.')
    }
  }

  async function handleEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!editingUser) return
    try {
      const payload = {
        ...editForm,
        classroom_id: editForm.classroom_id || undefined,
      }
      await updateUserMutation.mutateAsync({ id: editingUser.id, payload })
      toast.success('User updated.')
      setEditingUser(null)
    } catch {
      toast.error('Failed to update user.')
    }
  }

  async function handleDelete() {
    if (!deleteUserTarget) return
    try {
      await deleteUserMutation.mutateAsync(deleteUserTarget.id)
      toast.success('User deleted.')
      setDeleteUserTarget(null)
    } catch {
      toast.error('Failed to delete user.')
    }
  }

  async function handleAutoAssign() {
    try {
      const result = await autoAssignMutation.mutateAsync()
      toast.success(`Auto-assigned ${result.enrolled_count} student(s) to classrooms.`)
    } catch {
      toast.error('Failed to auto-assign students.')
    }
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div>
          <p className="font-semibold text-text-main">{user.first_name} {user.last_name}</p>
          <p className="text-xs text-text-main/70">{user.email}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (user) => <Badge tone="default">{user.role}</Badge> },
    {
      key: 'classroom',
      header: 'Classroom',
      render: (user) => {
        const name = (user as User & { classroom_name?: string }).classroom_name
        return name
          ? <span className="text-sm text-text-main">{name}</span>
          : <span className="text-sm text-text-main/40">—</span>
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => handleOpenEdit(user)}>Edit</Button>
          <Button variant="danger" onClick={() => setDeleteUserTarget(user)}>Delete</Button>
        </div>
      ),
    },
  ]

  if (usersQuery.isLoading) {
    return <LoadingState message="Loading users..." />
  }

  if (usersQuery.isError) {
    return <ErrorState message="Failed to load users." onRetry={() => void usersQuery.refetch()} />
  }

  const users = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta

  return (
    <>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Users</h2>
            <p className="text-sm text-text-main/70">Create, edit, and remove teacher/student users.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleAutoAssign}
              disabled={autoAssignMutation.isPending}
            >
              {autoAssignMutation.isPending ? 'Assigning...' : 'Auto-Assign Students'}
            </Button>
            <Button onClick={handleOpenCreate}>Add User</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'STUDENT', 'TEACHER'] as const).map((filter) => (
            <Button
              key={filter}
              variant={roleFilter === filter ? 'primary' : 'ghost'}
              onClick={() => { setRoleFilter(filter); setPage(1) }}
            >
              {filter === 'ALL' ? 'All' : filter === 'STUDENT' ? 'Students' : 'Teachers'}
            </Button>
          ))}
        </div>
        <SearchInput
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value)
            setPage(1)
          }}
          placeholder="Search users by name or email"
        />

        {users.length === 0 ? (
          <EmptyState title="No users found" description="Create teachers or students to begin assignments." />
        ) : (
          <>
            <DataTable columns={columns} rows={users} rowKey={(user) => user.id} />
            <Pagination page={meta?.page ?? 1} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Add User */}
      <SlidePanel open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add User">
        <form className="space-y-4" onSubmit={(e) => void handleCreate(e)}>
          <FormField label="First Name">
            <Input
              value={createForm.first_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, first_name: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              value={createForm.last_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, last_name: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Password">
            <Input
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Role">
            <Select
              value={createForm.role}
              onChange={(event) => handleCreateRoleChange(event.target.value as UserRole)}
            >
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </Select>
          </FormField>
          {(createForm.role === 'STUDENT' || createForm.role === 'TEACHER') && (
            <ClassroomSelectField
              value={createForm.classroom_id}
              onChange={(id) => setCreateForm((prev) => ({ ...prev, classroom_id: id }))}
              classrooms={classrooms}
              isLoading={classroomsQuery.isLoading}
            />
          )}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      {/* Edit User */}
      <SlidePanel open={editingUser !== null} onClose={() => setEditingUser(null)} title="Edit User">
        <form className="space-y-4" onSubmit={(e) => void handleEdit(e)}>
          <FormField label="First Name">
            <Input
              value={editForm.first_name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, first_name: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              value={editForm.last_name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, last_name: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={editForm.email}
              onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="Role">
            <Select
              value={editForm.role}
              onChange={(event) => handleEditRoleChange(event.target.value as UserRole)}
            >
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </Select>
          </FormField>
          {(editForm.role === 'STUDENT' || editForm.role === 'TEACHER') && (
            <ClassroomSelectField
              value={editForm.classroom_id}
              onChange={(id) => setEditForm((prev) => ({ ...prev, classroom_id: id }))}
              classrooms={classrooms}
              isLoading={classroomsQuery.isLoading}
            />
          )}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteUserTarget !== null} onClose={() => setDeleteUserTarget(null)} title="Delete User">
        <ConfirmDialog
          title={`Delete ${deleteUserTarget?.first_name ?? 'user'}?`}
          description={`This will remove access for ${deleteUserTarget?.email ?? 'the selected user'}.`}
          onCancel={() => setDeleteUserTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      </Modal>
    </>
  )
}
