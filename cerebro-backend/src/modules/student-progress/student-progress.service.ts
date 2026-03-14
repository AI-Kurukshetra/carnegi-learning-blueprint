import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilestoneStatus } from '@prisma/client';
import { GeminiService } from '../ai/gemini.service';
import { buildStudentInsightPrompt } from '../ai/prompts/student-insight.prompt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { CreateMilestoneTaskDto } from './dto/create-milestone-task.dto';
import { ReviewMilestoneTaskDto } from './dto/review-milestone-task.dto';

@Injectable()
export class StudentProgressService {
  private readonly logger = new Logger(StudentProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly configService: ConfigService,
  ) {}

  // ── Milestones CRUD ───────────────────────────────────────

  async createMilestone(
    tenantId: string,
    classroomId: string,
    studentId: string,
    createdById: string,
    dto: CreateMilestoneDto,
  ) {
    await this.verifyClassroomOwnership(tenantId, classroomId, createdById);
    await this.verifyStudentEnrollment(tenantId, classroomId, studentId);

    return this.prisma.studentMilestone.create({
      data: {
        tenant_id: tenantId,
        classroom_id: classroomId,
        student_id: studentId,
        created_by_id: createdById,
        title: dto.title,
        description: dto.description ?? null,
        due_date: dto.due_date ? new Date(dto.due_date) : null,
      },
    });
  }

  async listMilestones(
    tenantId: string,
    classroomId: string,
    studentId: string,
  ) {
    return this.prisma.studentMilestone.findMany({
      where: {
        tenant_id: tenantId,
        classroom_id: classroomId,
        student_id: studentId,
        deleted_at: null,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async updateMilestone(
    tenantId: string,
    milestoneId: string,
    teacherId: string,
    dto: UpdateMilestoneDto,
  ) {
    const milestone = await this.prisma.studentMilestone.findFirst({
      where: { id: milestoneId, tenant_id: tenantId, deleted_at: null },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    await this.verifyClassroomOwnership(
      tenantId,
      milestone.classroom_id,
      teacherId,
    );

    const completedAt =
      dto.status === MilestoneStatus.COMPLETED
        ? new Date()
        : dto.status !== undefined
          ? null
          : undefined;

    return this.prisma.studentMilestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.due_date !== undefined
          ? { due_date: dto.due_date ? new Date(dto.due_date) : null }
          : {}),
        ...(completedAt !== undefined ? { completed_at: completedAt } : {}),
      },
    });
  }

  async deleteMilestone(
    tenantId: string,
    milestoneId: string,
    teacherId: string,
  ) {
    const milestone = await this.prisma.studentMilestone.findFirst({
      where: { id: milestoneId, tenant_id: tenantId, deleted_at: null },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    await this.verifyClassroomOwnership(
      tenantId,
      milestone.classroom_id,
      teacherId,
    );

    await this.prisma.studentMilestone.update({
      where: { id: milestoneId },
      data: { deleted_at: new Date() },
    });
  }

  // ── Student Progress (Teacher View) ───────────────────────

  async getStudentProgress(
    tenantId: string,
    classroomId: string,
    studentId: string,
  ) {
    const [student, attempts, milestones] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: studentId, tenant_id: tenantId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          created_at: true,
        },
      }),
      this.prisma.assessmentAttempt.findMany({
        where: {
          tenant_id: tenantId,
          student_id: studentId,
          assessment: { classroom_id: classroomId, deleted_at: null },
        },
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              type: true,
              is_adaptive: true,
            },
          },
        },
        orderBy: { started_at: 'desc' },
      }),
      this.prisma.studentMilestone.findMany({
        where: {
          tenant_id: tenantId,
          classroom_id: classroomId,
          student_id: studentId,
          deleted_at: null,
        },
        include: {
          tasks: {
            orderBy: { created_at: 'asc' },
            include: {
              reviewed_by: { select: { first_name: true, last_name: true } },
            },
          },
        },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Assessment summary
    const submitted = attempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'GRADED',
    );
    const scores = submitted
      .filter((a) => a.score !== null && a.total_marks > 0)
      .map((a) => ((a.score ?? 0) / a.total_marks) * 100);

    const assessmentSummary = {
      total_taken: attempts.length,
      total_submitted: submitted.length,
      average_score_pct:
        scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : null,
      highest_score_pct: scores.length > 0 ? Math.round(Math.max(...scores)) : null,
      lowest_score_pct: scores.length > 0 ? Math.round(Math.min(...scores)) : null,
    };

    // Milestone summary
    const milestoneSummary = {
      total: milestones.length,
      completed: milestones.filter((m) => m.status === 'COMPLETED').length,
      in_progress: milestones.filter((m) => m.status === 'IN_PROGRESS').length,
      not_started: milestones.filter((m) => m.status === 'NOT_STARTED').length,
    };

    return {
      student,
      assessments: {
        data: attempts.map((a) => ({
          attempt_id: a.id,
          assessment_id: a.assessment.id,
          assessment_title: a.assessment.title,
          assessment_type: a.assessment.type,
          is_adaptive: a.assessment.is_adaptive,
          status: a.status,
          score: a.score,
          total_marks: a.total_marks,
          score_pct:
            a.score !== null && a.total_marks > 0
              ? Math.round((a.score / a.total_marks) * 100)
              : null,
          started_at: a.started_at,
          submitted_at: a.submitted_at,
        })),
        summary: assessmentSummary,
      },
      milestones: {
        data: milestones,
        summary: milestoneSummary,
      },
    };
  }

  // ── AI Student Insight ────────────────────────────────────

  async getStudentInsight(
    tenantId: string,
    classroomId: string,
    studentId: string,
  ) {
    const progressData = await this.getStudentProgress(
      tenantId,
      classroomId,
      studentId,
    );

    const cached = await this.prisma.studentInsightCache.findUnique({
      where: {
        uq_insight_cache_tenant_classroom_student: {
          tenant_id: tenantId,
          classroom_id: classroomId,
          student_id: studentId,
        },
      },
    });

    return {
      student: progressData.student,
      assessments: progressData.assessments,
      milestones: progressData.milestones,
      insight: cached ? (cached.insight as any) : null,
      generated_at: cached?.generated_at ?? null,
    };
  }

  async generateStudentInsight(
    tenantId: string,
    classroomId: string,
    studentId: string,
    teacherId: string,
  ) {
    const progressData = await this.getStudentProgress(
      tenantId,
      classroomId,
      studentId,
    );

    const prompt = buildStudentInsightPrompt(
      this.buildInsightPromptContext(progressData),
    );

    const model =
      this.configService.get<string>('AI_HINT_MODEL') ?? 'gemini-2.5-flash';

    const aiResponse = await this.geminiService.sendMessage({
      model,
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      feature: 'student_insight',
      tenantId,
      userId: teacherId,
      temperature: 0.5,
      maxTokens: 1024,
    });

    const insight = this.parseInsightResponse(aiResponse.content, progressData.student);

    await this.prisma.studentInsightCache.upsert({
      where: {
        uq_insight_cache_tenant_classroom_student: {
          tenant_id: tenantId,
          classroom_id: classroomId,
          student_id: studentId,
        },
      },
      update: {
        insight: insight as any,
        generated_by_id: teacherId,
        generated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        classroom_id: classroomId,
        student_id: studentId,
        generated_by_id: teacherId,
        insight: insight as any,
      },
    });

    return {
      student: progressData.student,
      assessments: progressData.assessments,
      milestones: progressData.milestones,
      insight,
      generated_at: new Date().toISOString(),
    };
  }

  private buildInsightPromptContext(
    progressData: Awaited<ReturnType<typeof this.getStudentProgress>>,
  ) {
    const { student, assessments, milestones } = progressData;
    const studentName = [student.first_name, student.last_name]
      .filter(Boolean)
      .join(' ') || student.email;

    const completionPct =
      milestones.summary.total > 0
        ? Math.round(
            (milestones.summary.completed / milestones.summary.total) * 100,
          )
        : 0;

    return {
      studentName,
      assessments: assessments.data.map((a) => ({
        title: a.assessment_title,
        type: a.assessment_type,
        scorePct: a.score_pct,
        status: a.status,
      })),
      assessmentSummary: assessments.summary,
      milestones: milestones.data.map((m) => ({
        title: m.title,
        status: m.status,
        due_date: m.due_date,
      })),
      milestoneSummary: milestones.summary,
      milestoneCompletionPct: completionPct,
    };
  }

  private parseInsightResponse(
    content: string,
    student: { first_name: string | null; last_name: string | null; email: string },
  ) {
    try {
      return JSON.parse(content) as {
        summary: string;
        strengths: string[];
        areas_for_improvement: string[];
        recommended_next_milestone: { title: string; description: string };
      };
    } catch {
      const studentName = [student.first_name, student.last_name]
        .filter(Boolean)
        .join(' ') || student.email;
      this.logger.error(
        `Failed to parse AI insight JSON for student "${studentName}"`,
      );
      return {
        summary: `Progress data for ${studentName} has been retrieved. AI analysis is temporarily unavailable.`,
        strengths: [],
        areas_for_improvement: [],
        recommended_next_milestone: {
          title: 'Review current progress',
          description:
            'Continue working through current assignments and check in with the teacher for personalised guidance.',
        },
      };
    }
  }

  // ── Student's Own Milestones ──────────────────────────────

  async getMyMilestones(tenantId: string, studentId: string) {
    return this.prisma.studentMilestone.findMany({
      where: {
        tenant_id: tenantId,
        student_id: studentId,
        deleted_at: null,
      },
      include: {
        classroom: {
          select: { name: true, subject: { select: { name: true } } },
        },
        created_by: {
          select: { first_name: true, last_name: true },
        },
        tasks: {
          orderBy: { created_at: 'asc' },
          include: {
            reviewed_by: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── Milestone Tasks ───────────────────────────────────────

  async createMilestoneTask(
    tenantId: string,
    milestoneId: string,
    studentId: string,
    dto: CreateMilestoneTaskDto,
  ) {
    const milestone = await this.prisma.studentMilestone.findFirst({
      where: {
        id: milestoneId,
        tenant_id: tenantId,
        student_id: studentId,
        deleted_at: null,
      },
    });
    if (!milestone) {
      throw new NotFoundException(
        'Milestone not found or does not belong to you',
      );
    }

    return this.prisma.milestoneTask.create({
      data: {
        tenant_id: tenantId,
        milestone_id: milestoneId,
        student_id: studentId,
        description: dto.description,
      },
    });
  }

  async listMilestoneTasks(tenantId: string, milestoneId: string) {
    return this.prisma.milestoneTask.findMany({
      where: { tenant_id: tenantId, milestone_id: milestoneId },
      include: {
        reviewed_by: { select: { first_name: true, last_name: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async reviewMilestoneTask(
    tenantId: string,
    taskId: string,
    teacherId: string,
    dto: ReviewMilestoneTaskDto,
  ) {
    const task = await this.prisma.milestoneTask.findFirst({
      where: { id: taskId, tenant_id: tenantId },
      include: { milestone: { select: { classroom_id: true } } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.verifyClassroomOwnership(
      tenantId,
      task.milestone.classroom_id,
      teacherId,
    );

    return this.prisma.milestoneTask.update({
      where: { id: taskId },
      data: {
        completion_pct: dto.completion_pct,
        teacher_comment: dto.teacher_comment ?? null,
        reviewed_by_id: teacherId,
        reviewed_at: new Date(),
      },
      include: {
        reviewed_by: { select: { first_name: true, last_name: true } },
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  private async verifyClassroomOwnership(
    tenantId: string,
    classroomId: string,
    teacherId: string,
  ) {
    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: classroomId,
        tenant_id: tenantId,
        deleted_at: null,
      },
      select: { teacher_id: true },
    });
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }
    if (classroom.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You are not the assigned teacher for this classroom',
      );
    }
  }

  private async verifyStudentEnrollment(
    tenantId: string,
    classroomId: string,
    studentId: string,
  ) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
      select: { section_id: true },
    });
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: {
        tenant_id: tenantId,
        student_id: studentId,
        section_id: classroom.section_id,
        is_active: true,
      },
    });
    if (!enrollment) {
      throw new NotFoundException(
        'Student is not enrolled in this classroom',
      );
    }
  }
}
