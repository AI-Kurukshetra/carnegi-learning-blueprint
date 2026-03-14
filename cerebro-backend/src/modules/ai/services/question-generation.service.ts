import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BloomLevel,
  DifficultyLevel,
  Prisma,
  QuestionGenerationJob,
  QuestionType,
  ReviewStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GeminiService } from '../gemini.service';
import { ApproveGeneratedQuestionsDto } from '../dto/approve-generated-questions.dto';
import { GenerateQuestionsDto } from '../dto/generate-questions.dto';
import { buildQuestionGenPrompt } from '../prompts/question-generation.prompt';

// ---------------------------------------------------------------------------
// Internal shapes
// ---------------------------------------------------------------------------

interface GeneratedOption {
  text: string;
  is_correct: boolean;
  rationale: string;
  order_index: number;
}

interface GeneratedQuestion {
  stem: string;
  type: string;
  difficulty_level: string;
  bloom_level: string;
  hints: string[];
  marks: number;
  options: GeneratedOption[];
}

// Default marks by difficulty when the AI does not supply them
const MARKS_BY_DIFFICULTY: Record<string, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async createJob(
    dto: GenerateQuestionsDto,
    tenantId: string,
    userId: string,
  ): Promise<{ job_id: string; status: string }> {
    await this.assertLearningObjectiveExists(dto.learning_objective_id, tenantId);

    const job = await this.prisma.questionGenerationJob.create({
      data: {
        tenant_id: tenantId,
        created_by_id: userId,
        learning_objective_id: dto.learning_objective_id,
        question_type: dto.question_type,
        difficulty_level: dto.difficulty_level,
        count: dto.count,
        status: 'PENDING',
        result_question_ids: [],
      },
    });

    // Fire-and-forget — return 202 immediately
    this.processJob(job.id, tenantId, userId).catch((err: unknown) => {
      this.logger.error(
        `Unhandled error in processJob for job ${job.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return { job_id: job.id, status: job.status };
  }

  async getJobStatus(
    jobId: string,
    tenantId: string,
  ): Promise<QuestionGenerationJob> {
    const job = await this.prisma.questionGenerationJob.findFirst({
      where: { id: jobId, tenant_id: tenantId },
    });

    if (!job) {
      throw new NotFoundException(`Generation job "${jobId}" not found`);
    }

    return job;
  }

  async approveJob(
    jobId: string,
    tenantId: string,
    dto: ApproveGeneratedQuestionsDto,
  ): Promise<{ question_ids: string[] }> {
    const job = await this.findCompletedJob(jobId, tenantId);
    const questionIds = await this.persistApprovedQuestions(job, dto, tenantId);
    await this.markJobApproved(jobId, questionIds);
    return { question_ids: questionIds };
  }

  // -------------------------------------------------------------------------
  // Background processing
  // -------------------------------------------------------------------------

  private async processJob(
    jobId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    await this.markJobProcessing(jobId);

    try {
      const job = await this.prisma.questionGenerationJob.findUniqueOrThrow({
        where: { id: jobId },
      });

      const lo = await this.fetchLearningObjectiveWithContext(
        job.learning_objective_id,
        tenantId,
      );

      const { system, user } = buildQuestionGenPrompt({
        learningObjectiveTitle: lo.title,
        bloomLevel: lo.bloom_level as BloomLevel,
        topicName: lo.topic.name,
        subjectName: lo.topic.subject.name,
        questionType: job.question_type as QuestionType,
        difficultyLevel: job.difficulty_level as DifficultyLevel,
        count: job.count,
      });

      const model =
        this.configService.get<string>('AI_QUESTION_GEN_MODEL') ?? 'gemini-2.5-flash';

      const aiResponse = await this.geminiService.sendMessage({
        model,
        systemPrompt: system,
        userPrompt: user,
        maxTokens: 8192,
        temperature: 0.7,
        tenantId,
        userId,
        feature: 'question_generation',
      });

      const questions = parseGeneratedQuestions(
        aiResponse.content,
        job.question_type as QuestionType,
        job.difficulty_level as DifficultyLevel,
        lo.bloom_level as BloomLevel,
      );

      await this.markJobCompleted(jobId, questions);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Job ${jobId} failed: ${message}`);
      await this.markJobFailed(jobId, message);
    }
  }

  // -------------------------------------------------------------------------
  // Approve helpers
  // -------------------------------------------------------------------------

  private async findCompletedJob(
    jobId: string,
    tenantId: string,
  ): Promise<QuestionGenerationJob> {
    const job = await this.prisma.questionGenerationJob.findFirst({
      where: { id: jobId, tenant_id: tenantId },
    });

    if (!job) {
      throw new NotFoundException(`Generation job "${jobId}" not found`);
    }

    if (job.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Job "${jobId}" is not in COMPLETED status (current: ${job.status})`,
      );
    }

    return job;
  }

  private async persistApprovedQuestions(
    job: QuestionGenerationJob,
    dto: ApproveGeneratedQuestionsDto,
    tenantId: string,
  ): Promise<string[]> {
    const questionIds: string[] = [];

    for (const q of dto.questions) {
      const id = await this.createApprovedQuestion(q, job, tenantId);
      questionIds.push(id);
    }

    return questionIds;
  }

  private async createApprovedQuestion(
    q: ApproveGeneratedQuestionsDto['questions'][number],
    job: QuestionGenerationJob,
    tenantId: string,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          tenant_id: tenantId,
          learning_objective_id: job.learning_objective_id,
          created_by_id: job.created_by_id,
          type: q.type as QuestionType,
          stem: q.stem,
          difficulty_level: q.difficulty_level as DifficultyLevel,
          bloom_level: q.bloom_level as BloomLevel,
          is_ai_generated: true,
          review_status: ReviewStatus.APPROVED,
          hints: q.hints,
        },
      });

      const hasOptions =
        (q.type === 'MCQ' || q.type === 'MULTI_SELECT') &&
        q.options &&
        q.options.length > 0;

      if (hasOptions && q.options) {
        await tx.questionOption.createMany({
          data: q.options.map((opt) => ({
            tenant_id: tenantId,
            question_id: question.id,
            text: opt.text,
            is_correct: opt.is_correct,
            rationale: opt.rationale ?? null,
            order_index: opt.order_index,
          })),
        });
      }

      return question.id;
    });
  }

  // -------------------------------------------------------------------------
  // Job status mutations
  // -------------------------------------------------------------------------

  private async markJobProcessing(jobId: string): Promise<void> {
    await this.prisma.questionGenerationJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });
  }

  private async markJobCompleted(
    jobId: string,
    questions: GeneratedQuestion[],
  ): Promise<void> {
    await this.prisma.questionGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        generated_questions: questions as unknown as Prisma.InputJsonValue,
        completed_at: new Date(),
      },
    });
  }

  private async markJobApproved(
    jobId: string,
    questionIds: string[],
  ): Promise<void> {
    await this.prisma.questionGenerationJob.update({
      where: { id: jobId },
      data: { result_question_ids: questionIds },
    });
  }

  private async markJobFailed(jobId: string, message: string): Promise<void> {
    await this.prisma.questionGenerationJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error_message: message },
    });
  }

  // -------------------------------------------------------------------------
  // Data-fetching helpers
  // -------------------------------------------------------------------------

  private async assertLearningObjectiveExists(
    learningObjectiveId: string,
    tenantId: string,
  ): Promise<void> {
    const lo = await this.prisma.learningObjective.findFirst({
      where: { id: learningObjectiveId, tenant_id: tenantId, deleted_at: null },
    });

    if (!lo) {
      throw new NotFoundException(
        `LearningObjective "${learningObjectiveId}" not found`,
      );
    }
  }

  private async fetchLearningObjectiveWithContext(
    learningObjectiveId: string,
    tenantId: string,
  ) {
    return this.prisma.learningObjective.findFirstOrThrow({
      where: { id: learningObjectiveId, tenant_id: tenantId, deleted_at: null },
      include: {
        topic: {
          include: { subject: true },
        },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Parsing helpers (module-private)
// ---------------------------------------------------------------------------

function parseGeneratedQuestions(
  rawContent: string,
  questionType: QuestionType,
  difficultyLevel: DifficultyLevel,
  bloomLevel: BloomLevel,
): GeneratedQuestion[] {
  const trimmed = rawContent.trim();
  const jsonText = extractJsonArray(trimmed);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`AI returned non-JSON content: ${trimmed.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not a JSON array');
  }

  return parsed.map((raw) =>
    normaliseQuestion(raw, questionType, difficultyLevel, bloomLevel),
  );
}

function extractJsonArray(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON array found in AI response');
  }
  return text.slice(start, end + 1);
}

function normaliseQuestion(
  raw: unknown,
  questionType: QuestionType,
  difficultyLevel: DifficultyLevel,
  bloomLevel: BloomLevel,
): GeneratedQuestion {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Generated question is not an object');
  }

  const q = raw as Record<string, unknown>;

  if (typeof q['stem'] !== 'string' || !q['stem']) {
    throw new Error('Generated question missing "stem" string');
  }

  if (!Array.isArray(q['options'])) {
    throw new Error('Generated question missing "options" array');
  }

  const hints = Array.isArray(q['hints'])
    ? (q['hints'] as string[]).slice(0, 3)
    : [];

  const options = (q['options'] as unknown[]).map(
    (opt, idx): GeneratedOption => {
      if (!opt || typeof opt !== 'object') {
        throw new Error(`Option ${idx} is not an object`);
      }
      const o = opt as Record<string, unknown>;
      return {
        text: String(o['text'] ?? ''),
        is_correct: Boolean(o['is_correct']),
        rationale: String(o['rationale'] ?? ''),
        order_index: typeof o['order_index'] === 'number' ? o['order_index'] : idx,
      };
    },
  );

  const marks =
    typeof q['marks'] === 'number'
      ? q['marks']
      : (MARKS_BY_DIFFICULTY[difficultyLevel] ?? 1);

  return {
    stem: q['stem'] as string,
    type: questionType,
    difficulty_level: difficultyLevel,
    bloom_level: bloomLevel,
    hints,
    marks,
    options,
  };
}
