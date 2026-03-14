import { AssessmentMode, AssessmentStatus, AssessmentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  classroom_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @IsOptional()
  @IsEnum(AssessmentMode)
  mode?: AssessmentMode;

  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;

  @IsOptional()
  @IsDateString()
  due_at?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  time_limit_minutes?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  has_randomized_questions?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  question_count?: number;
}

