import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentInfo, SafeUser, toSafeUser } from './users.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

const BCRYPT_ROUNDS = 10;

export interface PaginatedUsersResponse {
  data: SafeUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    tenantId: string,
    query: ListUsersDto,
  ): Promise<PaginatedUsersResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.usersRepository.findAll(tenantId, {
      role: query.role,
      page,
      limit,
    });

    const safeUsers = data.map(toSafeUser);
    const enriched = await this.enrichUsersWithClassrooms(tenantId, safeUsers);

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(tenantId: string, id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findById(tenantId, id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const safeUser = toSafeUser(user);

    if (user.role === Role.STUDENT) {
      safeUser.enrollment = await this.findActiveEnrollment(tenantId, id);
    }

    if (user.role === Role.TEACHER) {
      safeUser.classroom_name = await this.findTeacherClassroomNames(
        tenantId,
        id,
      );
    }

    return safeUser;
  }

  async create(tenantId: string, dto: CreateUserDto): Promise<SafeUser> {
    const existing = await this.usersRepository.findByEmail(
      tenantId,
      dto.email,
    );
    if (existing) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists in this tenant`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersRepository.create({
      tenantId,
      email: dto.email,
      passwordHash,
      role: dto.role,
      firstName: dto.first_name,
      lastName: dto.last_name,
    });

    const safeUser = toSafeUser(user);

    if (dto.role === Role.STUDENT && dto.classroom_id) {
      safeUser.enrollment = await this.enrollStudentInClassroom(
        tenantId,
        user.id,
        dto.classroom_id,
      );
    } else if (dto.role === Role.TEACHER && dto.classroom_id) {
      safeUser.classroom_name = await this.assignTeacherToClassroom(
        tenantId,
        user.id,
        dto.classroom_id,
      );
    }

    return safeUser;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<SafeUser> {
    const existingUser = await this.findById(tenantId, id);

    const updateData: Record<string, unknown> = {};

    if (dto.first_name !== undefined) updateData['first_name'] = dto.first_name;
    if (dto.last_name !== undefined) updateData['last_name'] = dto.last_name;
    if (dto.role !== undefined) updateData['role'] = dto.role;
    if (dto.email !== undefined) {
      const emailTaken = await this.usersRepository.findByEmail(
        tenantId,
        dto.email,
      );
      if (emailTaken && emailTaken.id !== id) {
        throw new ConflictException(
          `Email "${dto.email}" is already in use`,
        );
      }
      updateData['email'] = dto.email;
    }
    if (dto.password !== undefined) {
      updateData['password_hash'] = await bcrypt.hash(
        dto.password,
        BCRYPT_ROUNDS,
      );
    }

    const updated = await this.usersRepository.update(tenantId, id, updateData);
    const safeUser = toSafeUser(updated);

    const effectiveRole = (dto.role ?? existingUser.role) as Role;
    if (effectiveRole === Role.STUDENT && dto.classroom_id) {
      safeUser.enrollment = await this.reassignStudentClassroom(
        tenantId,
        id,
        dto.classroom_id,
      );
    } else if (effectiveRole === Role.STUDENT) {
      safeUser.enrollment = await this.findActiveEnrollment(tenantId, id);
    } else if (effectiveRole === Role.TEACHER && dto.classroom_id) {
      safeUser.classroom_name = await this.assignTeacherToClassroom(
        tenantId,
        id,
        dto.classroom_id,
      );
    } else if (effectiveRole === Role.TEACHER) {
      safeUser.classroom_name = await this.findTeacherClassroomNames(
        tenantId,
        id,
      );
    }

    return safeUser;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);
    await this.usersRepository.softDelete(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // Private classroom enrichment helpers
  // ---------------------------------------------------------------------------

  private async enrichUsersWithClassrooms(
    tenantId: string,
    users: SafeUser[],
  ): Promise<SafeUser[]> {
    const studentIds = users
      .filter((u) => u.role === 'STUDENT')
      .map((u) => u.id);
    const teacherIds = users
      .filter((u) => u.role === 'TEACHER')
      .map((u) => u.id);

    const studentClassroomMap = await this.buildStudentClassroomMap(
      tenantId,
      studentIds,
    );
    const teacherClassroomMap = await this.buildTeacherClassroomMap(
      tenantId,
      teacherIds,
    );

    return users.map((u) => {
      if (u.role === 'STUDENT') {
        return { ...u, classroom_name: studentClassroomMap.get(u.id) };
      }
      if (u.role === 'TEACHER') {
        return { ...u, classroom_name: teacherClassroomMap.get(u.id) };
      }
      return u;
    });
  }

  private async buildStudentClassroomMap(
    tenantId: string,
    studentIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (studentIds.length === 0) return map;

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { tenant_id: tenantId, student_id: { in: studentIds }, is_active: true },
      select: {
        student_id: true,
        section: {
          select: {
            classrooms: {
              where: { deleted_at: null, is_active: true },
              select: { name: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    for (const enrollment of enrollments) {
      if (map.has(enrollment.student_id)) continue;
      const classroomName = enrollment.section.classrooms[0]?.name;
      if (classroomName) {
        map.set(enrollment.student_id, classroomName);
      }
    }

    return map;
  }

  private async buildTeacherClassroomMap(
    tenantId: string,
    teacherIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (teacherIds.length === 0) return map;

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        tenant_id: tenantId,
        teacher_id: { in: teacherIds },
        deleted_at: null,
        is_active: true,
      },
      select: { teacher_id: true, name: true },
      orderBy: { name: 'asc' },
    });

    for (const classroom of classrooms) {
      const existing = map.get(classroom.teacher_id);
      map.set(
        classroom.teacher_id,
        existing ? `${existing}, ${classroom.name}` : classroom.name,
      );
    }

    return map;
  }

  private async findTeacherClassroomNames(
    tenantId: string,
    teacherId: string,
  ): Promise<string | undefined> {
    const map = await this.buildTeacherClassroomMap(tenantId, [teacherId]);
    return map.get(teacherId);
  }

  private async assignTeacherToClassroom(
    tenantId: string,
    teacherId: string,
    classroomId: string,
  ): Promise<string> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!classroom) {
      throw new NotFoundException(
        `Classroom with id "${classroomId}" not found`,
      );
    }

    await this.prisma.classroom.update({
      where: { id: classroomId },
      data: { teacher_id: teacherId },
    });

    return classroom.name;
  }

  // ---------------------------------------------------------------------------
  // Private enrollment helpers
  // ---------------------------------------------------------------------------

  private async resolveClassroom(
    tenantId: string,
    classroomId: string,
  ): Promise<{ section_id: string; academic_year_id: string }> {
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
      select: { section_id: true, academic_year_id: true },
    });
    if (!classroom) {
      throw new NotFoundException(
        `Classroom with id "${classroomId}" not found`,
      );
    }
    return classroom;
  }

  private async findActiveEnrollment(
    tenantId: string,
    studentId: string,
  ): Promise<EnrollmentInfo | undefined> {
    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: { tenant_id: tenantId, student_id: studentId, is_active: true },
      orderBy: { enrolled_at: 'desc' },
    });
    if (!enrollment) return undefined;

    return {
      enrollment_id: enrollment.id,
      section_id: enrollment.section_id,
      academic_year_id: enrollment.academic_year_id,
      is_active: enrollment.is_active,
      enrolled_at: enrollment.enrolled_at,
    };
  }

  private async enrollStudentInClassroom(
    tenantId: string,
    studentId: string,
    classroomId: string,
  ): Promise<EnrollmentInfo> {
    const { section_id, academic_year_id } = await this.resolveClassroom(
      tenantId,
      classroomId,
    );

    const enrollment = await this.prisma.studentEnrollment.upsert({
      where: {
        uq_enrollments_tenant_student_section_year: {
          tenant_id: tenantId,
          student_id: studentId,
          section_id,
          academic_year_id,
        },
      },
      update: { is_active: true },
      create: {
        tenant_id: tenantId,
        student_id: studentId,
        section_id,
        academic_year_id,
      },
    });

    return {
      enrollment_id: enrollment.id,
      section_id: enrollment.section_id,
      academic_year_id: enrollment.academic_year_id,
      is_active: enrollment.is_active,
      enrolled_at: enrollment.enrolled_at,
    };
  }

  private async reassignStudentClassroom(
    tenantId: string,
    studentId: string,
    classroomId: string,
  ): Promise<EnrollmentInfo> {
    const { section_id, academic_year_id } = await this.resolveClassroom(
      tenantId,
      classroomId,
    );

    const currentEnrollment = await this.prisma.studentEnrollment.findFirst({
      where: {
        tenant_id: tenantId,
        student_id: studentId,
        academic_year_id,
        is_active: true,
      },
    });

    const isSameSection = currentEnrollment?.section_id === section_id;

    if (currentEnrollment && !isSameSection) {
      await this.prisma.studentEnrollment.update({
        where: { id: currentEnrollment.id },
        data: { is_active: false },
      });
    }

    return this.enrollStudentInClassroom(tenantId, studentId, classroomId);
  }
}
