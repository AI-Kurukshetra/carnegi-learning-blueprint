import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';

class ReorderAssessmentQuestionItemDto {
  @IsString()
  @MinLength(1)
  question_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_index: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marks?: number;
}

export class ReorderAssessmentQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderAssessmentQuestionItemDto)
  items: ReorderAssessmentQuestionItemDto[];
}

