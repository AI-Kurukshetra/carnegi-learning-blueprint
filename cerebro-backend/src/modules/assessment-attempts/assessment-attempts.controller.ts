import {
  Body,
  Controller,
  Get,
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
import { AssessmentAttemptsService } from './assessment-attempts.service';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Controller('assessments/:assessment_id/attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentAttemptsController {
  constructor(
    private readonly assessmentAttemptsService: AssessmentAttemptsService,
  ) {}

  @Post()
  @Roles(Role.STUDENT)
  startAttempt(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentAttemptsService.startAttempt(
      tenantId,
      assessmentId,
      user,
    );
  }

  @Get('my')
  @Roles(Role.STUDENT)
  findMyAttempts(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentAttemptsService.findMyAttempts(
      tenantId,
      assessmentId,
      user,
    );
  }

  @Get('all')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findAllAttempts(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
  ) {
    return this.assessmentAttemptsService.findAllAttempts(
      tenantId,
      assessmentId,
    );
  }

  @Get(':attempt_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
    @Param('attempt_id') attemptId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentAttemptsService.findAttemptById(
      tenantId,
      assessmentId,
      attemptId,
      user,
    );
  }

  @Post(':attempt_id/responses')
  @Roles(Role.STUDENT)
  submitResponse(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
    @Param('attempt_id') attemptId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.assessmentAttemptsService.submitResponse(
      tenantId,
      assessmentId,
      attemptId,
      user,
      dto,
    );
  }

  @Patch(':attempt_id/submit')
  @Roles(Role.STUDENT)
  submitAttempt(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
    @Param('attempt_id') attemptId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentAttemptsService.submitAttempt(
      tenantId,
      assessmentId,
      attemptId,
      user,
    );
  }

  @Get(':attempt_id/next-question')
  @Roles(Role.STUDENT)
  getNextQuestion(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
    @Param('attempt_id') attemptId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentAttemptsService.getNextQuestion(
      tenantId,
      assessmentId,
      attemptId,
      user,
    );
  }

  @Get(':attempt_id/results')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  getResults(
    @TenantId() tenantId: string,
    @Param('assessment_id') assessmentId: string,
    @Param('attempt_id') attemptId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentAttemptsService.getResults(
      tenantId,
      assessmentId,
      attemptId,
      user,
    );
  }
}

