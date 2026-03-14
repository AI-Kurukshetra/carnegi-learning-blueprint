import { BloomLevel, DifficultyLevel, QuestionType, ReviewStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class ListQuestionsDto {
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
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty_level?: DifficultyLevel;

  @IsOptional()
  @IsEnum(BloomLevel)
  bloom_level?: BloomLevel;

  @IsOptional()
  @IsEnum(ReviewStatus)
  review_status?: ReviewStatus;

  @IsOptional()
  @IsUUID()
  learning_objective_id?: string;
}

