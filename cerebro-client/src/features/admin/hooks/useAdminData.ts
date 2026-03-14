import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAcademicYear,
  deleteAcademicYear,
  listAcademicYears,
  updateAcademicYear,
  type CreateAcademicYearPayload,
  type ListAcademicYearsParams,
  type UpdateAcademicYearPayload,
} from '../services/academic-years.service'
import {
  createClassroom,
  deleteClassroom,
  listClassrooms,
  updateClassroom,
  type CreateClassroomPayload,
  type ListClassroomsParams,
  type UpdateClassroomPayload,
} from '../services/classrooms.service'
import {
  createCompetencyStandard,
  deleteCompetencyStandard,
  listCompetencyStandards,
  updateCompetencyStandard,
  type CreateCompetencyStandardPayload,
  type ListCompetencyStandardsParams,
  type UpdateCompetencyStandardPayload,
} from '../services/competency-standards.service'
import { listQuestionsForReview, reviewQuestion, type ListQuestionsReviewParams } from '../services/questions-review.service'
import {
  getSchoolProfile,
  updateSchoolProfile,
  type UpdateSchoolProfilePayload,
} from '../services/school-profile.service'
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
  type CreateSubjectPayload,
  type ListSubjectsParams,
  type UpdateSubjectPayload,
} from '../services/subjects.service'
import {
  autoAssignEnrollments,
  createUser,
  deleteUser,
  listAdminClassrooms,
  listUsers,
  updateUser,
  type CreateUserPayload,
  type ListUsersParams,
  type UpdateUserPayload,
} from '../services/users.service'

const QUERY_KEYS = {
  users: 'admin-users',
  schoolProfile: 'admin-school-profile',
  academicYears: 'admin-academic-years',
  classrooms: 'admin-classrooms',
  subjects: 'admin-subjects',
  competencyStandards: 'admin-competency-standards',
  questionReview: 'admin-question-review',
} as const

function invalidate(queryClient: ReturnType<typeof useQueryClient>, key: string) {
  queryClient.invalidateQueries({ queryKey: [key] })
}

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.users, params],
    queryFn: () => listUsers(params),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.users),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => updateUser(id, payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.users),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.users),
  })
}

export function useAdminClassrooms() {
  return useQuery({
    queryKey: [QUERY_KEYS.classrooms, { page: 1, limit: 100 }],
    queryFn: () => listAdminClassrooms(),
  })
}

export function useAutoAssignEnrollments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => autoAssignEnrollments(),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.users),
  })
}

export function useSchoolProfile() {
  return useQuery({
    queryKey: [QUERY_KEYS.schoolProfile],
    queryFn: () => getSchoolProfile(),
  })
}

export function useUpdateSchoolProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateSchoolProfilePayload) => updateSchoolProfile(payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.schoolProfile),
  })
}

export function useAcademicYears(params: ListAcademicYearsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.academicYears, params],
    queryFn: () => listAcademicYears(params),
  })
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAcademicYearPayload) => createAcademicYear(payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.academicYears),
  })
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAcademicYearPayload }) =>
      updateAcademicYear(id, payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.academicYears),
  })
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAcademicYear(id),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.academicYears),
  })
}

export function useClassrooms(params: ListClassroomsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.classrooms, params],
    queryFn: () => listClassrooms(params),
  })
}

export function useCreateClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClassroomPayload) => createClassroom(payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.classrooms),
  })
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClassroomPayload }) =>
      updateClassroom(id, payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.classrooms),
  })
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClassroom(id),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.classrooms),
  })
}

export function useSubjects(params: ListSubjectsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.subjects, params],
    queryFn: () => listSubjects(params),
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSubjectPayload) => createSubject(payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.subjects),
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubjectPayload }) => updateSubject(id, payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.subjects),
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.subjects),
  })
}

export function useCompetencyStandards(params: ListCompetencyStandardsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.competencyStandards, params],
    queryFn: () => listCompetencyStandards(params),
  })
}

export function useCreateCompetencyStandard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCompetencyStandardPayload) => createCompetencyStandard(payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.competencyStandards),
  })
}

export function useUpdateCompetencyStandard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompetencyStandardPayload }) =>
      updateCompetencyStandard(id, payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.competencyStandards),
  })
}

export function useDeleteCompetencyStandard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCompetencyStandard(id),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.competencyStandards),
  })
}

export function useQuestionReviewQueue(params: ListQuestionsReviewParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.questionReview, params],
    queryFn: () => listQuestionsForReview(params),
  })
}

export function useReviewQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      reviewQuestion(id, status),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.questionReview),
  })
}
