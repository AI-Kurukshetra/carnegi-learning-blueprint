import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Assessment, AssessmentMode, AssessmentQuestion, Prisma } from '@prisma/client';
import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AddAssessmentQuestionDto } from './dto/add-assessment-question.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ListAssessmentsDto } from './dto/list-assessments.dto';
import { ReorderAssessmentQuestionsDto } from './dto/reorder-assessment-questions.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

export interface AssessmentWithQuestions extends Assessment {
  assessment_questions: AssessmentQuestion[];
}

export interface PaginatedAssessmentsResponse {
  data: AssessmentWithQuestions[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface QuestionOptionDetail {
  id: string;
  text: string;
  is_correct: boolean;
  rationale: string | null;
  order_index: number;
}

export interface QuestionDetail {
  id: string;
  type: string;
  stem: string;
  difficulty_level: string;
  bloom_level: string;
  hints: unknown;
  question_options: QuestionOptionDetail[];
}

export interface AssessmentQuestionWithDetail {
  id: string;
  question_id: string;
  order_index: number;
  marks: number;
  question: QuestionDetail;
}

export interface AssessmentWithFullQuestions extends Assessment {
  assessment_questions: AssessmentQuestionWithDetail[];
}

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    query: ListAssessmentsDto,
    user?: RequestUser,
  ): Promise<PaginatedAssessmentsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const isStudent = user?.role === 'STUDENT';
    const studentClassroomIds = isStudent
      ? await this.resolveStudentClassroomIds(tenantId, user.id)
      : null;

    // Build completion filter for students (PENDING = no submitted/graded attempt, COMPLETED = has one)
    const completionFilter: Prisma.AssessmentWhereInput =
      isStudent && query.completion
        ? query.completion === 'PENDING'
          ? {
              NOT: {
                assessment_attempts: {
                  some: {
                    student_id: user.id,
                    status: { in: ['SUBMITTED', 'GRADED'] },
                  },
                },
              },
            }
          : {
              assessment_attempts: {
                some: {
                  student_id: user.id,
                  status: { in: ['SUBMITTED', 'GRADED'] },
                },
              },
            }
        : {};

    const where: Prisma.AssessmentWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(isStudent
        ? { classroom_id: { in: studentClassroomIds ?? [] }, status: 'PUBLISHED' }
        : {
            ...(query.classroom_id ? { classroom_id: query.classroom_id } : {}),
            ...(query.status ? { status: query.status } : {}),
          }),
      ...(query.type ? { type: query.type } : {}),
      ...completionFilter,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.assessment.findMany({
        where,
        include: {
          assessment_questions: {
            orderBy: { order_index: 'asc' },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.assessment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  private async resolveStudentClassroomIds(
    tenantId: string,
    studentId: string,
  ): Promise<string[]> {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { tenant_id: tenantId, student_id: studentId, is_active: true },
      select: { section_id: true },
    });

    const sectionIds = enrollments.map((e) => e.section_id);
    if (sectionIds.length === 0) {
      return [];
    }

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        section_id: { in: sectionIds },
      },
      select: { id: true },
    });

    return classrooms.map((c) => c.id);
  }

  async findById(tenantId: string, id: string): Promise<AssessmentWithQuestions> {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      include: {
        assessment_questions: {
          orderBy: { order_index: 'asc' },
        },
      },
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment with id "${id}" not found`);
    }
    return assessment;
  }

  async findByIdWithQuestions(
    tenantId: string,
    id: string,
  ): Promise<AssessmentWithFullQuestions> {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      include: {
        assessment_questions: {
          include: {
            question: {
              include: {
                question_options: {
                  orderBy: { order_index: 'asc' },
                },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment with id "${id}" not found`);
    }
    return assessment as AssessmentWithFullQuestions;
  }

  async create(
    tenantId: string,
    createdById: string,
    dto: CreateAssessmentDto,
  ): Promise<AssessmentWithQuestions> {
    // Auto-set mode to SEMI_ADAPTIVE when question_count is provided
    const mode = dto.mode
      ?? (dto.question_count ? AssessmentMode.SEMI_ADAPTIVE : AssessmentMode.FIXED);

    const assessment = await this.prisma.assessment.create({
      data: {
        tenant_id: tenantId,
        classroom_id: dto.classroom_id,
        created_by_id: createdById,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        mode,
        due_at: dto.due_at ? new Date(dto.due_at) : null,
        time_limit_minutes: dto.time_limit_minutes,
        has_randomized_questions: dto.has_randomized_questions ?? false,
        question_count: dto.question_count ?? null,
      },
    });
    return this.findById(tenantId, assessment.id);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAssessmentDto,
  ): Promise<AssessmentWithQuestions> {
    await this.findById(tenantId, id);
    await this.prisma.assessment.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: {
        ...(dto.classroom_id !== undefined ? { classroom_id: dto.classroom_id } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.due_at !== undefined
          ? { due_at: dto.due_at ? new Date(dto.due_at) : null }
          : {}),
        ...(dto.time_limit_minutes !== undefined
          ? { time_limit_minutes: dto.time_limit_minutes }
          : {}),
        ...(dto.has_randomized_questions !== undefined
          ? { has_randomized_questions: dto.has_randomized_questions }
          : {}),
        ...(dto.question_count !== undefined
          ? { question_count: dto.question_count }
          : {}),
        ...(dto.mode !== undefined
          ? { mode: dto.mode }
          : {}),
      },
    });
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.prisma.assessment.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }

  async publish(tenantId: string, id: string): Promise<AssessmentWithQuestions> {
    await this.findById(tenantId, id);
    await this.prisma.assessment.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { status: 'PUBLISHED' },
    });
    return this.findById(tenantId, id);
  }

  async close(tenantId: string, id: string): Promise<AssessmentWithQuestions> {
    await this.findById(tenantId, id);
    await this.prisma.assessment.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { status: 'CLOSED' },
    });
    return this.findById(tenantId, id);
  }

  async addQuestion(
    tenantId: string,
    assessmentId: string,
    dto: AddAssessmentQuestionDto,
  ): Promise<AssessmentWithQuestions> {
    await this.findById(tenantId, assessmentId);
    const question = await this.prisma.question.findFirst({
      where: { id: dto.question_id, tenant_id: tenantId, deleted_at: null },
    });
    if (!question) {
      throw new NotFoundException(`Question with id "${dto.question_id}" not found`);
    }

    const existing = await this.prisma.assessmentQuestion.findFirst({
      where: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        question_id: dto.question_id,
      },
    });
    if (existing) {
      throw new ConflictException('Question already attached to assessment');
    }

    await this.prisma.assessmentQuestion.create({
      data: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        question_id: dto.question_id,
        order_index: dto.order_index,
        marks: dto.marks,
      },
    });

    await this.recalculateAssessmentStats(tenantId, assessmentId);
    return this.findById(tenantId, assessmentId);
  }

  async removeQuestion(
    tenantId: string,
    assessmentId: string,
    questionId: string,
  ): Promise<void> {
    await this.findById(tenantId, assessmentId);
    await this.prisma.assessmentQuestion.deleteMany({
      where: {
        tenant_id: tenantId,
        assessment_id: assessmentId,
        question_id: questionId,
      },
    });
    await this.recalculateAssessmentStats(tenantId, assessmentId);
  }

  async reorderQuestions(
    tenantId: string,
    assessmentId: string,
    dto: ReorderAssessmentQuestionsDto,
  ): Promise<AssessmentWithQuestions> {
    await this.findById(tenantId, assessmentId);

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        await tx.assessmentQuestion.updateMany({
          where: {
            tenant_id: tenantId,
            assessment_id: assessmentId,
            question_id: item.question_id,
          },
          data: {
            order_index: item.order_index,
            ...(item.marks !== undefined ? { marks: item.marks } : {}),
          },
        });
      }
    });

    await this.recalculateAssessmentStats(tenantId, assessmentId);
    return this.findById(tenantId, assessmentId);
  }

  private async recalculateAssessmentStats(
    tenantId: string,
    assessmentId: string,
  ): Promise<void> {
    const aggregate = await this.prisma.assessmentQuestion.aggregate({
      where: { tenant_id: tenantId, assessment_id: assessmentId },
      _sum: { marks: true },
    });

    await this.prisma.assessment.updateMany({
      where: { id: assessmentId, tenant_id: tenantId, deleted_at: null },
      data: { total_marks: aggregate._sum.marks ?? 0 },
    });
  }
}
