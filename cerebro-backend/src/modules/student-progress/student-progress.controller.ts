import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { CreateMilestoneTaskDto } from './dto/create-milestone-task.dto';
import { ReviewMilestoneTaskDto } from './dto/review-milestone-task.dto';
import { StudentProgressService } from './student-progress.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentProgressController {
  constructor(private readonly service: StudentProgressService) {}

  // ── Teacher: Student Progress ─────────────────────────────

  @Get('classrooms/:classroom_id/students/:student_id/progress')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  getStudentProgress(
    @TenantId() tenantId: string,
    @Param('classroom_id') classroomId: string,
    @Param('student_id') studentId: string,
  ) {
    return this.service.getStudentProgress(tenantId, classroomId, studentId);
  }

  @Get('classrooms/:classroom_id/students/:student_id/ai-insight')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  getStudentInsight(
    @TenantId() tenantId: string,
    @Param('classroom_id') classroomId: string,
    @Param('student_id') studentId: string,
  ) {
    return this.service.getStudentInsight(
      tenantId,
      classroomId,
      studentId,
    );
  }

  @Post('classrooms/:classroom_id/students/:student_id/ai-insight/generate')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  generateStudentInsight(
    @TenantId() tenantId: string,
    @Param('classroom_id') classroomId: string,
    @Param('student_id') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.generateStudentInsight(
      tenantId,
      classroomId,
      studentId,
      user.id,
    );
  }

  // ── Teacher: Milestone CRUD ───────────────────────────────

  @Post('classrooms/:classroom_id/students/:student_id/milestones')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  createMilestone(
    @TenantId() tenantId: string,
    @Param('classroom_id') classroomId: string,
    @Param('student_id') studentId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.service.createMilestone(
      tenantId,
      classroomId,
      studentId,
      user.id,
      dto,
    );
  }

  @Get('classrooms/:classroom_id/students/:student_id/milestones')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  listMilestones(
    @TenantId() tenantId: string,
    @Param('classroom_id') classroomId: string,
    @Param('student_id') studentId: string,
  ) {
    return this.service.listMilestones(tenantId, classroomId, studentId);
  }

  @Patch('milestones/:milestone_id')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  updateMilestone(
    @TenantId() tenantId: string,
    @Param('milestone_id') milestoneId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.service.updateMilestone(tenantId, milestoneId, user.id, dto);
  }

  @Delete('milestones/:milestone_id')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMilestone(
    @TenantId() tenantId: string,
    @Param('milestone_id') milestoneId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.service.deleteMilestone(tenantId, milestoneId, user.id);
  }

  @Patch('milestone-tasks/:task_id/review')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  reviewMilestoneTask(
    @TenantId() tenantId: string,
    @Param('task_id') taskId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ReviewMilestoneTaskDto,
  ) {
    return this.service.reviewMilestoneTask(tenantId, taskId, user.id, dto);
  }

  @Get('milestones/:milestone_id/tasks')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.STUDENT)
  listMilestoneTasks(
    @TenantId() tenantId: string,
    @Param('milestone_id') milestoneId: string,
  ) {
    return this.service.listMilestoneTasks(tenantId, milestoneId);
  }

  // ── Teacher: Student Analytics ───────────────────────────

  @Post('classrooms/:classroom_id/students/:student_id/analytics/generate')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  generateStudentAnalytics(
    @TenantId() tenantId: string,
    @Param('classroom_id') _classroomId: string,
    @Param('student_id') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.generateStudentAnalytics(
      tenantId,
      studentId,
      user.id,
    );
  }

  // ── Student: My Progress ──────────────────────────────────

  @Post('student/milestones/:milestone_id/tasks')
  @Roles(Role.STUDENT)
  createMilestoneTask(
    @TenantId() tenantId: string,
    @Param('milestone_id') milestoneId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateMilestoneTaskDto,
  ) {
    return this.service.createMilestoneTask(tenantId, milestoneId, user.id, dto);
  }

  @Get('student/my-progress/milestones')
  @Roles(Role.STUDENT)
  getMyMilestones(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.getMyMilestones(tenantId, user.id);
  }

  @Get('student/analytics')
  @Roles(Role.STUDENT)
  getMyAnalytics(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.getStudentAnalytics(tenantId, user.id);
  }
}
