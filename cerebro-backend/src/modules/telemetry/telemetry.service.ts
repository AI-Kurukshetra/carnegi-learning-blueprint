import { Injectable } from '@nestjs/common';
import { Prisma, TelemetryEvent } from '@prisma/client';
import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTelemetryEventDto } from './dto/create-telemetry-event.dto';

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(
    tenantId: string,
    user: RequestUser,
    dto: CreateTelemetryEventDto,
  ): Promise<TelemetryEvent> {
    return this.prisma.telemetryEvent.create({
      data: {
        tenant_id: tenantId,
        student_id: user.id,
        session_id: dto.session_id,
        event_type: dto.event_type,
        payload: dto.payload as Prisma.InputJsonValue,
        occurred_at: dto.occurred_at ? new Date(dto.occurred_at) : new Date(),
      },
    });
  }
}
