import { TelemetryEventType } from '@prisma/client';
import { IsDateString, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTelemetryEventDto {
  @IsString()
  @MinLength(1)
  session_id: string;

  @IsEnum(TelemetryEventType)
  event_type: TelemetryEventType;

  @IsObject()
  payload: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  occurred_at?: string;
}

