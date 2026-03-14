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
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { AddAssessmentQuestionDto } from './dto/add-assessment-question.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ListAssessmentsDto } from './dto/list-assessments.dto';
import { ReorderAssessmentQuestionsDto } from './dto/reorder-assessment-questions.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AssessmentsService } from './assessments.service';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(
    @TenantId() tenantId: string,
    @Query() query: ListAssessmentsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assessmentsService.findAll(tenantId, query, user);
  }

  @Post()
  @Roles(Role.TEACHER)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.assessmentsService.create(tenantId, user.id, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const assessment = await this.assessmentsService.findByIdWithQuestions(tenantId, id);

    if (user.role === 'STUDENT') {
      return {
        ...assessment,
        assessment_questions: assessment.assessment_questions.map((aq) => ({
          ...aq,
          question: {
            ...aq.question,
            question_options: aq.question.question_options.map(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ({ is_correct, rationale, ...opt }) => opt,
            ),
          },
        })),
      };
    }

    return assessment;
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessmentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.assessmentsService.remove(tenantId, id);
  }

  @Patch(':id/publish')
  @Roles(Role.TEACHER)
  publish(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assessmentsService.publish(tenantId, id);
  }

  @Patch(':id/close')
  @Roles(Role.TEACHER)
  close(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assessmentsService.close(tenantId, id);
  }

  @Post(':id/questions')
  @Roles(Role.TEACHER)
  addQuestion(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddAssessmentQuestionDto,
  ) {
    return this.assessmentsService.addQuestion(tenantId, id, dto);
  }

  @Delete(':id/questions/:question_id')
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQuestion(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('question_id') questionId: string,
  ): Promise<void> {
    await this.assessmentsService.removeQuestion(tenantId, id, questionId);
  }

  @Patch(':id/questions/reorder')
  @Roles(Role.TEACHER)
  reorderQuestions(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ReorderAssessmentQuestionsDto,
  ) {
    return this.assessmentsService.reorderQuestions(tenantId, id, dto);
  }
}

