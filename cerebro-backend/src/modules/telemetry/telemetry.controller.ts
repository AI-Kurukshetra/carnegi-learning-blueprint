import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { CreateTelemetryEventDto } from './dto/create-telemetry-event.dto';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('events')
  @Roles(Role.STUDENT)
  createEvent(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateTelemetryEventDto,
  ) {
    return this.telemetryService.createEvent(tenantId, user, dto);
  }
}

