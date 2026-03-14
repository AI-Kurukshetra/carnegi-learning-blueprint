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
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddCompetencyStandardDto } from './dto/add-competency-standard.dto';
import { AddPrerequisiteDto } from './dto/add-prerequisite.dto';
import { CreateLearningObjectiveDto } from './dto/create-learning-objective.dto';
import { ListLearningObjectivesDto } from './dto/list-learning-objectives.dto';
import { UpdateLearningObjectiveDto } from './dto/update-learning-objective.dto';
import { LearningObjectivesService } from './learning-objectives.service';

@Controller('topics/:topic_id/learning-objectives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearningObjectivesController {
  constructor(
    private readonly learningObjectivesService: LearningObjectivesService,
  ) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Query() query: ListLearningObjectivesDto,
  ) {
    return this.learningObjectivesService.findAll(tenantId, topicId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  create(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Body() dto: CreateLearningObjectiveDto,
  ) {
    return this.learningObjectivesService.create(tenantId, topicId, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Param('id') id: string,
  ) {
    return this.learningObjectivesService.findById(tenantId, topicId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  update(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLearningObjectiveDto,
  ) {
    return this.learningObjectivesService.update(tenantId, topicId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.learningObjectivesService.remove(tenantId, topicId, id);
  }

  @Post(':id/prerequisites')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  addPrerequisite(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Param('id') id: string,
    @Body() dto: AddPrerequisiteDto,
  ) {
    return this.learningObjectivesService.addPrerequisite(
      tenantId,
      topicId,
      id,
      dto,
    );
  }

  @Delete(':id/prerequisites/:prerequisite_lo_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePrerequisite(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Param('id') id: string,
    @Param('prerequisite_lo_id') prerequisiteLoId: string,
  ): Promise<void> {
    await this.learningObjectivesService.removePrerequisite(
      tenantId,
      topicId,
      id,
      prerequisiteLoId,
    );
  }

  @Post(':id/competency-standards')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  addCompetencyStandard(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Param('id') id: string,
    @Body() dto: AddCompetencyStandardDto,
  ) {
    return this.learningObjectivesService.addCompetencyStandard(
      tenantId,
      topicId,
      id,
      dto,
    );
  }

  @Delete(':id/competency-standards/:competency_standard_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCompetencyStandard(
    @TenantId() tenantId: string,
    @Param('topic_id') topicId: string,
    @Param('id') id: string,
    @Param('competency_standard_id') competencyStandardId: string,
  ): Promise<void> {
    await this.learningObjectivesService.removeCompetencyStandard(
      tenantId,
      topicId,
      id,
      competencyStandardId,
    );
  }
}

