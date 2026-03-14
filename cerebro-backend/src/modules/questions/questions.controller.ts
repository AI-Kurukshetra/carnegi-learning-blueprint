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
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsDto } from './dto/list-questions.dto';
import { ReviewQuestionDto } from './dto/review-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findAll(@TenantId() tenantId: string, @Query() query: ListQuestionsDto) {
    return this.questionsService.findAll(tenantId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(tenantId, user.id, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.questionsService.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.questionsService.remove(tenantId, id);
  }

  @Patch(':id/review')
  @Roles(Role.SCHOOL_ADMIN)
  review(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ReviewQuestionDto,
  ) {
    return this.questionsService.review(tenantId, id, dto);
  }
}

