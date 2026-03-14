import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { CreateHintRequestDto } from './dto/create-hint-request.dto';
import { HintsService } from './hints.service';

@Controller('hints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateHintRequestDto,
  ) {
    return this.hintsService.create(tenantId, user, dto);
  }
}

