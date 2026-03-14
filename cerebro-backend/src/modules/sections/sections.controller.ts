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
import { CreateSectionDto } from './dto/create-section.dto';
import { ListSectionsDto } from './dto/list-sections.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { SectionsService } from './sections.service';

@Controller('grades/:grade_id/sections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(
    @TenantId() tenantId: string,
    @Param('grade_id') gradeId: string,
    @Query() query: ListSectionsDto,
  ) {
    return this.sectionsService.findAll(tenantId, gradeId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  create(
    @TenantId() tenantId: string,
    @Param('grade_id') gradeId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionsService.create(tenantId, gradeId, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(
    @TenantId() tenantId: string,
    @Param('grade_id') gradeId: string,
    @Param('id') id: string,
  ) {
    return this.sectionsService.findById(tenantId, gradeId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  update(
    @TenantId() tenantId: string,
    @Param('grade_id') gradeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(tenantId, gradeId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('grade_id') gradeId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.sectionsService.remove(tenantId, gradeId, id);
  }
}

