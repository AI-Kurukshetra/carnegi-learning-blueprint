import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAttemptById,
  getAttemptResults,
  getAttemptWithAnalytics,
  getMyAttempts,
  getNextQuestion,
  getSemiAdaptiveNextQuestion,
  getStudentAssessmentById,
  listStudentAssessments,
  startAdaptiveAttempt,
  startAttempt,
  startSemiAdaptiveAttempt,
  submitAdaptiveResponse,
  submitAttempt,
  submitResponse,
  submitSemiAdaptiveResponse,
  type ListStudentAssessmentsParams,
  type SubmitResponsePayload,
} from '../services/assessments.service'
import { getStudentProfile } from '../services/profile.service'
import { getMyMilestones, createMilestoneTask } from '../services/progress.service'

const QUERY_KEYS = {
  assessments: 'student-assessments',
  assessmentById: 'student-assessment-by-id',
  myAttempts: 'student-my-attempts',
  attemptById: 'student-attempt-by-id',
  attemptResults: 'student-attempt-results',
  profile: 'student-profile',
  myMilestones: 'student-my-milestones',
} as const

function invalidate(queryClient: ReturnType<typeof useQueryClient>, key: string) {
  queryClient.invalidateQueries({ queryKey: [key] })
}

export function useStudentAssessments(params: ListStudentAssessmentsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.assessments, params],
    queryFn: () => listStudentAssessments(params),
  })
}

export function useStudentAssessmentById(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.assessmentById, id],
    queryFn: () => getStudentAssessmentById(id),
    enabled: Boolean(id),
  })
}

export function useMyAttempts(assessmentId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.myAttempts, assessmentId],
    queryFn: () => getMyAttempts(assessmentId),
    enabled: Boolean(assessmentId),
  })
}

export function useAttemptById(assessmentId: string, attemptId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.attemptById, assessmentId, attemptId],
    queryFn: () => getAttemptById(assessmentId, attemptId),
    enabled: Boolean(assessmentId) && Boolean(attemptId),
  })
}

export function useAttemptResults(assessmentId: string, attemptId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.attemptResults, assessmentId, attemptId],
    queryFn: () => getAttemptResults(assessmentId, attemptId),
    enabled: Boolean(assessmentId) && Boolean(attemptId),
  })
}

export function useStartAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assessmentId: string) => startAttempt(assessmentId),
    onSuccess: (_data, assessmentId) => {
      invalidate(queryClient, QUERY_KEYS.myAttempts)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.assessmentById, assessmentId] })
    },
  })
}

export function useSubmitResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assessmentId,
      attemptId,
      payload,
    }: {
      assessmentId: string
      attemptId: string
      payload: SubmitResponsePayload
    }) => submitResponse(assessmentId, attemptId, payload),
    onSuccess: (_data, { assessmentId, attemptId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.attemptById, assessmentId, attemptId] })
    },
  })
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assessmentId, attemptId }: { assessmentId: string; attemptId: string }) =>
      submitAttempt(assessmentId, attemptId),
    onSuccess: (_data, { assessmentId }) => {
      invalidate(queryClient, QUERY_KEYS.myAttempts)
      invalidate(queryClient, QUERY_KEYS.assessments)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.assessmentById, assessmentId] })
    },
  })
}

export function useStartAdaptiveAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assessmentId: string) => startAdaptiveAttempt(assessmentId),
    onSuccess: (_data, assessmentId) => {
      invalidate(queryClient, QUERY_KEYS.myAttempts)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.assessmentById, assessmentId] })
    },
  })
}

export function useSubmitAdaptiveResponse() {
  return useMutation({
    mutationFn: ({
      assessmentId,
      attemptId,
      payload,
    }: {
      assessmentId: string
      attemptId: string
      payload: SubmitResponsePayload
    }) => submitAdaptiveResponse(assessmentId, attemptId, payload),
  })
}

export function useGetNextQuestion() {
  return useMutation({
    mutationFn: ({ assessmentId, attemptId }: { assessmentId: string; attemptId: string }) =>
      getNextQuestion(assessmentId, attemptId),
  })
}

export function useStartSemiAdaptiveAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assessmentId: string) => startSemiAdaptiveAttempt(assessmentId),
    onSuccess: (_data, assessmentId) => {
      invalidate(queryClient, QUERY_KEYS.myAttempts)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.assessmentById, assessmentId] })
    },
  })
}

export function useSubmitSemiAdaptiveResponse() {
  return useMutation({
    mutationFn: ({
      assessmentId,
      attemptId,
      payload,
    }: {
      assessmentId: string
      attemptId: string
      payload: SubmitResponsePayload
    }) => submitSemiAdaptiveResponse(assessmentId, attemptId, payload),
  })
}

export function useGetSemiAdaptiveNextQuestion() {
  return useMutation({
    mutationFn: ({ assessmentId, attemptId }: { assessmentId: string; attemptId: string }) =>
      getSemiAdaptiveNextQuestion(assessmentId, attemptId),
  })
}

export function useAttemptWithAnalytics(assessmentId: string, attemptId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.attemptResults, 'analytics', assessmentId, attemptId],
    queryFn: () => getAttemptWithAnalytics(assessmentId, attemptId),
    enabled: Boolean(assessmentId) && Boolean(attemptId),
  })
}

export function useStudentProfile() {
  return useQuery({
    queryKey: [QUERY_KEYS.profile],
    queryFn: getStudentProfile,
  })
}

export function useMyMilestones() {
  return useQuery({
    queryKey: [QUERY_KEYS.myMilestones],
    queryFn: getMyMilestones,
  })
}

export function useCreateMilestoneTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ milestoneId, description }: { milestoneId: string; description: string }) =>
      createMilestoneTask(milestoneId, description),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.myMilestones),
  })
}
