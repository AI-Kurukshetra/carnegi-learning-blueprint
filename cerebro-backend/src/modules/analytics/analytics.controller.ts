import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('assessments/:assessment_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  getAssessmentAnalytics(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
  ) {
    return this.analyticsService.getAssessmentAnalytics(tenantId, assessmentId);
  }

  @Get('classrooms/:classroom_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  getClassroomAnalytics(
    @TenantId() tenantId: string,
    @Param('classroom_id') classroomId: string,
  ) {
    return this.analyticsService.getClassroomAnalytics(tenantId, classroomId);
  }

  @Get('students/:student_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  getStudentAnalytics(
    @TenantId() tenantId: string,
    @Param('student_id') studentId: string,
  ) {
    return this.analyticsService.getStudentAnalytics(tenantId, studentId);
  }

  @Get('school/overview')
  @Roles(Role.SCHOOL_ADMIN)
  getSchoolOverview(@TenantId() tenantId: string) {
    return this.analyticsService.getSchoolOverview(tenantId);
  }
}

