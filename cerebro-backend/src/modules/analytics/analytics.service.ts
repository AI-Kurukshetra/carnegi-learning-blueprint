import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssessmentAnalytics(tenantId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, tenant_id: tenantId, deleted_at: null },
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment with id "${assessmentId}" not found`);
    }

    const [totalAttempts, submittedAttempts, averageScore, attemptsByStatus] =
      await Promise.all([
        this.prisma.assessmentAttempt.count({
          where: { tenant_id: tenantId, assessment_id: assessmentId },
        }),
        this.prisma.assessmentAttempt.count({
          where: {
            tenant_id: tenantId,
            assessment_id: assessmentId,
            status: 'SUBMITTED',
          },
        }),
        this.prisma.assessmentAttempt.aggregate({
          where: { tenant_id: tenantId, assessment_id: assessmentId },
          _avg: { score: true },
        }),
        this.prisma.assessmentAttempt.groupBy({
          by: ['status'],
          where: { tenant_id: tenantId, assessment_id: assessmentId },
          _count: { _all: true },
        }),
      ]);

    return {
      assessment_id: assessmentId,
      total_attempts: totalAttempts,
      submitted_attempts: submittedAttempts,
      average_score: averageScore._avg.score ?? 0,
      attempts_by_status: attemptsByStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
    };
  }

  async getClassroomAnalytics(tenantId: string, classroomId: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
    });
    if (!classroom) {
      throw new NotFoundException(`Classroom with id "${classroomId}" not found`);
    }

    const [assessmentsCount, studentsCount, attemptsAggregate] = await Promise.all([
      this.prisma.assessment.count({
        where: { tenant_id: tenantId, classroom_id: classroomId, deleted_at: null },
      }),
      this.prisma.studentEnrollment.count({
        where: {
          tenant_id: tenantId,
          section_id: classroom.section_id,
          academic_year_id: classroom.academic_year_id,
          is_active: true,
        },
      }),
      this.prisma.assessmentAttempt.aggregate({
        where: {
          tenant_id: tenantId,
          assessment: {
            classroom_id: classroomId,
            deleted_at: null,
          },
        },
        _avg: { score: true },
        _count: { _all: true },
      }),
    ]);

    return {
      classroom_id: classroomId,
      assessments_count: assessmentsCount,
      students_count: studentsCount,
      attempts_count: attemptsAggregate._count._all,
      average_score: attemptsAggregate._avg.score ?? 0,
    };
  }

  async getStudentAnalytics(tenantId: string, studentId: string) {
    const [attempts, knowledgeStateAggregate, telemetryCount] = await Promise.all([
      this.prisma.assessmentAttempt.aggregate({
        where: { tenant_id: tenantId, student_id: studentId },
        _count: { _all: true },
        _avg: { score: true },
      }),
      this.prisma.knowledgeState.aggregate({
        where: { tenant_id: tenantId, student_id: studentId },
        _avg: { mastery_score: true, confidence: true },
      }),
      this.prisma.telemetryEvent.count({
        where: { tenant_id: tenantId, student_id: studentId },
      }),
    ]);

    return {
      student_id: studentId,
      attempts_count: attempts._count._all,
      average_score: attempts._avg.score ?? 0,
      average_mastery_score: knowledgeStateAggregate._avg.mastery_score ?? 0,
      average_confidence: knowledgeStateAggregate._avg.confidence ?? 0,
      telemetry_events: telemetryCount,
    };
  }

  async getSchoolOverview(tenantId: string) {
    const [
      usersCount,
      classroomsCount,
      subjectsCount,
      assessmentsCount,
      attemptsCount,
      activeAcademicYearCount,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { tenant_id: tenantId, deleted_at: null, is_active: true },
      }),
      this.prisma.classroom.count({
        where: { tenant_id: tenantId, deleted_at: null },
      }),
      this.prisma.subject.count({
        where: { tenant_id: tenantId, deleted_at: null },
      }),
      this.prisma.assessment.count({
        where: { tenant_id: tenantId, deleted_at: null },
      }),
      this.prisma.assessmentAttempt.count({
        where: { tenant_id: tenantId },
      }),
      this.prisma.academicYear.count({
        where: { tenant_id: tenantId, deleted_at: null, is_active: true },
      }),
    ]);

    return {
      users_count: usersCount,
      classrooms_count: classroomsCount,
      subjects_count: subjectsCount,
      assessments_count: assessmentsCount,
      attempts_count: attemptsCount,
      active_academic_years: activeAcademicYearCount,
    };
  }
}

