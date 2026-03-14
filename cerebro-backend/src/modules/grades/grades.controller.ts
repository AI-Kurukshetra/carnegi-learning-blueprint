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
import { CreateGradeDto } from './dto/create-grade.dto';
import { ListGradesDto } from './dto/list-grades.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradesService } from './grades.service';

@Controller('academic-years/:academic_year_id/grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(
    @TenantId() tenantId: string,
    @Param('academic_year_id') academicYearId: string,
    @Query() query: ListGradesDto,
  ) {
    return this.gradesService.findAll(tenantId, academicYearId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  create(
    @TenantId() tenantId: string,
    @Param('academic_year_id') academicYearId: string,
    @Body() dto: CreateGradeDto,
  ) {
    return this.gradesService.create(tenantId, academicYearId, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(
    @TenantId() tenantId: string,
    @Param('academic_year_id') academicYearId: string,
    @Param('id') id: string,
  ) {
    return this.gradesService.findById(tenantId, academicYearId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  update(
    @TenantId() tenantId: string,
    @Param('academic_year_id') academicYearId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradesService.update(tenantId, academicYearId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('academic_year_id') academicYearId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.gradesService.remove(tenantId, academicYearId, id);
  }
}

