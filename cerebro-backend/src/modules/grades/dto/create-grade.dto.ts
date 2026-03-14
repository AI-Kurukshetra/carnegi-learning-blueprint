import { Type } from 'class-transformer';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateGradeDto {
  @IsString()
  @MinLength(1)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  level_number: number;
}

