import { BloomLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateLearningObjectiveDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BloomLevel)
  bloom_level?: BloomLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_index?: number;
}

