import { BloomLevel, DifficultyLevel, QuestionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateQuestionOptionDto {
  @IsString()
  @MinLength(1)
  text: string;

  @Type(() => Boolean)
  @IsBoolean()
  is_correct: boolean;

  @IsOptional()
  @IsString()
  rationale?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_index: number;
}

export class CreateQuestionDto {
  @IsString()
  @MinLength(1)
  learning_objective_id: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  @MinLength(1)
  stem: string;

  @IsEnum(DifficultyLevel)
  difficulty_level: DifficultyLevel;

  @IsEnum(BloomLevel)
  bloom_level: BloomLevel;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_ai_generated?: boolean;

  @IsOptional()
  @IsArray()
  hints?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

