import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Subject } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ListSubjectsDto } from './dto/list-subjects.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

export interface PaginatedSubjectsResponse {
  data: Subject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    query: ListSubjectsDto,
  ): Promise<PaginatedSubjectsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SubjectWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(query.is_active !== undefined ? { is_active: query.is_active } : {}),
      ...(query.code ? { code: query.code } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.subject.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.subject.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string): Promise<Subject> {
    const subject = await this.prisma.subject.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with id "${id}" not found`);
    }
    return subject;
  }

  async create(tenantId: string, dto: CreateSubjectDto): Promise<Subject> {
    const existing = await this.prisma.subject.findFirst({
      where: { tenant_id: tenantId, code: dto.code, deleted_at: null },
    });
    if (existing) {
      throw new ConflictException(`Subject code "${dto.code}" already exists`);
    }

    return this.prisma.subject.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateSubjectDto,
  ): Promise<Subject> {
    await this.findById(tenantId, id);

    if (dto.code !== undefined) {
      const existing = await this.prisma.subject.findFirst({
        where: {
          tenant_id: tenantId,
          code: dto.code,
          deleted_at: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(`Subject code "${dto.code}" already exists`);
      }
    }

    await this.prisma.subject.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
      },
    });
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.prisma.subject.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { deleted_at: new Date(), is_active: false },
    });
  }
}

