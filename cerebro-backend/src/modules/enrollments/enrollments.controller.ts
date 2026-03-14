import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { BulkCreateEnrollmentDto } from './dto/bulk-create-enrollment.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { ListEnrollmentsDto } from './dto/list-enrollments.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  create(@TenantId() tenantId: string, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(tenantId, dto);
  }

  @Post('bulk')
  @Roles(Role.SCHOOL_ADMIN)
  bulkCreate(
    @TenantId() tenantId: string,
    @Body() dto: BulkCreateEnrollmentDto,
  ) {
    return this.enrollmentsService.bulkCreate(tenantId, dto);
  }

  @Post('auto-assign')
  @Roles(Role.SCHOOL_ADMIN)
  autoAssign(@TenantId() tenantId: string) {
    return this.enrollmentsService.autoAssign(tenantId);
  }

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query() query: ListEnrollmentsDto,
  ) {
    return this.enrollmentsService.findAll(tenantId, user, query);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.enrollmentsService.remove(tenantId, id);
  }
}

