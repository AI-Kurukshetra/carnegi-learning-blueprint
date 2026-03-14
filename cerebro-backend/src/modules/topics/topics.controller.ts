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
import { CreateTopicDto } from './dto/create-topic.dto';
import { ListTopicsDto } from './dto/list-topics.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicsService } from './topics.service';

@Controller('subjects/:subject_id/topics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(
    @TenantId() tenantId: string,
    @Param('subject_id') subjectId: string,
    @Query() query: ListTopicsDto,
  ) {
    return this.topicsService.findAll(tenantId, subjectId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  create(
    @TenantId() tenantId: string,
    @Param('subject_id') subjectId: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.topicsService.create(tenantId, subjectId, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(
    @TenantId() tenantId: string,
    @Param('subject_id') subjectId: string,
    @Param('id') id: string,
  ) {
    return this.topicsService.findById(tenantId, subjectId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  update(
    @TenantId() tenantId: string,
    @Param('subject_id') subjectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topicsService.update(tenantId, subjectId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('subject_id') subjectId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.topicsService.remove(tenantId, subjectId, id);
  }
}

