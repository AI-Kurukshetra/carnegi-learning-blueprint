import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KnowledgeStatesService {
  constructor(private readonly prisma: PrismaService) {}

  findMyKnowledgeStates(tenantId: string, studentId: string) {
    return this.prisma.knowledgeState.findMany({
      where: { tenant_id: tenantId, student_id: studentId },
      include: {
        learning_objective: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  findByStudent(tenantId: string, studentId: string) {
    return this.prisma.knowledgeState.findMany({
      where: { tenant_id: tenantId, student_id: studentId },
      include: {
        learning_objective: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async findByClassroom(tenantId: string, classroomId: string) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
    });
    if (!classroom) {
      throw new NotFoundException(`Classroom with id "${classroomId}" not found`);
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        tenant_id: tenantId,
        section_id: classroom.section_id,
        academic_year_id: classroom.academic_year_id,
        is_active: true,
      },
      select: { student_id: true },
    });
    const studentIds = enrollments.map((enrollment) => enrollment.student_id);

    if (studentIds.length === 0) {
      return [];
    }

    return this.prisma.knowledgeState.findMany({
      where: {
        tenant_id: tenantId,
        student_id: { in: studentIds },
      },
      include: {
        learning_objective: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  }
}

