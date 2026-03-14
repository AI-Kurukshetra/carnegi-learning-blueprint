import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';
import { SchoolProfileService } from './school-profile.service';

@Controller('school-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolProfileController {
  constructor(private readonly schoolProfileService: SchoolProfileService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findOne(@TenantId() tenantId: string) {
    return this.schoolProfileService.getByTenant(tenantId);
  }

  @Put()
  @Roles(Role.SCHOOL_ADMIN)
  update(@TenantId() tenantId: string, @Body() dto: UpdateSchoolProfileDto) {
    return this.schoolProfileService.upsert(tenantId, dto);
  }
}

