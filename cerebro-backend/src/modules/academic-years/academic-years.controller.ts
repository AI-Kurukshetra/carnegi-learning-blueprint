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
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { ListAcademicYearsDto } from './dto/list-academic-years.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(@TenantId() tenantId: string, @Query() query: ListAcademicYearsDto) {
    return this.academicYearsService.findAll(tenantId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  create(@TenantId() tenantId: string, @Body() dto: CreateAcademicYearDto) {
    return this.academicYearsService.create(tenantId, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.academicYearsService.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academicYearsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.academicYearsService.remove(tenantId, id);
  }
}

