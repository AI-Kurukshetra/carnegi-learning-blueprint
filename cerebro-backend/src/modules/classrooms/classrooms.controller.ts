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
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { ListClassroomsDto } from './dto/list-classrooms.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(@TenantId() tenantId: string, @Query() query: ListClassroomsDto) {
    return this.classroomsService.findAll(tenantId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  create(@TenantId() tenantId: string, @Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(tenantId, dto);
  }

  // dashboard-stats MUST be declared before :id to avoid route conflict
  @Get('dashboard-stats')
  @Roles(Role.TEACHER)
  getDashboardStats(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.classroomsService.getTeacherDashboardStats(tenantId, user.id);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classroomsService.findById(tenantId, id);
  }

  @Get(':id/students')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  getClassroomStudents(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.classroomsService.findClassroomStudents(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClassroomDto,
  ) {
    return this.classroomsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.classroomsService.remove(tenantId, id);
  }
}
