import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CompetencyStandard, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompetencyStandardDto } from './dto/create-competency-standard.dto';
import { ListCompetencyStandardsDto } from './dto/list-competency-standards.dto';
import { UpdateCompetencyStandardDto } from './dto/update-competency-standard.dto';

export interface PaginatedCompetencyStandardsResponse {
  data: CompetencyStandard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class CompetencyStandardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    query: ListCompetencyStandardsDto,
  ): Promise<PaginatedCompetencyStandardsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CompetencyStandardWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.competencyStandard.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.prisma.competencyStandard.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string): Promise<CompetencyStandard> {
    const competencyStandard = await this.prisma.competencyStandard.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });
    if (!competencyStandard) {
      throw new NotFoundException(`Competency standard with id "${id}" not found`);
    }
    return competencyStandard;
  }

  async create(
    tenantId: string,
    dto: CreateCompetencyStandardDto,
  ): Promise<CompetencyStandard> {
    const existing = await this.prisma.competencyStandard.findFirst({
      where: { tenant_id: tenantId, code: dto.code, deleted_at: null },
    });
    if (existing) {
      throw new ConflictException(`Competency code "${dto.code}" already exists`);
    }

    return this.prisma.competencyStandard.create({
      data: {
        tenant_id: tenantId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCompetencyStandardDto,
  ): Promise<CompetencyStandard> {
    await this.findById(tenantId, id);

    if (dto.code !== undefined) {
      const existing = await this.prisma.competencyStandard.findFirst({
        where: {
          tenant_id: tenantId,
          code: dto.code,
          deleted_at: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(`Competency code "${dto.code}" already exists`);
      }
    }

    await this.prisma.competencyStandard.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.prisma.competencyStandard.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }
}

