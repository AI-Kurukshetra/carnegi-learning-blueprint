import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LearningObjective, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCompetencyStandardDto } from './dto/add-competency-standard.dto';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';
import { CreateLearningObjectiveDto } from './dto/create-learning-objective.dto';
import { ListLearningObjectivesDto } from './dto/list-learning-objectives.dto';
import { UpdateLearningObjectiveDto } from './dto/update-learning-objective.dto';

export interface PaginatedLearningObjectivesResponse {
  data: LearningObjective[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class LearningObjectivesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    topicId: string,
    query: ListLearningObjectivesDto,
  ): Promise<PaginatedLearningObjectivesResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LearningObjectiveWhereInput = {
      tenant_id: tenantId,
      topic_id: topicId,
      deleted_at: null,
      ...(query.bloom_level ? { bloom_level: query.bloom_level } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.learningObjective.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
      }),
      this.prisma.learningObjective.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async findById(
    tenantId: string,
    topicId: string,
    id: string,
  ): Promise<LearningObjective> {
    const learningObjective = await this.prisma.learningObjective.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        topic_id: topicId,
        deleted_at: null,
      },
    });
    if (!learningObjective) {
      throw new NotFoundException(`Learning objective with id "${id}" not found`);
    }
    return learningObjective;
  }

  async create(
    tenantId: string,
    topicId: string,
    dto: CreateLearningObjectiveDto,
  ): Promise<LearningObjective> {
    return this.prisma.learningObjective.create({
      data: {
        tenant_id: tenantId,
        topic_id: topicId,
        title: dto.title,
        description: dto.description,
        bloom_level: dto.bloom_level,
        order_index: dto.order_index,
      },
    });
  }

  async update(
    tenantId: string,
    topicId: string,
    id: string,
    dto: UpdateLearningObjectiveDto,
  ): Promise<LearningObjective> {
    await this.findById(tenantId, topicId, id);
    await this.prisma.learningObjective.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        topic_id: topicId,
        deleted_at: null,
      },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.bloom_level !== undefined ? { bloom_level: dto.bloom_level } : {}),
        ...(dto.order_index !== undefined ? { order_index: dto.order_index } : {}),
      },
    });
    return this.findById(tenantId, topicId, id);
  }

  async remove(tenantId: string, topicId: string, id: string): Promise<void> {
    await this.findById(tenantId, topicId, id);
    await this.prisma.learningObjective.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        topic_id: topicId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });
  }

  async addPrerequisite(
    tenantId: string,
    topicId: string,
    id: string,
    dto: AddPrerequisiteDto,
  ): Promise<{ success: true }> {
    await this.findById(tenantId, topicId, id);
    const sourceLo = await this.prisma.learningObjective.findFirst({
      where: { id: dto.prerequisite_lo_id, tenant_id: tenantId, deleted_at: null },
    });
    if (!sourceLo) {
      throw new NotFoundException(
        `Prerequisite learning objective "${dto.prerequisite_lo_id}" not found`,
      );
    }

    const existing = await this.prisma.loPrerequisite.findFirst({
      where: {
        tenant_id: tenantId,
        source_lo_id: dto.prerequisite_lo_id,
        target_lo_id: id,
      },
    });
    if (existing) {
      throw new ConflictException('Prerequisite mapping already exists');
    }

    await this.prisma.loPrerequisite.create({
      data: {
        tenant_id: tenantId,
        source_lo_id: dto.prerequisite_lo_id,
        target_lo_id: id,
      },
    });
    return { success: true };
  }

  async removePrerequisite(
    tenantId: string,
    topicId: string,
    id: string,
    prerequisiteLoId: string,
  ): Promise<void> {
    await this.findById(tenantId, topicId, id);
    await this.prisma.loPrerequisite.deleteMany({
      where: {
        tenant_id: tenantId,
        source_lo_id: prerequisiteLoId,
        target_lo_id: id,
      },
    });
  }

  async addCompetencyStandard(
    tenantId: string,
    topicId: string,
    id: string,
    dto: AddCompetencyStandardDto,
  ): Promise<{ success: true }> {
    await this.findById(tenantId, topicId, id);
    const competencyStandard = await this.prisma.competencyStandard.findFirst({
      where: {
        id: dto.competency_standard_id,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
    if (!competencyStandard) {
      throw new NotFoundException(
        `Competency standard "${dto.competency_standard_id}" not found`,
      );
    }

    const existing = await this.prisma.loCompetencyMapping.findFirst({
      where: {
        tenant_id: tenantId,
        learning_objective_id: id,
        competency_standard_id: dto.competency_standard_id,
      },
    });
    if (existing) {
      throw new ConflictException('Competency mapping already exists');
    }

    await this.prisma.loCompetencyMapping.create({
      data: {
        tenant_id: tenantId,
        learning_objective_id: id,
        competency_standard_id: dto.competency_standard_id,
      },
    });
    return { success: true };
  }

  async removeCompetencyStandard(
    tenantId: string,
    topicId: string,
    id: string,
    competencyStandardId: string,
  ): Promise<void> {
    await this.findById(tenantId, topicId, id);
    await this.prisma.loCompetencyMapping.deleteMany({
      where: {
        tenant_id: tenantId,
        learning_objective_id: id,
        competency_standard_id: competencyStandardId,
      },
    });
  }
}

