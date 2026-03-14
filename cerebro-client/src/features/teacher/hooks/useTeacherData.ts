import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addQuestionToAssessment,
  closeAssessment,
  createAssessment,
  deleteAssessment,
  getAssessmentById,
  getAttemptDetail,
  listAssessmentAttempts,
  listAssessments,
  publishAssessment,
  removeQuestionFromAssessment,
  reorderAssessmentQuestions,
  updateAssessment,
  type AddAssessmentQuestionPayload,
  type CreateAssessmentPayload,
  type ListAssessmentsParams,
  type ReorderAssessmentQuestionsPayload,
  type UpdateAssessmentPayload,
} from '../services/assessments.service'
import {
  createLearningObjective,
  createTopic,
  deleteLearningObjective,
  deleteTopic,
  getClassroomById,
  listCurriculumSubjects,
  listLearningObjectives,
  listTeacherClassrooms,
  listTopics,
} from '../services/curriculum.service'
import { getTeacherDashboard } from '../services/dashboard.service'
import {
  getStudentProgress,
  getStudentInsight,
  generateStudentInsight,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reviewMilestoneTask,
  type CreateMilestonePayload,
  type UpdateMilestonePayload,
  type ReviewMilestoneTaskPayload,
} from '../services/student-progress.service'
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  listQuestions,
  updateQuestion,
  type CreateQuestionPayload,
  type ListQuestionsParams,
  type UpdateQuestionPayload,
} from '../services/questions.service'
import {
  approveGeneratedQuestions,
  generateQuestions,
  getGenerationJobStatus,
  type ApprovedQuestion,
  type GenerateQuestionsRequest,
} from '../services/ai-generation.service'

const QUERY_KEYS = {
  questions: 'teacher-questions',
  questionById: 'teacher-question-by-id',
  assessments: 'teacher-assessments',
  assessmentById: 'teacher-assessment-by-id',
  assessmentAttempts: 'teacher-assessment-attempts',
  attemptDetail: 'teacher-attempt-detail',
  curriculumSubjects: 'teacher-curriculum-subjects',
  curriculumTopics: 'teacher-curriculum-topics',
  curriculumLos: 'teacher-curriculum-los',
  classroomById: 'teacher-classroom-by-id',
  dashboard: 'teacher-dashboard',
  studentProgress: 'teacher-student-progress',
  studentInsight: 'teacher-student-insight',
} as const

function invalidate(queryClient: ReturnType<typeof useQueryClient>, key: string) {
  queryClient.invalidateQueries({ queryKey: [key] })
}

export function useTeacherQuestions(params: ListQuestionsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.questions, params],
    queryFn: () => listQuestions(params),
  })
}

export function useTeacherQuestionById(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.questionById, id],
    queryFn: () => getQuestionById(id),
    enabled: Boolean(id),
  })
}

export function useCreateTeacherQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) => createQuestion(payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.questions)
      invalidate(queryClient, QUERY_KEYS.questionById)
    },
  })
}

export function useUpdateTeacherQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateQuestionPayload }) =>
      updateQuestion(id, payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.questions)
      invalidate(queryClient, QUERY_KEYS.questionById)
    },
  })
}

export function useDeleteTeacherQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.questions)
      invalidate(queryClient, QUERY_KEYS.questionById)
    },
  })
}

export function useTeacherAssessments(params: ListAssessmentsParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.assessments, params],
    queryFn: () => listAssessments(params),
  })
}

export function useTeacherAssessmentById(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.assessmentById, id],
    queryFn: () => getAssessmentById(id),
    enabled: Boolean(id),
  })
}

export function useCreateTeacherAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAssessmentPayload) => createAssessment(payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function useUpdateTeacherAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssessmentPayload }) =>
      updateAssessment(id, payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function useDeleteTeacherAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAssessment(id),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function usePublishTeacherAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishAssessment(id),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function useCloseTeacherAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => closeAssessment(id),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function useAddQuestionToTeacherAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddAssessmentQuestionPayload }) =>
      addQuestionToAssessment(id, payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function useRemoveQuestionFromTeacherAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, questionId }: { id: string; questionId: string }) =>
      removeQuestionFromAssessment(id, questionId),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function useReorderTeacherAssessmentQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReorderAssessmentQuestionsPayload }) =>
      reorderAssessmentQuestions(id, payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.assessments)
      invalidate(queryClient, QUERY_KEYS.assessmentById)
    },
  })
}

export function useCurriculumSubjects() {
  return useQuery({
    queryKey: [QUERY_KEYS.curriculumSubjects],
    queryFn: () => listCurriculumSubjects(),
  })
}

export function useCurriculumTopics(subjectId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.curriculumTopics, subjectId],
    queryFn: () => listTopics(subjectId),
    enabled: Boolean(subjectId),
  })
}

export function useCurriculumLearningObjectives(topicId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.curriculumLos, topicId],
    queryFn: () => listLearningObjectives(topicId),
    enabled: Boolean(topicId),
  })
}

export function useCreateCurriculumTopic(subjectId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      subjectId: overrideSubjectId,
      payload,
    }: {
      subjectId?: string
      payload: { name: string; description?: string; order_index: number }
    }) => createTopic(overrideSubjectId ?? subjectId ?? '', payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.curriculumTopics)
      invalidate(queryClient, QUERY_KEYS.curriculumSubjects)
    },
  })
}

export function useDeleteCurriculumTopic(subjectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicId: string) => deleteTopic(subjectId, topicId),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.curriculumTopics),
  })
}

export function useCreateCurriculumLearningObjective(topicId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      topicId: overrideTopicId,
      payload,
    }: {
      topicId?: string
      payload: {
        title: string
        description?: string
        bloom_level: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'
        order_index: number
      }
    }) => createLearningObjective(overrideTopicId ?? topicId ?? '', payload),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.curriculumLos),
  })
}

export function useDeleteCurriculumLearningObjective(topicId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (learningObjectiveId: string) => deleteLearningObjective(topicId, learningObjectiveId),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.curriculumLos),
  })
}

export function useTeacherClassrooms() {
  return useQuery({
    queryKey: ['teacher-classrooms'],
    queryFn: () => listTeacherClassrooms(),
  })
}

export function useTeacherClassroomById(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.classroomById, id],
    queryFn: () => getClassroomById(id),
    enabled: Boolean(id),
  })
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard],
    queryFn: () => getTeacherDashboard(),
  })
}

export function useGenerateQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GenerateQuestionsRequest) => generateQuestions(data),
    onSuccess: () => invalidate(queryClient, QUERY_KEYS.questions),
  })
}

export function useGenerationJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['ai-generation-job', jobId],
    queryFn: () => getGenerationJobStatus(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'COMPLETED' || status === 'FAILED') return false
      return 3000
    },
  })
}

export function useApproveGeneratedQuestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, questions }: { jobId: string; questions: ApprovedQuestion[] }) =>
      approveGeneratedQuestions(jobId, questions),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.questions)
      invalidate(queryClient, QUERY_KEYS.questionById)
    },
  })
}

// ── Attempt Review ─────────────────────────────────────────

export function useAssessmentAttempts(assessmentId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.assessmentAttempts, assessmentId],
    queryFn: () => listAssessmentAttempts(assessmentId),
    enabled: Boolean(assessmentId),
  })
}

export function useAttemptDetail(assessmentId: string, attemptId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.attemptDetail, assessmentId, attemptId],
    queryFn: () => getAttemptDetail(assessmentId, attemptId),
    enabled: Boolean(assessmentId) && Boolean(attemptId),
  })
}

// ── Student Progress ────────────────────────────────────────

export function useStudentProgress(classroomId: string, studentId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.studentProgress, classroomId, studentId],
    queryFn: () => getStudentProgress(classroomId, studentId),
    enabled: Boolean(classroomId) && Boolean(studentId),
  })
}

export function useStudentInsight(classroomId: string, studentId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.studentInsight, classroomId, studentId],
    queryFn: () => getStudentInsight(classroomId, studentId),
    enabled: Boolean(classroomId) && Boolean(studentId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useGenerateStudentInsight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      classroomId,
      studentId,
    }: {
      classroomId: string
      studentId: string
    }) => generateStudentInsight(classroomId, studentId),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.studentInsight)
    },
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      classroomId,
      studentId,
      payload,
    }: {
      classroomId: string
      studentId: string
      payload: CreateMilestonePayload
    }) => createMilestone(classroomId, studentId, payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.studentProgress)
    },
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      milestoneId,
      payload,
    }: {
      milestoneId: string
      payload: UpdateMilestonePayload
    }) => updateMilestone(milestoneId, payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.studentProgress)
    },
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (milestoneId: string) => deleteMilestone(milestoneId),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.studentProgress)
    },
  })
}

export function useReviewMilestoneTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: ReviewMilestoneTaskPayload }) =>
      reviewMilestoneTask(taskId, payload),
    onSuccess: () => {
      invalidate(queryClient, QUERY_KEYS.studentProgress)
      invalidate(queryClient, QUERY_KEYS.studentInsight)
    },
  })
}
