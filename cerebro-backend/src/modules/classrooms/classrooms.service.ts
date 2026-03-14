import { Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentStatus, AttemptStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { ListClassroomsDto } from './dto/list-classrooms.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ClassroomWithRelations {
  id: string;
  tenant_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  academic_year_id: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  subject: { id: string; name: string; code: string } | null;
  section: { id: string; name: string } | null;
  academic_year: { id: string; name: string; is_active: boolean } | null;
  student_count: number;
}

export interface ClassroomDetailStudent {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  enrolled_at: Date;
}

export interface ClassroomDetail {
  id: string;
  tenant_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  academic_year_id: string;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  subject: { id: string; name: string; code: string } | null;
  section: { id: string; name: string } | null;
  academic_year: { id: string; name: string; is_active: boolean } | null;
  students: ClassroomDetailStudent[];
  assessment_count: number;
}

export interface PaginatedClassroomsResponse {
  data: ClassroomWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface RecentAssessmentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  classroom_name: string;
  created_at: Date;
  attempt_count: number;
}

export interface TeacherDashboardStats {
  total_classrooms: number;
  total_students: number;
  total_assessments: number;
  published_assessments: number;
  total_attempts: number;
  completed_attempts: number;
  recent_assessments: RecentAssessmentItem[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // findAll — enriched with subject, section, academic_year, student_count
  // -------------------------------------------------------------------------

  async findAll(
    tenantId: string,
    query: ListClassroomsDto,
  ): Promise<PaginatedClassroomsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ClassroomWhereInput = this.buildListWhere(
      tenantId,
      query,
    );

    const [rawClassrooms, total] = await this.prisma.$transaction([
      this.prisma.classroom.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          section: { select: { id: true, name: true } },
          academic_year: { select: { id: true, name: true, is_active: true } },
        },
      }),
      this.prisma.classroom.count({ where }),
    ]);

    const studentCounts = await this.batchStudentCounts(tenantId, rawClassrooms);

    const data: ClassroomWithRelations[] = rawClassrooms.map((c) => ({
      ...c,
      student_count: studentCounts.get(`${c.section_id}:${c.academic_year_id}`) ?? 0,
    }));

    return {
      data,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    };
  }

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------

  async findById(tenantId: string, id: string): Promise<ClassroomDetail> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        academic_year: { select: { id: true, name: true, is_active: true } },
        _count: { select: { assessments: true } },
      },
    });
    if (!classroom) {
      throw new NotFoundException(`Classroom with id "${id}" not found`);
    }

    const students = await this.fetchClassroomStudents(
      tenantId,
      classroom.section_id,
      classroom.academic_year_id,
    );

    const { _count, ...rest } = classroom;
    return { ...rest, students, assessment_count: _count.assessments };
  }

  private async fetchClassroomStudents(
    tenantId: string,
    sectionId: string,
    academicYearId: string,
  ): Promise<ClassroomDetailStudent[]> {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        tenant_id: tenantId,
        section_id: sectionId,
        academic_year_id: academicYearId,
        is_active: true,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: [
        { student: { last_name: 'asc' } },
        { student: { first_name: 'asc' } },
      ],
    });

    return enrollments.map((e) => ({
      id: e.student.id,
      email: e.student.email,
      first_name: e.student.first_name,
      last_name: e.student.last_name,
      enrolled_at: e.enrolled_at,
    }));
  }

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  async create(tenantId: string, dto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: {
        tenant_id: tenantId,
        section_id: dto.section_id,
        subject_id: dto.subject_id,
        teacher_id: dto.teacher_id,
        academic_year_id: dto.academic_year_id,
        name: dto.name,
        is_active: dto.is_active ?? true,
      },
    });
  }

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  async update(tenantId: string, id: string, dto: UpdateClassroomDto) {
    await this.findRawById(tenantId, id);
    await this.prisma.classroom.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: {
        ...(dto.section_id !== undefined ? { section_id: dto.section_id } : {}),
        ...(dto.subject_id !== undefined ? { subject_id: dto.subject_id } : {}),
        ...(dto.teacher_id !== undefined ? { teacher_id: dto.teacher_id } : {}),
        ...(dto.academic_year_id !== undefined
          ? { academic_year_id: dto.academic_year_id }
          : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
      },
    });
    return this.findById(tenantId, id);
  }

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findRawById(tenantId, id);
    await this.prisma.classroom.updateMany({
      where: { id, tenant_id: tenantId, deleted_at: null },
      data: { deleted_at: new Date(), is_active: false },
    });
  }

  // -------------------------------------------------------------------------
  // findClassroomStudents
  // -------------------------------------------------------------------------

  async findClassroomStudents(
    tenantId: string,
    classroomId: string,
  ): Promise<ClassroomDetailStudent[]> {
    const classroom = await this.findRawById(tenantId, classroomId);
    return this.fetchClassroomStudents(
      tenantId,
      classroom.section_id,
      classroom.academic_year_id,
    );
  }

  // Lightweight existence check that returns only scalar fields — avoids the
  // additional student-fetch that findById performs.
  private async findRawById(tenantId: string, id: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });
    if (!classroom) {
      throw new NotFoundException(`Classroom with id "${id}" not found`);
    }
    return classroom;
  }

  // -------------------------------------------------------------------------
  // getTeacherDashboardStats — Tasks 3 & 4
  // -------------------------------------------------------------------------

  async getTeacherDashboardStats(
    tenantId: string,
    teacherId: string,
  ): Promise<TeacherDashboardStats> {
    const classrooms = await this.fetchActiveTeacherClassrooms(
      tenantId,
      teacherId,
    );

    const [totalStudents, assessmentStats, recentAssessments] =
      await Promise.all([
        this.countUniqueStudents(tenantId, classrooms),
        this.fetchAssessmentStats(tenantId, teacherId),
        this.fetchRecentAssessments(tenantId, teacherId),
      ]);

    return {
      total_classrooms: classrooms.length,
      total_students: totalStudents,
      ...assessmentStats,
      recent_assessments: recentAssessments,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildListWhere(
    tenantId: string,
    query: ListClassroomsDto,
  ): Prisma.ClassroomWhereInput {
    return {
      tenant_id: tenantId,
      deleted_at: null,
      ...(query.section_id ? { section_id: query.section_id } : {}),
      ...(query.subject_id ? { subject_id: query.subject_id } : {}),
      ...(query.teacher_id ? { teacher_id: query.teacher_id } : {}),
      ...(query.academic_year_id
        ? { academic_year_id: query.academic_year_id }
        : {}),
      ...(query.is_active !== undefined ? { is_active: query.is_active } : {}),
    };
  }

  private async batchStudentCounts(
    tenantId: string,
    classrooms: Array<{ section_id: string; academic_year_id: string }>,
  ): Promise<Map<string, number>> {
    if (classrooms.length === 0) return new Map();

    const pairs = [
      ...new Map(
        classrooms.map((c) => [
          `${c.section_id}:${c.academic_year_id}`,
          { section_id: c.section_id, academic_year_id: c.academic_year_id },
        ]),
      ).values(),
    ];

    const counts = await Promise.all(
      pairs.map(async ({ section_id, academic_year_id }) => {
        const count = await this.prisma.studentEnrollment.count({
          where: {
            tenant_id: tenantId,
            section_id,
            academic_year_id,
            is_active: true,
          },
        });
        return { key: `${section_id}:${academic_year_id}`, count };
      }),
    );

    return new Map(counts.map(({ key, count }) => [key, count]));
  }

  private async fetchActiveTeacherClassrooms(
    tenantId: string,
    teacherId: string,
  ) {
    return this.prisma.classroom.findMany({
      where: {
        tenant_id: tenantId,
        teacher_id: teacherId,
        deleted_at: null,
        is_active: true,
      },
      select: {
        id: true,
        section_id: true,
        academic_year_id: true,
      },
    });
  }

  private async countUniqueStudents(
    tenantId: string,
    classrooms: Array<{ section_id: string; academic_year_id: string }>,
  ): Promise<number> {
    if (classrooms.length === 0) return 0;

    const orConditions = classrooms.map((c) => ({
      section_id: c.section_id,
      academic_year_id: c.academic_year_id,
    }));

    const result = await this.prisma.studentEnrollment.groupBy({
      by: ['student_id'],
      where: {
        tenant_id: tenantId,
        is_active: true,
        OR: orConditions,
      },
    });

    return result.length;
  }

  private async fetchAssessmentStats(
    tenantId: string,
    teacherId: string,
  ): Promise<{
    total_assessments: number;
    published_assessments: number;
    total_attempts: number;
    completed_attempts: number;
  }> {
    const baseAssessmentWhere: Prisma.AssessmentWhereInput = {
      tenant_id: tenantId,
      created_by_id: teacherId,
      deleted_at: null,
    };

    const [totalAssessments, publishedAssessments, assessmentIds] =
      await Promise.all([
        this.prisma.assessment.count({ where: baseAssessmentWhere }),
        this.prisma.assessment.count({
          where: { ...baseAssessmentWhere, status: AssessmentStatus.PUBLISHED },
        }),
        this.prisma.assessment.findMany({
          where: baseAssessmentWhere,
          select: { id: true },
        }),
      ]);

    if (assessmentIds.length === 0) {
      return {
        total_assessments: totalAssessments,
        published_assessments: publishedAssessments,
        total_attempts: 0,
        completed_attempts: 0,
      };
    }

    const ids = assessmentIds.map((a) => a.id);
    const baseAttemptWhere: Prisma.AssessmentAttemptWhereInput = {
      tenant_id: tenantId,
      assessment_id: { in: ids },
    };

    const [totalAttempts, completedAttempts] = await Promise.all([
      this.prisma.assessmentAttempt.count({ where: baseAttemptWhere }),
      this.prisma.assessmentAttempt.count({
        where: {
          ...baseAttemptWhere,
          status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.GRADED] },
        },
      }),
    ]);

    return {
      total_assessments: totalAssessments,
      published_assessments: publishedAssessments,
      total_attempts: totalAttempts,
      completed_attempts: completedAttempts,
    };
  }

  private async fetchRecentAssessments(
    tenantId: string,
    teacherId: string,
  ): Promise<RecentAssessmentItem[]> {
    const assessments = await this.prisma.assessment.findMany({
      where: {
        tenant_id: tenantId,
        created_by_id: teacherId,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        classroom: { select: { name: true } },
        _count: { select: { assessment_attempts: true } },
      },
    });

    return assessments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      status: a.status,
      classroom_name: a.classroom.name,
      created_at: a.created_at,
      attempt_count: a._count.assessment_attempts,
    }));
  }
}
