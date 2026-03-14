import { Injectable, NotFoundException } from '@nestjs/common';
import { AttemptStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface StudentProfileEnrollment {
  id: string;
  section: { id: string; name: string };
  grade: { id: string; name: string };
  academic_year: { id: string; name: string; is_active: boolean };
  enrolled_at: Date;
  is_active: boolean;
}

export interface StudentProfileClassroom {
  id: string;
  name: string;
  subject: { id: string; name: string; code: string };
  teacher: { id: string; first_name: string; last_name: string; email: string };
  academic_year: { id: string; name: string };
}

export interface StudentProfileStats {
  total_attempts: number;
  completed_attempts: number;
  average_score_percentage: number | null;
}

export interface StudentProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  last_login_at: Date | null;
  created_at: Date;
  enrollments: StudentProfileEnrollment[];
  classrooms: StudentProfileClassroom[];
  stats: StudentProfileStats;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentProfile(
    tenantId: string,
    studentId: string,
  ): Promise<StudentProfile> {
    const user = await this.fetchUser(tenantId, studentId);

    const enrollments = await this.fetchActiveEnrollments(tenantId, studentId);

    const [classrooms, stats] = await Promise.all([
      this.fetchClassroomsForEnrollments(tenantId, enrollments),
      this.computeAssessmentStats(tenantId, studentId),
    ]);

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_verified: user.is_verified,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      enrollments,
      classrooms,
      stats,
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async fetchUser(tenantId: string, studentId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: studentId, tenant_id: tenantId, deleted_at: null },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_verified: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id "${studentId}" not found`);
    }

    return user;
  }

  private async fetchActiveEnrollments(
    tenantId: string,
    studentId: string,
  ): Promise<StudentProfileEnrollment[]> {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { tenant_id: tenantId, student_id: studentId, is_active: true },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            grade: { select: { id: true, name: true } },
          },
        },
        academic_year: { select: { id: true, name: true, is_active: true } },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    return enrollments.map((e) => ({
      id: e.id,
      section: { id: e.section.id, name: e.section.name },
      grade: { id: e.section.grade.id, name: e.section.grade.name },
      academic_year: {
        id: e.academic_year.id,
        name: e.academic_year.name,
        is_active: e.academic_year.is_active,
      },
      enrolled_at: e.enrolled_at,
      is_active: e.is_active,
    }));
  }

  private async fetchClassroomsForEnrollments(
    tenantId: string,
    enrollments: StudentProfileEnrollment[],
  ): Promise<StudentProfileClassroom[]> {
    if (enrollments.length === 0) return [];

    const sectionIds = [...new Set(enrollments.map((e) => e.section.id))];

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        tenant_id: tenantId,
        section_id: { in: sectionIds },
        deleted_at: null,
        is_active: true,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        academic_year: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      subject: { id: c.subject.id, name: c.subject.name, code: c.subject.code },
      teacher: {
        id: c.teacher.id,
        first_name: c.teacher.first_name,
        last_name: c.teacher.last_name,
        email: c.teacher.email,
      },
      academic_year: { id: c.academic_year.id, name: c.academic_year.name },
    }));
  }

  private async computeAssessmentStats(
    tenantId: string,
    studentId: string,
  ): Promise<StudentProfileStats> {
    const completedStatuses = [AttemptStatus.SUBMITTED, AttemptStatus.GRADED];
    const baseWhere = { tenant_id: tenantId, student_id: studentId };

    const [totalAttempts, completedAttempts, scoredAttempts] =
      await Promise.all([
        this.prisma.assessmentAttempt.count({ where: baseWhere }),
        this.prisma.assessmentAttempt.count({
          where: { ...baseWhere, status: { in: completedStatuses } },
        }),
        this.prisma.assessmentAttempt.findMany({
          where: {
            ...baseWhere,
            status: { in: completedStatuses },
            score: { not: null },
          },
          select: { score: true, total_marks: true },
        }),
      ]);

    const averageScorePercentage = this.computeAverageScore(scoredAttempts);

    return {
      total_attempts: totalAttempts,
      completed_attempts: completedAttempts,
      average_score_percentage: averageScorePercentage,
    };
  }

  private computeAverageScore(
    attempts: Array<{ score: number | null; total_marks: number }>,
  ): number | null {
    const validAttempts = attempts.filter(
      (a) => a.score !== null && a.total_marks > 0,
    );

    if (validAttempts.length === 0) return null;

    const totalPercentage = validAttempts.reduce(
      (sum, a) => sum + (a.score! / a.total_marks) * 100,
      0,
    );

    return Math.round((totalPercentage / validAttempts.length) * 100) / 100;
  }
}
