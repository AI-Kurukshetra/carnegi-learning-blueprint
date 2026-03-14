import { Injectable, NotFoundException } from '@nestjs/common';
import { AcademicYear, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { ListAcademicYearsDto } from './dto/list-academic-years.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

export interface PaginatedAcademicYearsResponse {
  data: AcademicYear[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    query: ListAcademicYearsDto,
  ): Promise<PaginatedAcademicYearsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AcademicYearWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(query.is_active !== undefined ? { is_active: query.is_active } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.academicYear.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { start_date: 'desc' },
      }),
      this.prisma.academicYear.count({ where }),
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

  async findById(tenantId: string, id: string): Promise<AcademicYear> {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });
    if (!academicYear) {
      throw new NotFoundException(`Academic year with id "${id}" not found`);
    }
    return academicYear;
  }

  async create(
    tenantId: string,
    dto: CreateAcademicYearDto,
  ): Promise<AcademicYear> {
    return this.prisma.$transaction(async (tx) => {
      if (dto.is_active === true) {
        await tx.academicYear.updateMany({
          where: { tenant_id: tenantId, is_active: true, deleted_at: null },
          data: { is_active: false },
        });
      }

      return tx.academicYear.create({
        data: {
          tenant_id: tenantId,
          name: dto.name,
          start_date: new Date(dto.start_date),
          end_date: new Date(dto.end_date),
          is_active: dto.is_active ?? false,
        },
      });
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAcademicYearDto,
  ): Promise<AcademicYear> {
    await this.findById(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.is_active === true) {
        await tx.academicYear.updateMany({
          where: {
            tenant_id: tenantId,
            deleted_at: null,
            is_active: true,
            id: { not: id },
          },
          data: { is_active: false },
        });
      }

      await tx.academicYear.updateMany({
        where: { id, tenant_id: tenantId, deleted_at: null },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.start_date !== undefined
            ? { start_date: new Date(dto.start_date) }
            : {}),
          ...(dto.end_date !== undefined
            ? { end_date: new Date(dto.end_date) }
            : {}),
          ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        },
      });

      const updated = await tx.academicYear.findFirst({
        where: { id, tenant_id: tenantId, deleted_at: null },
      });
      if (!updated) {
        throw new NotFoundException(`Academic year with id "${id}" not found`);
      }
      return updated;
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.prisma.academicYear.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { deleted_at: new Date(), is_active: false },
    });
  }
}
