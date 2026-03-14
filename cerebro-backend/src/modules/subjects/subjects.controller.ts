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
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ListSubjectsDto } from './dto/list-subjects.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(@TenantId() tenantId: string, @Query() query: ListSubjectsDto) {
    return this.subjectsService.findAll(tenantId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  create(@TenantId() tenantId: string, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(tenantId, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.subjectsService.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.subjectsService.remove(tenantId, id);
  }
}

