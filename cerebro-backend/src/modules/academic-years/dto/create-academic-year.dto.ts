import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}

