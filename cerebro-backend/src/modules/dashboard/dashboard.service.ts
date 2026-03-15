import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BloomLevel } from '@prisma/client';
import {
  ClassroomsService,
  TeacherDashboardStats,
} from '../classrooms/classrooms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import {
  buildClassroomAnalyticsPrompt,
  type ClassroomAnalyticsPromptContext,
} from '../ai/prompts/classroom-analytics.prompt';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly classroomsService: ClassroomsService,
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly configService: ConfigService,
  ) {}

  getTeacherDashboard(
    tenantId: string,
    teacherId: string,
  ): Promise<TeacherDashboardStats> {
    return this.classroomsService.getTeacherDashboardStats(tenantId, teacherId);
  }

  async getSuperAdminDashboard() {
    const [tenantCount, userCount, invoiceStats] = await Promise.all([
      this.prisma.tenant.count({ where: { deleted_at: null } }),
      this.prisma.user.count({
        where: { deleted_at: null, role: { in: ['TEACHER', 'STUDENT'] } },
      }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
    ]);
    const pendingInvoices = await this.prisma.invoice.count({
      where: { status: 'PENDING' },
    });
    return {
      total_tenants: tenantCount,
      total_users: userCount,
      total_revenue: Number(invoiceStats._sum.amount ?? 0),
      pending_invoices: pendingInvoices,
      ai_usage_percentage: 68,
    };
  }

  // ── Classroom Analytics ────────────────────────────────────

  async getClassroomAnalytics(tenantId: string, classroomId: string) {
    const cached = await this.prisma.classroomAnalyticsCache.findUnique({
      where: {
        uq_classroom_analytics_tenant_classroom: {
          tenant_id: tenantId,
          classroom_id: classroomId,
        },
      },
    });

    return {
      analytics: cached ? (cached.analytics as any) : null,
      generated_at: cached?.generated_at ?? null,
    };
  }

  async generateClassroomAnalytics(
    tenantId: string,
    classroomId: string,
    teacherId: string,
  ) {
    const ctx = await this.buildClassroomAnalyticsContext(tenantId, classroomId);

    const prompt = buildClassroomAnalyticsPrompt(ctx);
    const model =
      this.configService.get<string>('AI_HINT_MODEL') ?? 'gemini-2.5-flash';

    const aiResponse = await this.geminiService.sendMessage({
      model,
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      feature: 'classroom_analytics',
      tenantId,
      userId: teacherId,
      temperature: 0.5,
      maxTokens: 1500,
    });

    const analytics = this.parseAnalyticsResponse(aiResponse.content, ctx, classroomId);

    await this.prisma.classroomAnalyticsCache.upsert({
      where: {
        uq_classroom_analytics_tenant_classroom: {
          tenant_id: tenantId,
          classroom_id: classroomId,
        },
      },
      update: {
        analytics,
        generated_by_id: teacherId,
        generated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        classroom_id: classroomId,
        generated_by_id: teacherId,
        analytics,
      },
    });

    return {
      analytics,
      generated_at: new Date().toISOString(),
    };
  }

  async getTeacherClassroomsWithAnalytics(tenantId: string, teacherId: string) {
    const classrooms = await this.prisma.classroom.findMany({
      where: {
        tenant_id: tenantId,
        teacher_id: teacherId,
        deleted_at: null,
        is_active: true,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        academic_year: { select: { id: true, name: true } },
        classroom_analytics_cache: {
          select: {
            analytics: true,
            generated_at: true,
          },
        },
        _count: { select: { assessments: true, student_milestones: true } },
      },
      orderBy: { name: 'asc' },
    });

    const studentCounts = await this.fetchStudentCounts(tenantId, classrooms);
    const countMap = new Map(
      studentCounts.map((s) => [s.classroomId, s.count]),
    );

    return classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      section: c.section,
      academic_year: c.academic_year,
      student_count: countMap.get(c.id) ?? 0,
      assessment_count: c._count.assessments,
      milestone_count: c._count.student_milestones,
      analytics: c.classroom_analytics_cache[0]?.analytics ?? null,
      analytics_generated_at: c.classroom_analytics_cache[0]?.generated_at ?? null,
    }));
  }

  private async fetchStudentCounts(
    tenantId: string,
    classrooms: Array<{
      id: string;
      section_id: string;
      academic_year_id: string;
    }>,
  ) {
    return Promise.all(
      classrooms.map(async (c) => {
        const count = await this.prisma.studentEnrollment.count({
          where: {
            tenant_id: tenantId,
            section_id: c.section_id,
            academic_year_id: c.academic_year_id,
            is_active: true,
          },
        });
        return { classroomId: c.id, count };
      }),
    );
  }

  private parseAnalyticsResponse(
    content: string,
    ctx: ClassroomAnalyticsPromptContext,
    classroomId: string,
  ): any {
    try {
      return JSON.parse(content);
    } catch {
      this.logger.error(
        `Failed to parse classroom analytics JSON for classroom ${classroomId}`,
      );
      return this.buildFallbackAnalytics(ctx);
    }
  }

  private buildFallbackAnalytics(ctx: ClassroomAnalyticsPromptContext): any {
    return {
      summary:
        'Analytics data has been gathered. AI analysis is temporarily unavailable.',
      bloom_profile: {
        dominant_level: 'REMEMBER',
        class_orientation: 'balanced',
        orientation_description:
          'Insufficient data to determine class orientation.',
      },
      performance_insights: {
        average_score_pct: ctx.overallMetrics.overallAvgScorePct ?? 0,
        pass_rate_pct: ctx.overallMetrics.overallPassRate ?? 0,
        needs_attention: (ctx.overallMetrics.overallAvgScorePct ?? 0) < 50,
      },
      strengths: [],
      areas_for_improvement: [],
      recommendations: [
        'Review current assessment data and try generating analytics again.',
      ],
    };
  }

  private async buildClassroomAnalyticsContext(
    tenantId: string,
    classroomId: string,
  ): Promise<ClassroomAnalyticsPromptContext> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
      include: {
        subject: { select: { name: true } },
        section: { select: { id: true, name: true } },
        academic_year: { select: { id: true } },
      },
    });

    if (!classroom) {
      throw new Error('Classroom not found');
    }

    const [studentCount, assessments, milestones] = await Promise.all([
      this.prisma.studentEnrollment.count({
        where: {
          tenant_id: tenantId,
          section_id: classroom.section_id,
          academic_year_id: classroom.academic_year_id,
          is_active: true,
        },
      }),
      this.fetchAssessmentsWithAttempts(tenantId, classroomId),
      this.prisma.studentMilestone.findMany({
        where: {
          tenant_id: tenantId,
          classroom_id: classroomId,
          deleted_at: null,
        },
        select: { completion_pct: true },
      }),
    ]);

    const assessmentData = this.computeAssessmentData(assessments);
    const overallMetrics = this.computeOverallMetrics(assessments, assessmentData);
    const bloomDistribution = await this.computeBloomDistribution(
      tenantId,
      assessments.map((a) => a.id),
    );
    const milestoneMetrics = this.computeMilestoneMetrics(milestones);

    return {
      classroomName: classroom.name,
      subjectName: classroom.subject?.name ?? 'Unknown',
      totalStudents: studentCount,
      assessments: assessmentData,
      overallMetrics,
      bloomDistribution,
      milestoneMetrics,
    };
  }

  private async fetchAssessmentsWithAttempts(
    tenantId: string,
    classroomId: string,
  ) {
    return this.prisma.assessment.findMany({
      where: {
        tenant_id: tenantId,
        classroom_id: classroomId,
        deleted_at: null,
        status: { in: ['PUBLISHED', 'CLOSED'] },
      },
      include: {
        assessment_attempts: {
          where: { status: { in: ['SUBMITTED', 'GRADED'] } },
          select: { score: true, total_marks: true },
        },
      },
    });
  }

  private computeAssessmentData(
    assessments: Array<{
      title: string;
      type: string;
      assessment_attempts: Array<{ score: number | null; total_marks: number }>;
    }>,
  ) {
    const PASS_THRESHOLD = 50;

    return assessments.map((a) => {
      const scores = a.assessment_attempts
        .filter((att) => att.score !== null && att.total_marks > 0)
        .map((att) => ((att.score ?? 0) / att.total_marks) * 100);

      return {
        title: a.title,
        type: a.type,
        totalAttempts: a.assessment_attempts.length,
        avgScorePct:
          scores.length > 0
            ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
            : null,
        passRate:
          scores.length > 0
            ? Math.round(
                (scores.filter((s) => s >= PASS_THRESHOLD).length /
                  scores.length) *
                  100,
              )
            : null,
      };
    });
  }

  private computeOverallMetrics(
    assessments: Array<{
      assessment_attempts: Array<{ score: number | null; total_marks: number }>;
    }>,
    assessmentData: Array<{ totalAttempts: number }>,
  ) {
    const PASS_THRESHOLD = 50;
    const totalAttempts = assessmentData.reduce(
      (s, a) => s + a.totalAttempts,
      0,
    );
    const allAttemptScores = assessments.flatMap((a) =>
      a.assessment_attempts
        .filter((att) => att.score !== null && att.total_marks > 0)
        .map((att) => ((att.score ?? 0) / att.total_marks) * 100),
    );

    return {
      totalAssessments: assessments.length,
      totalAttempts,
      overallAvgScorePct:
        allAttemptScores.length > 0
          ? Math.round(
              allAttemptScores.reduce((s, v) => s + v, 0) /
                allAttemptScores.length,
            )
          : null,
      overallPassRate:
        allAttemptScores.length > 0
          ? Math.round(
              (allAttemptScores.filter((s) => s >= PASS_THRESHOLD).length /
                allAttemptScores.length) *
                100,
            )
          : null,
    };
  }

  private async computeBloomDistribution(
    tenantId: string,
    assessmentIds: string[],
  ): Promise<
    Array<{
      level: string;
      totalQuestions: number;
      correctAnswers: number;
      accuracyPct: number;
    }>
  > {
    if (assessmentIds.length === 0) return [];

    const responses = await this.prisma.attemptResponse.findMany({
      where: {
        tenant_id: tenantId,
        attempt: {
          assessment_id: { in: assessmentIds },
          status: { in: ['SUBMITTED', 'GRADED'] },
        },
      },
      select: {
        is_correct: true,
        question: { select: { bloom_level: true } },
      },
    });

    const bloomMap = new Map<string, { total: number; correct: number }>();
    for (const level of Object.values(BloomLevel)) {
      bloomMap.set(level, { total: 0, correct: 0 });
    }

    for (const r of responses) {
      const level = r.question.bloom_level;
      const entry = bloomMap.get(level)!;
      entry.total += 1;
      if (r.is_correct === true) entry.correct += 1;
    }

    return Array.from(bloomMap.entries()).map(([level, data]) => ({
      level,
      totalQuestions: data.total,
      correctAnswers: data.correct,
      accuracyPct:
        data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));
  }

  private computeMilestoneMetrics(
    milestones: Array<{ completion_pct: number }>,
  ) {
    return {
      totalMilestones: milestones.length,
      avgCompletionPct:
        milestones.length > 0
          ? Math.round(
              milestones.reduce((s, m) => s + m.completion_pct, 0) /
                milestones.length,
            )
          : 0,
    };
  }
}
