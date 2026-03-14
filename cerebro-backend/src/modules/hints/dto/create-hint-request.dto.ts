import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateHintRequestDto {
  @IsString()
  @MinLength(1)
  question_id: string;

  @IsString()
  @MinLength(1)
  attempt_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  hint_level: number;

  @IsOptional()
  @IsString()
  hint_text?: string;
}

