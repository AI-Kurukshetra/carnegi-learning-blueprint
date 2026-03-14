import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentMode, AttemptStatus, Prisma } from '@prisma/client';
import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdaptiveEngineService,
  AdaptiveState,
} from './adaptive-engine.service';
import {
  SemiAdaptiveEngineService,
  SemiAdaptivePlan,
} from './semi-adaptive-engine.service';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Injectable()
export class AssessmentAttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adaptiveEngine: AdaptiveEngineService,
    private readonly semiAdaptiveEngine: SemiAdaptiveEngineService,
  ) {}

  async startAttempt(
    tenantId: string,
    assessmentId: string,
    user: RequestUser,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can start attempts');
    }

    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, tenant_id: tenantId, deleted_at: null },
    });
    if (!assessment) {
      throw new NotFoundException(
        `Assessment with id "${assessmentId}" not found`,
      );
    }

    const existing = await this.prisma.assessmentAttempt.findFirst({
      where: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        student_id: user.id,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    const mode = assessment.mode as AssessmentMode;

    if (mode === AssessmentMode.ADAPTIVE) {
      return this.handleAdaptiveStart(tenantId, assessmentId, assessment, existing, user);
    }

    if (mode === AssessmentMode.SEMI_ADAPTIVE) {
      return this.handleSemiAdaptiveStart(tenantId, assessment, existing, user);
    }

    // FIXED mode
    if (existing) {
      return existing;
    }

    // If question_count is set, randomly select a subset of questions for this student
    const { selectedIds, totalMarks } = await this.resolveSelectedQuestions(
      tenantId,
      assessmentId,
      assessment.question_count,
      assessment.total_marks,
    );

    return this.prisma.assessmentAttempt.create({
      data: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        student_id: user.id,
        total_marks: totalMarks,
        ...(selectedIds
          ? { selected_question_ids: selectedIds as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  private async handleAdaptiveStart(
    tenantId: string,
    assessmentId: string,
    assessment: { id: string; total_marks: number | null; adaptive_config: unknown; classroom_id: string | null },
    existing: { id: string; adaptive_state: unknown } | null,
    user: RequestUser,
  ) {
    const config = this.adaptiveEngine.resolveConfig(assessment.adaptive_config);

    if (existing) {
      const state = (existing.adaptive_state as unknown) as AdaptiveState;
      return {
        attempt: existing,
        current_question: null,
        progress: {
          questions_answered: state?.questions_served?.length ?? 0,
          current_difficulty: state?.current_difficulty ?? 'EASY',
          max_questions: config.max_questions,
        },
      };
    }

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        student_id: user.id,
        total_marks: assessment.total_marks ?? 0,
      },
    });

    const state = this.adaptiveEngine.initializeState(config);

    const subjectId = await this.adaptiveEngine.getSubjectIdForAssessment(
      tenantId,
      assessment.classroom_id,
    );
    if (!subjectId) {
      throw new NotFoundException('Classroom subject not found');
    }

    const question = await this.adaptiveEngine.selectNextQuestion(
      tenantId,
      subjectId,
      state,
    );

    if (question) {
      state.questions_served.push(question.id);
      state.question_sequence.push({
        question_id: question.id,
        difficulty: question.difficulty_level,
        order: 1,
      });
    }

    await this.prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { adaptive_state: state as unknown as Prisma.InputJsonValue },
    });

    return {
      attempt: { ...attempt, adaptive_state: state },
      current_question: question
        ? { ...question, sequence_order: 1 }
        : null,
      progress: {
        questions_answered: 0,
        current_difficulty: state.current_difficulty,
        max_questions: config.max_questions,
      },
    };
  }

  private async handleSemiAdaptiveStart(
    tenantId: string,
    assessment: {
      id: string;
      classroom_id: string;
      question_count: number | null;
      total_marks: number;
    },
    existing: { id: string; adaptive_state: unknown } | null,
    user: RequestUser,
  ) {
    if (existing) {
      const plan = existing.adaptive_state as unknown as SemiAdaptivePlan;
      const nextId = plan ? this.semiAdaptiveEngine.getNextQuestionId(plan) : null;
      const question = nextId
        ? await this.semiAdaptiveEngine.loadQuestion(tenantId, nextId)
        : null;

      return {
        attempt: existing,
        current_question: question
          ? this.stripCorrectAnswers(question)
          : null,
        progress: {
          questions_answered: plan?.served_questions?.length ?? 0,
          total_questions: plan?.active_queue?.length ?? 0,
          completed: plan ? this.semiAdaptiveEngine.isComplete(plan) : false,
        },
      };
    }

    const questionCount = assessment.question_count ?? 10;
    const plan = await this.semiAdaptiveEngine.buildQuestionPlan(
      tenantId,
      assessment.classroom_id,
      questionCount,
    );

    // Mark the first question as served and get it
    const firstQuestionId = this.semiAdaptiveEngine.getNextQuestionId(plan);
    let firstQuestion: Awaited<ReturnType<SemiAdaptiveEngineService['loadQuestion']>> = null;
    if (firstQuestionId) {
      const updatedPlan = this.semiAdaptiveEngine.markServed(
        plan,
        firstQuestionId,
      );
      Object.assign(plan, updatedPlan);
      firstQuestion = await this.semiAdaptiveEngine.loadQuestion(
        tenantId,
        firstQuestionId,
      );
    }

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        tenant_id: tenantId,
        assessment_id: assessment.id,
        student_id: user.id,
        total_marks: assessment.total_marks || questionCount,
        adaptive_state: plan as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      attempt: { ...attempt, adaptive_state: plan },
      current_question: firstQuestion
        ? this.stripCorrectAnswers(firstQuestion)
        : null,
      progress: {
        questions_answered: 0,
        total_questions: plan.active_queue.length,
        completed: false,
      },
    };
  }

  private stripCorrectAnswers(question: {
    id: string;
    type: string;
    stem: string;
    difficulty_level: string;
    bloom_level: string;
    hints: unknown;
    question_options: Array<{
      id: string;
      text: string;
      order_index: number;
      is_correct: boolean;
      rationale: string | null;
    }>;
  }) {
    return {
      id: question.id,
      type: question.type,
      stem: question.stem,
      difficulty_level: question.difficulty_level,
      bloom_level: question.bloom_level,
      hints: question.hints,
      question_options: question.question_options.map(
        ({ is_correct: _ic, rationale: _r, ...opt }) => opt,
      ),
    };
  }

  async findMyAttempts(
    tenantId: string,
    assessmentId: string,
    user: RequestUser,
  ) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can view their attempts');
    }

    return this.prisma.assessmentAttempt.findMany({
      where: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        student_id: user.id,
      },
      include: {
        attempt_responses: {
          include: {
            attempt_response_selections: true,
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });
  }

  async findAttemptById(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
  ) {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        tenant_id: tenantId,
        assessment_id: assessmentId,
      },
      include: {
        attempt_responses: {
          include: {
            attempt_response_selections: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with id "${attemptId}" not found`);
    }

    if (user.role === 'STUDENT' && attempt.student_id !== user.id) {
      throw new ForbiddenException('You can only access your own attempt');
    }

    return attempt;
  }

  async submitResponse(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
    dto: SubmitResponseDto,
  ) {
    const attempt = await this.findAttemptById(
      tenantId,
      assessmentId,
      attemptId,
      user,
    );
    if (user.role === 'STUDENT' && attempt.student_id !== user.id) {
      throw new ForbiddenException('You can only submit your own response');
    }
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new ForbiddenException('Attempt is no longer in progress');
    }

    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, tenant_id: tenantId },
    });

    const mode = assessment?.mode as AssessmentMode;

    // FIXED mode: validate question belongs to the assessment
    if (mode === AssessmentMode.FIXED || (!mode && !assessment?.is_adaptive)) {
      const attemptSelectedIds = attempt.selected_question_ids as string[] | null;
      await this.validateQuestionBelongsToAssessment(
        tenantId,
        assessmentId,
        dto.question_id,
        attemptSelectedIds,
      );
    }

    // SEMI_ADAPTIVE mode: validate question is in the active queue
    if (mode === AssessmentMode.SEMI_ADAPTIVE) {
      const plan = attempt.adaptive_state as unknown as SemiAdaptivePlan;
      if (plan && !plan.active_queue.includes(dto.question_id)) {
        throw new ForbiddenException('Question is not part of this attempt');
      }
    }

    const response = await this.upsertResponse(
      tenantId,
      attemptId,
      dto,
    );

    if (mode === AssessmentMode.SEMI_ADAPTIVE) {
      return this.handleSemiAdaptiveResponse(
        tenantId,
        attemptId,
        dto,
        response,
        attempt,
      );
    }

    if (mode === AssessmentMode.ADAPTIVE || assessment?.is_adaptive) {
      return this.handleAdaptiveResponse(
        tenantId,
        attemptId,
        dto,
        response,
        assessment!,
      );
    }

    return this.prisma.attemptResponse.findUniqueOrThrow({
      where: { id: response.id },
    });
  }

  private async validateQuestionBelongsToAssessment(
    tenantId: string,
    assessmentId: string,
    questionId: string,
    attemptSelectedIds?: string[] | null,
  ): Promise<void> {
    // If attempt has a selected subset, validate against that
    if (attemptSelectedIds && attemptSelectedIds.length > 0) {
      if (!attemptSelectedIds.includes(questionId)) {
        throw new NotFoundException('Question is not part of this assessment attempt');
      }
      return;
    }

    const assessmentQuestion = await this.prisma.assessmentQuestion.findFirst({
      where: { tenant_id: tenantId, assessment_id: assessmentId, question_id: questionId },
    });
    if (!assessmentQuestion) {
      throw new NotFoundException('Question is not part of this assessment');
    }
  }

  /**
   * If the assessment has question_count set and it's less than total linked questions,
   * randomly select that many questions. Returns null selectedIds if all questions should be used.
   */
  private async resolveSelectedQuestions(
    tenantId: string,
    assessmentId: string,
    questionCount: number | null,
    assessmentTotalMarks: number,
  ): Promise<{ selectedIds: string[] | null; totalMarks: number }> {
    if (!questionCount) {
      return { selectedIds: null, totalMarks: assessmentTotalMarks };
    }

    const allQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { tenant_id: tenantId, assessment_id: assessmentId },
      select: { question_id: true, marks: true },
    });

    // If question_count >= total linked questions, serve all
    if (questionCount >= allQuestions.length) {
      return { selectedIds: null, totalMarks: assessmentTotalMarks };
    }

    // Fisher-Yates shuffle and pick first questionCount
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, questionCount);
    const selectedIds = selected.map((q) => q.question_id);
    const totalMarks = selected.reduce((sum, q) => sum + q.marks, 0);

    return { selectedIds, totalMarks };
  }

  private async upsertResponse(
    tenantId: string,
    attemptId: string,
    dto: SubmitResponseDto,
  ) {
    const existing = await this.prisma.attemptResponse.findFirst({
      where: { tenant_id: tenantId, attempt_id: attemptId, question_id: dto.question_id },
    });

    const response = existing
      ? await this.prisma.attemptResponse.update({
          where: { id: existing.id },
          data: {
            ...(dto.text_response !== undefined
              ? { text_response: dto.text_response }
              : {}),
            ...(dto.time_spent_seconds !== undefined
              ? { time_spent_seconds: dto.time_spent_seconds }
              : {}),
            ...(dto.hint_level_used !== undefined
              ? { hint_level_used: dto.hint_level_used }
              : {}),
          },
        })
      : await this.prisma.attemptResponse.create({
          data: {
            tenant_id: tenantId,
            attempt_id: attemptId,
            question_id: dto.question_id,
            text_response: dto.text_response,
            time_spent_seconds: dto.time_spent_seconds ?? 0,
            hint_level_used: dto.hint_level_used,
          },
        });

    if (dto.option_ids !== undefined) {
      await this.prisma.attemptResponseSelection.deleteMany({
        where: { tenant_id: tenantId, attempt_response_id: response.id },
      });

      if (dto.option_ids.length > 0) {
        await this.prisma.attemptResponseSelection.createMany({
          data: dto.option_ids.map((optionId) => ({
            tenant_id: tenantId,
            attempt_response_id: response.id,
            option_id: optionId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return response;
  }

  private async handleAdaptiveResponse(
    tenantId: string,
    attemptId: string,
    dto: SubmitResponseDto,
    response: { id: string },
    assessment: { adaptive_config: unknown },
  ) {
    const question = await this.prisma.question.findFirst({
      where: { id: dto.question_id, tenant_id: tenantId },
      include: { question_options: true },
    });

    let isCorrect: boolean | null = null;
    let marksAwarded = 0;

    if (question && question.type !== 'SHORT_ANSWER') {
      const correctOptionIds = question.question_options
        .filter((o) => o.is_correct)
        .map((o) => o.id)
        .sort();
      const selectedOptionIds = (dto.option_ids ?? []).sort();

      isCorrect =
        correctOptionIds.length > 0 &&
        correctOptionIds.length === selectedOptionIds.length &&
        correctOptionIds.every((id, idx) => id === selectedOptionIds[idx]);
      marksAwarded = isCorrect ? 1 : 0;
    }

    const currentAttempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, tenant_id: tenantId },
    });

    const config = this.adaptiveEngine.resolveConfig(assessment.adaptive_config);
    const state = (currentAttempt?.adaptive_state as unknown) as AdaptiveState ??
      this.adaptiveEngine.initializeState(config);

    const sequenceOrder = state.questions_served.length;

    await this.prisma.attemptResponse.update({
      where: { id: response.id },
      data: {
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        served_difficulty: state.current_difficulty,
        sequence_order: sequenceOrder,
      },
    });

    if (isCorrect === null) {
      return this.prisma.attemptResponse.findUniqueOrThrow({
        where: { id: response.id },
      });
    }

    const newState = this.adaptiveEngine.updateState(state, isCorrect, config);

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { adaptive_state: newState as unknown as Prisma.InputJsonValue },
    });

    const correctOptions =
      question?.question_options.filter((o) => o.is_correct).map((o) => o.id) ?? [];

    return {
      response: await this.prisma.attemptResponse.findUniqueOrThrow({
        where: { id: response.id },
      }),
      feedback: {
        is_correct: isCorrect,
        correct_option_ids: correctOptions,
      },
      progress: {
        questions_answered: newState.questions_served.length,
        current_difficulty: newState.current_difficulty,
        max_questions: config.max_questions,
        difficulty_changed: newState.current_difficulty !== state.current_difficulty,
        new_difficulty:
          newState.current_difficulty !== state.current_difficulty
            ? newState.current_difficulty
            : undefined,
      },
    };
  }

  private async handleSemiAdaptiveResponse(
    tenantId: string,
    attemptId: string,
    dto: SubmitResponseDto,
    response: { id: string },
    attempt: { id: string; adaptive_state: unknown },
  ) {
    const plan = attempt.adaptive_state as unknown as SemiAdaptivePlan;
    if (!plan) {
      throw new ForbiddenException('Semi-adaptive state not initialized');
    }

    // Load question to auto-grade
    const question = await this.prisma.question.findFirst({
      where: { id: dto.question_id, tenant_id: tenantId },
      include: { question_options: true },
    });

    let isCorrect: boolean | null = null;
    let marksAwarded = 0;

    if (question && question.type !== 'SHORT_ANSWER') {
      const correctOptionIds = question.question_options
        .filter((o) => o.is_correct)
        .map((o) => o.id)
        .sort();
      const selectedOptionIds = (dto.option_ids ?? []).sort();

      isCorrect =
        correctOptionIds.length > 0 &&
        correctOptionIds.length === selectedOptionIds.length &&
        correctOptionIds.every((id, idx) => id === selectedOptionIds[idx]);

      // Determine marks: check swap_log for inherited marks, default to 1
      const swapEntry = plan.swap_log.find(
        (s) => s.injected_question_id === dto.question_id,
      );
      const baseMark = swapEntry ? 1 : 1; // Default 1 mark per question
      marksAwarded = isCorrect ? baseMark : 0;
    }

    const sequenceOrder = plan.served_questions.length;

    // Update the response with grading info
    await this.prisma.attemptResponse.update({
      where: { id: response.id },
      data: {
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        sequence_order: sequenceOrder,
      },
    });

    // Process response through the semi-adaptive engine (streak + swap)
    const updatedPlan = this.semiAdaptiveEngine.processResponse(
      plan,
      isCorrect,
    );

    // Persist updated plan
    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        adaptive_state: updatedPlan as unknown as Prisma.InputJsonValue,
      },
    });

    const correctOptions =
      question?.question_options.filter((o) => o.is_correct).map((o) => o.id) ?? [];

    // Check if there's a next question
    const nextQuestionId = this.semiAdaptiveEngine.getNextQuestionId(updatedPlan);
    const isComplete = this.semiAdaptiveEngine.isComplete(updatedPlan);

    return {
      response: await this.prisma.attemptResponse.findUniqueOrThrow({
        where: { id: response.id },
      }),
      feedback: {
        is_correct: isCorrect,
        correct_option_ids: correctOptions,
      },
      progress: {
        questions_answered: updatedPlan.served_questions.length,
        total_questions: updatedPlan.active_queue.length,
        completed: isComplete,
        has_next: nextQuestionId !== null,
        challenge_injected: updatedPlan.swap_log.length > plan.swap_log.length,
      },
    };
  }

  async getNextQuestion(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
  ) {
    const attempt = await this.findAttemptById(
      tenantId,
      assessmentId,
      attemptId,
      user,
    );
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new ForbiddenException('Attempt is no longer in progress');
    }

    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, tenant_id: tenantId },
    });

    const mode = assessment?.mode as AssessmentMode;

    // SEMI_ADAPTIVE: serve next question from the plan queue
    if (mode === AssessmentMode.SEMI_ADAPTIVE) {
      return this.handleSemiAdaptiveNextQuestion(tenantId, attemptId, attempt);
    }

    if (!assessment?.is_adaptive && mode !== AssessmentMode.ADAPTIVE) {
      throw new ForbiddenException('This is not an adaptive assessment');
    }

    const config = this.adaptiveEngine.resolveConfig(assessment!.adaptive_config);
    const state = (attempt.adaptive_state as unknown) as AdaptiveState;

    if (!state) {
      throw new ForbiddenException('Adaptive state not initialized');
    }

    if (state.questions_served.length >= config.max_questions) {
      return this.buildCompletedResponse(state, config);
    }

    const subjectId = await this.adaptiveEngine.getSubjectIdForAssessment(
      tenantId,
      assessment!.classroom_id,
    );
    if (!subjectId) {
      throw new NotFoundException('Classroom subject not found');
    }

    const question = await this.adaptiveEngine.selectNextQuestion(
      tenantId,
      subjectId,
      state,
    );

    if (!question) {
      return this.buildCompletedResponse(state, config);
    }

    const sequenceOrder = state.questions_served.length + 1;

    const newState: AdaptiveState = {
      ...state,
      questions_served: [...state.questions_served, question.id],
      question_sequence: [
        ...state.question_sequence,
        {
          question_id: question.id,
          difficulty: question.difficulty_level,
          order: sequenceOrder,
        },
      ],
    };

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { adaptive_state: newState as unknown as Prisma.InputJsonValue },
    });

    return {
      completed: false,
      current_question: { ...question, sequence_order: sequenceOrder },
      progress: {
        questions_answered: state.questions_served.length,
        current_difficulty: newState.current_difficulty,
        max_questions: config.max_questions,
      },
    };
  }

  private async handleSemiAdaptiveNextQuestion(
    tenantId: string,
    attemptId: string,
    attempt: { id: string; adaptive_state: unknown },
  ) {
    const plan = attempt.adaptive_state as unknown as SemiAdaptivePlan;
    if (!plan) {
      throw new ForbiddenException('Semi-adaptive state not initialized');
    }

    if (this.semiAdaptiveEngine.isComplete(plan)) {
      return {
        completed: true,
        current_question: null,
        progress: {
          questions_answered: plan.served_questions.length,
          total_questions: plan.active_queue.length,
          completed: true,
        },
      };
    }

    const nextQuestionId = this.semiAdaptiveEngine.getNextQuestionId(plan);
    if (!nextQuestionId) {
      return {
        completed: true,
        current_question: null,
        progress: {
          questions_answered: plan.served_questions.length,
          total_questions: plan.active_queue.length,
          completed: true,
        },
      };
    }

    // Mark as served
    const updatedPlan = this.semiAdaptiveEngine.markServed(plan, nextQuestionId);

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        adaptive_state: updatedPlan as unknown as Prisma.InputJsonValue,
      },
    });

    const question = await this.semiAdaptiveEngine.loadQuestion(
      tenantId,
      nextQuestionId,
    );

    return {
      completed: false,
      current_question: question
        ? this.stripCorrectAnswers(question)
        : null,
      progress: {
        questions_answered: updatedPlan.served_questions.length,
        total_questions: updatedPlan.active_queue.length,
        completed: false,
      },
    };
  }

  private buildCompletedResponse(
    state: AdaptiveState,
    config: { max_questions: number },
  ) {
    return {
      completed: true,
      current_question: null,
      progress: {
        questions_answered: state.questions_served.length,
        current_difficulty: state.current_difficulty,
        max_questions: config.max_questions,
      },
    };
  }

  async submitAttempt(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
  ) {
    const attempt = await this.findAttemptById(
      tenantId,
      assessmentId,
      attemptId,
      user,
    );
    if (user.role === 'STUDENT' && attempt.student_id !== user.id) {
      throw new ForbiddenException('You can only submit your own attempt');
    }
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new ForbiddenException('Attempt is already submitted');
    }

    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, tenant_id: tenantId },
    });

    const mode = assessment?.mode as AssessmentMode;

    if (mode === AssessmentMode.SEMI_ADAPTIVE) {
      return this.submitSemiAdaptiveAttempt(
        tenantId,
        assessmentId,
        attemptId,
        user,
        attempt,
      );
    }

    if (mode === AssessmentMode.ADAPTIVE || assessment?.is_adaptive) {
      return this.submitAdaptiveAttempt(
        tenantId,
        assessmentId,
        attemptId,
        user,
      );
    }

    return this.gradeAndSubmitAttempt(tenantId, assessmentId, attemptId, user);
  }

  private async submitAdaptiveAttempt(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
  ) {
    const totalResponses = await this.prisma.attemptResponse.findMany({
      where: { tenant_id: tenantId, attempt_id: attemptId },
    });

    const score = totalResponses.reduce(
      (sum, r) => sum + (r.marks_awarded ?? 0),
      0,
    );

    const analytics = await this.adaptiveEngine.computeAnalytics(
      tenantId,
      attemptId,
    );

    const questionBreakdown = await this.buildQuestionBreakdown(
      tenantId,
      attemptId,
      assessmentId,
    );

    await this.prisma.assessmentAttempt.updateMany({
      where: {
        id: attemptId,
        tenant_id: tenantId,
        assessment_id: assessmentId,
      },
      data: {
        status: AttemptStatus.SUBMITTED,
        submitted_at: new Date(),
        score,
        total_marks: totalResponses.length,
        analytics: analytics as unknown as Prisma.InputJsonValue,
        question_breakdown: questionBreakdown as unknown as Prisma.InputJsonValue,
      },
    });

    return this.findAttemptById(tenantId, assessmentId, attemptId, user);
  }

  private async submitSemiAdaptiveAttempt(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
    attempt: { adaptive_state: unknown },
  ) {
    const plan = attempt.adaptive_state as unknown as SemiAdaptivePlan;

    // Responses are already graded during submitResponse, so just sum up
    const responses = await this.prisma.attemptResponse.findMany({
      where: { tenant_id: tenantId, attempt_id: attemptId },
    });

    const score = responses.reduce(
      (sum, r) => sum + (r.marks_awarded ?? 0),
      0,
    );
    const totalMarks = responses.length; // 1 mark per question

    // Build analytics from the plan
    const analytics = {
      mode: 'SEMI_ADAPTIVE',
      total_questions_served: plan?.served_questions?.length ?? responses.length,
      total_correct: responses.filter((r) => r.is_correct === true).length,
      total_incorrect: responses.filter((r) => r.is_correct === false).length,
      total_ungraded: responses.filter((r) => r.is_correct === null).length,
      challenge_injections: plan?.swap_log?.length ?? 0,
      swap_log: plan?.swap_log ?? [],
      consecutive_correct_peak: this.computePeakStreak(responses),
    };

    const questionBreakdown = await this.buildQuestionBreakdown(
      tenantId,
      attemptId,
      assessmentId,
    );

    await this.prisma.assessmentAttempt.updateMany({
      where: {
        id: attemptId,
        tenant_id: tenantId,
        assessment_id: assessmentId,
      },
      data: {
        status: AttemptStatus.SUBMITTED,
        submitted_at: new Date(),
        score,
        total_marks: totalMarks,
        analytics: analytics as unknown as Prisma.InputJsonValue,
        question_breakdown: questionBreakdown as unknown as Prisma.InputJsonValue,
      },
    });

    return this.findAttemptById(tenantId, assessmentId, attemptId, user);
  }

  private computePeakStreak(
    responses: Array<{ is_correct: boolean | null; sequence_order: number | null }>,
  ): number {
    const sorted = [...responses]
      .filter((r) => r.sequence_order !== null)
      .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0));

    let peak = 0;
    let current = 0;
    for (const r of sorted) {
      if (r.is_correct === true) {
        current++;
        if (current > peak) peak = current;
      } else {
        current = 0;
      }
    }
    return peak;
  }

  private async gradeAndSubmitAttempt(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
  ) {
    const responses = await this.prisma.attemptResponse.findMany({
      where: { tenant_id: tenantId, attempt_id: attemptId },
      include: {
        question: { include: { question_options: true } },
        attempt_response_selections: true,
      },
    });

    const assessmentQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { tenant_id: tenantId, assessment_id: assessmentId },
    });
    const marksByQuestion = new Map(
      assessmentQuestions.map((aq) => [aq.question_id, aq.marks]),
    );

    let score = 0;
    for (const response of responses) {
      const marks = marksByQuestion.get(response.question_id) ?? 0;
      const { isCorrect, marksAwarded } = this.gradeResponse(response, marks);

      score += marksAwarded;

      await this.prisma.attemptResponse.update({
        where: { id: response.id },
        data: { is_correct: isCorrect, marks_awarded: marksAwarded },
      });
    }

    const questionBreakdown = await this.buildQuestionBreakdown(
      tenantId,
      attemptId,
      assessmentId,
    );

    await this.prisma.assessmentAttempt.updateMany({
      where: { id: attemptId, tenant_id: tenantId, assessment_id: assessmentId },
      data: {
        status: AttemptStatus.SUBMITTED,
        submitted_at: new Date(),
        score,
        question_breakdown: questionBreakdown as unknown as Prisma.InputJsonValue,
      },
    });

    return this.findAttemptById(tenantId, assessmentId, attemptId, user);
  }

  private gradeResponse(
    response: {
      question: {
        type: string;
        question_options: { id: string; is_correct: boolean }[];
      };
      attempt_response_selections: { option_id: string }[];
    },
    marks: number,
  ): { isCorrect: boolean | null; marksAwarded: number } {
    if (response.question.type === 'SHORT_ANSWER') {
      return { isCorrect: null, marksAwarded: 0 };
    }

    const correctOptionIds = response.question.question_options
      .filter((option) => option.is_correct)
      .map((option) => option.id)
      .sort();
    const selectedOptionIds = response.attempt_response_selections
      .map((selection) => selection.option_id)
      .sort();

    const isCorrect =
      correctOptionIds.length > 0 &&
      correctOptionIds.length === selectedOptionIds.length &&
      correctOptionIds.every((id, idx) => id === selectedOptionIds[idx]);

    return { isCorrect, marksAwarded: isCorrect ? marks : 0 };
  }

  async getResults(
    tenantId: string,
    assessmentId: string,
    attemptId: string,
    user: RequestUser,
  ) {
    return this.findAttemptById(tenantId, assessmentId, attemptId, user);
  }

  /**
   * List all attempts for an assessment (teacher/admin view).
   */
  async findAllAttempts(
    tenantId: string,
    assessmentId: string,
  ) {
    return this.prisma.assessmentAttempt.findMany({
      where: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
      },
      include: {
        student: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });
  }

  /**
   * Build a full per-question snapshot at submission time.
   * Captures question text, options, correct answers, student selections,
   * grading, and timing — so results are immutable even if questions change later.
   */
  private async buildQuestionBreakdown(
    tenantId: string,
    attemptId: string,
    assessmentId: string,
  ) {
    const responses = await this.prisma.attemptResponse.findMany({
      where: { tenant_id: tenantId, attempt_id: attemptId },
      include: {
        question: {
          include: {
            question_options: { orderBy: { order_index: 'asc' } },
            learning_objective: { select: { title: true } },
          },
        },
        attempt_response_selections: true,
      },
      orderBy: { sequence_order: 'asc' },
    });

    // Get marks-per-question from assessment_questions (for FIXED mode)
    const assessmentQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { tenant_id: tenantId, assessment_id: assessmentId },
      select: { question_id: true, marks: true, order_index: true },
    });
    const marksMap = new Map(
      assessmentQuestions.map((aq) => [aq.question_id, aq.marks]),
    );
    const orderMap = new Map(
      assessmentQuestions.map((aq) => [aq.question_id, aq.order_index]),
    );

    const selectedIdsPerResponse = new Map(
      responses.map((r) => [
        r.id,
        new Set(r.attempt_response_selections.map((s) => s.option_id)),
      ]),
    );

    return responses.map((r, idx) => {
      const selectedSet = selectedIdsPerResponse.get(r.id) ?? new Set<string>();

      return {
        question_id: r.question_id,
        sequence_order: r.sequence_order ?? orderMap.get(r.question_id) ?? idx + 1,
        stem: r.question.stem,
        type: r.question.type,
        difficulty_level: r.question.difficulty_level,
        bloom_level: r.question.bloom_level,
        learning_objective: r.question.learning_objective?.title ?? null,
        marks: marksMap.get(r.question_id) ?? r.marks_awarded ?? 1,
        marks_awarded: r.marks_awarded ?? 0,
        is_correct: r.is_correct,
        time_spent_seconds: r.time_spent_seconds,
        text_response: r.text_response,
        options: r.question.question_options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          order_index: opt.order_index,
          is_correct: opt.is_correct,
          was_selected: selectedSet.has(opt.id),
        })),
      };
    });
  }
}
