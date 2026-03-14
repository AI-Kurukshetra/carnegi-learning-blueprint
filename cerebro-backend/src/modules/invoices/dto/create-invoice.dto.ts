import { IsDateString, IsDecimal, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class CreateInvoiceDto {
  @IsUUID()
  tenant_id: string;

  @IsDecimal()
  amount: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsString()
  description?: string;
}
