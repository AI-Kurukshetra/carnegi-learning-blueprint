import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Question, QuestionOption } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsDto } from './dto/list-questions.dto';
import { ReviewQuestionDto } from './dto/review-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

export interface QuestionWithOptions extends Question {
  question_options: QuestionOption[];
}

export interface PaginatedQuestionsResponse {
  data: QuestionWithOptions[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    query: ListQuestionsDto,
  ): Promise<PaginatedQuestionsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.QuestionWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.difficulty_level
        ? { difficulty_level: query.difficulty_level }
        : {}),
      ...(query.bloom_level ? { bloom_level: query.bloom_level } : {}),
      ...(query.review_status ? { review_status: query.review_status } : {}),
      ...(query.learning_objective_id
        ? { learning_objective_id: query.learning_objective_id }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        include: {
          question_options: {
            orderBy: { order_index: 'asc' },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string): Promise<QuestionWithOptions> {
    const question = await this.prisma.question.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      include: {
        question_options: {
          orderBy: { order_index: 'asc' },
        },
      },
    });
    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }
    return question;
  }

  async create(
    tenantId: string,
    createdById: string,
    dto: CreateQuestionDto,
  ): Promise<QuestionWithOptions> {
    const question = await this.prisma.$transaction(async (tx) => {
      const createdQuestion = await tx.question.create({
        data: {
          tenant_id: tenantId,
          learning_objective_id: dto.learning_objective_id,
          created_by_id: createdById,
          type: dto.type,
          stem: dto.stem,
          difficulty_level: dto.difficulty_level,
          bloom_level: dto.bloom_level,
          is_ai_generated: dto.is_ai_generated ?? false,
          hints: dto.hints ?? [],
        },
      });

      if (dto.options && dto.options.length > 0) {
        await tx.questionOption.createMany({
          data: dto.options.map((option) => ({
            tenant_id: tenantId,
            question_id: createdQuestion.id,
            text: option.text,
            is_correct: option.is_correct,
            rationale: option.rationale,
            order_index: option.order_index,
          })),
        });
      }

      return createdQuestion;
    });

    return this.findById(tenantId, question.id);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateQuestionDto,
  ): Promise<QuestionWithOptions> {
    await this.findById(tenantId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.question.updateMany({
        where: { id, tenant_id: tenantId, deleted_at: null },
        data: {
          ...(dto.learning_objective_id !== undefined
            ? { learning_objective_id: dto.learning_objective_id }
            : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.stem !== undefined ? { stem: dto.stem } : {}),
          ...(dto.difficulty_level !== undefined
            ? { difficulty_level: dto.difficulty_level }
            : {}),
          ...(dto.bloom_level !== undefined ? { bloom_level: dto.bloom_level } : {}),
          ...(dto.is_ai_generated !== undefined
            ? { is_ai_generated: dto.is_ai_generated }
            : {}),
          ...(dto.hints !== undefined ? { hints: dto.hints } : {}),
        },
      });

      if (dto.options) {
        await tx.questionOption.deleteMany({
          where: { tenant_id: tenantId, question_id: id },
        });
        if (dto.options.length > 0) {
          await tx.questionOption.createMany({
            data: dto.options.map((option) => ({
              tenant_id: tenantId,
              question_id: id,
              text: option.text,
              is_correct: option.is_correct,
              rationale: option.rationale,
              order_index: option.order_index,
            })),
          });
        }
      }
    });

    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.prisma.question.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }

  async review(
    tenantId: string,
    id: string,
    dto: ReviewQuestionDto,
  ): Promise<QuestionWithOptions> {
    await this.findById(tenantId, id);
    await this.prisma.question.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { review_status: dto.review_status },
    });
    return this.findById(tenantId, id);
  }
}
