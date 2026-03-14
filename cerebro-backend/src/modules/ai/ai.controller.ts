import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ApproveGeneratedQuestionsDto } from './dto/approve-generated-questions.dto';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { QuestionGenerationService } from './services/question-generation.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly questionGenerationService: QuestionGenerationService,
  ) {}

  @Post('generate-questions')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  generateQuestions(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: GenerateQuestionsDto,
  ): Promise<{ job_id: string; status: string }> {
    return this.questionGenerationService.createJob(dto, tenantId, user.id);
  }

  @Get('generate-questions/:jobId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  getJobStatus(
    @TenantId() tenantId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.questionGenerationService.getJobStatus(jobId, tenantId);
  }

  @Post('generate-questions/:jobId/approve')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  approveGeneratedQuestions(
    @TenantId() tenantId: string,
    @Param('jobId') jobId: string,
    @Body() dto: ApproveGeneratedQuestionsDto,
  ): Promise<{ question_ids: string[] }> {
    return this.questionGenerationService.approveJob(jobId, tenantId, dto);
  }
}
