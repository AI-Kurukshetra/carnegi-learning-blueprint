import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  section_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subject_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  teacher_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  academic_year_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}

