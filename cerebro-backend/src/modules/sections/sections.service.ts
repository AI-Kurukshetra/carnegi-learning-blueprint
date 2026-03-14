import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Section } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { ListSectionsDto } from './dto/list-sections.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

export interface PaginatedSectionsResponse {
  data: Section[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    gradeId: string,
    query: ListSectionsDto,
  ): Promise<PaginatedSectionsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SectionWhereInput = {
      tenant_id: tenantId,
      grade_id: gradeId,
      deleted_at: null,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.section.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.section.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(tenantId: string, gradeId: string, id: string): Promise<Section> {
    const section = await this.prisma.section.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        grade_id: gradeId,
        deleted_at: null,
      },
    });
    if (!section) {
      throw new NotFoundException(`Section with id "${id}" not found`);
    }
    return section;
  }

  async create(tenantId: string, gradeId: string, dto: CreateSectionDto): Promise<Section> {
    return this.prisma.section.create({
      data: {
        tenant_id: tenantId,
        grade_id: gradeId,
        name: dto.name,
      },
    });
  }

  async update(
    tenantId: string,
    gradeId: string,
    id: string,
    dto: UpdateSectionDto,
  ): Promise<Section> {
    await this.findById(tenantId, gradeId, id);
    await this.prisma.section.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        grade_id: gradeId,
        deleted_at: null,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
      },
    });
    return this.findById(tenantId, gradeId, id);
  }

  async remove(tenantId: string, gradeId: string, id: string): Promise<void> {
    await this.findById(tenantId, gradeId, id);
    await this.prisma.section.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        grade_id: gradeId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });
  }
}
