import { AssessmentStatus, AssessmentType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListAssessmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  classroom_id?: string;

  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  /** Student-only filter: PENDING = not yet completed, COMPLETED = has submitted/graded attempt */
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED'])
  completion?: 'PENDING' | 'COMPLETED';
}

