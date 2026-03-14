import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAcademicYearDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}

