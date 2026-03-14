import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StudentEnrollment } from '@prisma/client';
import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkCreateEnrollmentDto } from './dto/bulk-create-enrollment.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { ListEnrollmentsDto } from './dto/list-enrollments.dto';

export interface PaginatedEnrollmentsResponse {
  data: StudentEnrollment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    dto: CreateEnrollmentDto,
  ): Promise<StudentEnrollment> {
    const existing = await this.prisma.studentEnrollment.findFirst({
      where: {
        tenant_id: tenantId,
        student_id: dto.student_id,
        section_id: dto.section_id,
        academic_year_id: dto.academic_year_id,
      },
    });
    if (existing) {
      throw new ConflictException('Enrollment already exists');
    }

    return this.prisma.studentEnrollment.create({
      data: {
        tenant_id: tenantId,
        student_id: dto.student_id,
        section_id: dto.section_id,
        academic_year_id: dto.academic_year_id,
      },
    });
  }

  async bulkCreate(
    tenantId: string,
    dto: BulkCreateEnrollmentDto,
  ): Promise<{ created_count: number }> {
    let createdCount = 0;

    for (const item of dto.items) {
      const existing = await this.prisma.studentEnrollment.findFirst({
        where: {
          tenant_id: tenantId,
          student_id: item.student_id,
          section_id: item.section_id,
          academic_year_id: item.academic_year_id,
        },
      });

      if (!existing) {
        await this.prisma.studentEnrollment.create({
          data: {
            tenant_id: tenantId,
            student_id: item.student_id,
            section_id: item.section_id,
            academic_year_id: item.academic_year_id,
          },
        });
        createdCount += 1;
      }
    }

    return { created_count: createdCount };
  }

  async findAll(
    tenantId: string,
    user: RequestUser,
    query: ListEnrollmentsDto,
  ): Promise<PaginatedEnrollmentsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.StudentEnrollmentWhereInput = {
      tenant_id: tenantId,
      ...(query.student_id ? { student_id: query.student_id } : {}),
      ...(query.section_id ? { section_id: query.section_id } : {}),
      ...(query.academic_year_id
        ? { academic_year_id: query.academic_year_id }
        : {}),
      ...(query.is_active !== undefined ? { is_active: query.is_active } : {}),
      ...(user.role === 'STUDENT' ? { student_id: user.id } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.studentEnrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrolled_at: 'desc' },
      }),
      this.prisma.studentEnrollment.count({ where }),
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

  async remove(tenantId: string, id: string): Promise<void> {
    const existing = await this.prisma.studentEnrollment.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Enrollment with id "${id}" not found`);
    }

    await this.prisma.studentEnrollment.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async autoAssign(tenantId: string): Promise<{ enrolled_count: number }> {
    const activeYear = await this.findActiveAcademicYear(tenantId);
    const targetSection = await this.findFirstSection(tenantId, activeYear.id);
    const unenrolledStudents = await this.findUnenrolledStudents(
      tenantId,
      activeYear.id,
    );

    let enrolledCount = 0;
    for (const student of unenrolledStudents) {
      await this.prisma.studentEnrollment.upsert({
        where: {
          uq_enrollments_tenant_student_section_year: {
            tenant_id: tenantId,
            student_id: student.id,
            section_id: targetSection.id,
            academic_year_id: activeYear.id,
          },
        },
        update: { is_active: true },
        create: {
          tenant_id: tenantId,
          student_id: student.id,
          section_id: targetSection.id,
          academic_year_id: activeYear.id,
        },
      });
      enrolledCount += 1;
    }

    return { enrolled_count: enrolledCount };
  }

  private async findActiveAcademicYear(tenantId: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { tenant_id: tenantId, is_active: true, deleted_at: null },
    });
    if (!year) {
      throw new NotFoundException('No active academic year found for this tenant');
    }
    return year;
  }

  private async findFirstSection(tenantId: string, academicYearId: string) {
    const grade = await this.prisma.grade.findFirst({
      where: { tenant_id: tenantId, academic_year_id: academicYearId, deleted_at: null },
      orderBy: { level_number: 'asc' },
      include: {
        sections: {
          where: { deleted_at: null },
          orderBy: { name: 'asc' },
          take: 1,
        },
      },
    });

    const section = grade?.sections?.[0];
    if (!section) {
      throw new NotFoundException(
        'No sections found for the active academic year',
      );
    }
    return section;
  }

  private async findUnenrolledStudents(
    tenantId: string,
    academicYearId: string,
  ) {
    const enrolledStudentIds = await this.prisma.studentEnrollment
      .findMany({
        where: {
          tenant_id: tenantId,
          academic_year_id: academicYearId,
          is_active: true,
        },
        select: { student_id: true },
      })
      .then((rows) => rows.map((r) => r.student_id));

    return this.prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        role: 'STUDENT',
        deleted_at: null,
        is_active: true,
        id: { notIn: enrolledStudentIds.length > 0 ? enrolledStudentIds : [''] },
      },
      select: { id: true },
    });
  }
}
