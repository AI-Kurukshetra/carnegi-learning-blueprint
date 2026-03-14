import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('teacher')
  @Roles(Role.TEACHER)
  getTeacherDashboard(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.dashboardService.getTeacherDashboard(tenantId, user.id);
  }

  @Get('super-admin')
  @Roles(Role.SUPER_ADMIN)
  getSuperAdminDashboard() {
    return this.dashboardService.getSuperAdminDashboard();
  }
}
