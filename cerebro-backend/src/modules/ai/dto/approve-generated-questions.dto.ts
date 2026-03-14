import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ApprovedOptionDto {
  @IsString()
  text: string;

  @IsBoolean()
  is_correct: boolean;

  @IsString()
  rationale: string;

  @IsInt()
  order_index: number;
}

export class ApprovedQuestionDto {
  @IsString()
  stem: string;

  @IsEnum(['MCQ', 'MULTI_SELECT', 'SHORT_ANSWER'])
  type: string;

  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficulty_level: string;

  @IsString()
  bloom_level: string;

  @IsArray()
  @IsString({ each: true })
  hints: string[];

  @IsNumber()
  marks: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedOptionDto)
  options?: ApprovedOptionDto[];
}

export class ApproveGeneratedQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovedQuestionDto)
  questions: ApprovedQuestionDto[];
}
