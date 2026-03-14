import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { ProfileService, StudentProfile } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('student')
  @Roles(Role.STUDENT)
  getStudentProfile(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<StudentProfile> {
    return this.profileService.getStudentProfile(tenantId, user.id);
  }
}
