import { Injectable, NotFoundException } from '@nestjs/common';
import { Grade, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { ListGradesDto } from './dto/list-grades.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

export interface PaginatedGradesResponse {
  data: Grade[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    academicYearId: string,
    query: ListGradesDto,
  ): Promise<PaginatedGradesResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.GradeWhereInput = {
      tenant_id: tenantId,
      academic_year_id: academicYearId,
      deleted_at: null,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.grade.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ level_number: 'asc' }, { created_at: 'asc' }],
      }),
      this.prisma.grade.count({ where }),
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

  async findById(tenantId: string, academicYearId: string, id: string): Promise<Grade> {
    const grade = await this.prisma.grade.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        academic_year_id: academicYearId,
        deleted_at: null,
      },
    });
    if (!grade) {
      throw new NotFoundException(`Grade with id "${id}" not found`);
    }
    return grade;
  }

  async create(
    tenantId: string,
    academicYearId: string,
    dto: CreateGradeDto,
  ): Promise<Grade> {
    return this.prisma.grade.create({
      data: {
        tenant_id: tenantId,
        academic_year_id: academicYearId,
        name: dto.name,
        level_number: dto.level_number,
      },
    });
  }

  async update(
    tenantId: string,
    academicYearId: string,
    id: string,
    dto: UpdateGradeDto,
  ): Promise<Grade> {
    await this.findById(tenantId, academicYearId, id);
    await this.prisma.grade.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        academic_year_id: academicYearId,
        deleted_at: null,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.level_number !== undefined
          ? { level_number: dto.level_number }
          : {}),
      },
    });
    return this.findById(tenantId, academicYearId, id);
  }

  async remove(
    tenantId: string,
    academicYearId: string,
    id: string,
  ): Promise<void> {
    await this.findById(tenantId, academicYearId, id);
    await this.prisma.grade.updateMany({
      where: {
        id,
        tenant_id: tenantId,
        academic_year_id: academicYearId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });
  }
}
