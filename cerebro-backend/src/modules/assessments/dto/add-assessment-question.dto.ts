import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class AddAssessmentQuestionDto {
  @IsString()
  @MinLength(1)
  question_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_index: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marks: number;
}

