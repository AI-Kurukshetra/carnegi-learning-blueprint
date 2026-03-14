import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class SubmitResponseDto {
  @IsString()
  @MinLength(1)
  question_id: string;

  @IsOptional()
  @IsString()
  text_response?: string;

  @IsOptional()
  @IsArray()
  option_ids?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  time_spent_seconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hint_level_used?: number;
}

