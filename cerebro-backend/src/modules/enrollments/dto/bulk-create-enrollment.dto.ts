import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateEnrollmentDto } from './create-enrollment.dto';

export class BulkCreateEnrollmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnrollmentDto)
  items: CreateEnrollmentDto[];
}

