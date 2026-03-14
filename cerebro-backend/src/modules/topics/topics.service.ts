import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Topic } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { ListTopicsDto } from './dto/list-topics.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

export interface PaginatedTopicsResponse {
  data: Topic[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    subjectId: string,
    query: ListTopicsDto,
  ): Promise<PaginatedTopicsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.TopicWhereInput = {
      tenant_id: tenantId,
      subject_id: subjectId,
      deleted_at: null,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.topic.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }],
      }),
      this.prisma.topic.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, subjectId: string, id: string): Promise<Topic> {
    const topic = await this.prisma.topic.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        subject_id: subjectId,
        deleted_at: null,
      },
    });
    if (!topic) {
      throw new NotFoundException(`Topic with id "${id}" not found`);
    }
    return topic;
  }

  async create(tenantId: string, subjectId: string, dto: CreateTopicDto): Promise<Topic> {
    return this.prisma.topic.create({
      data: {
        tenant_id: tenantId,
        subject_id: subjectId,
        name: dto.name,
        description: dto.description,
        order_index: dto.order_index,
      },
    });
  }

  async update(
    tenantId: string,
    subjectId: string,
    id: string,
    dto: UpdateTopicDto,
  ): Promise<Topic> {
    await this.findById(tenantId, subjectId, id);
    await this.prisma.topic.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        subject_id: subjectId,
        deleted_at: null,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.order_index !== undefined ? { order_index: dto.order_index } : {}),
      },
    });
    return this.findById(tenantId, subjectId, id);
  }

  async remove(tenantId: string, subjectId: string, id: string): Promise<void> {
    await this.findById(tenantId, subjectId, id);
    await this.prisma.topic.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        subject_id: subjectId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });
  }
}

