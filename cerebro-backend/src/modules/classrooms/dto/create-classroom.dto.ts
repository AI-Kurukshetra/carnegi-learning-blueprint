import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateClassroomDto {
  @IsUUID()
  section_id: string;

  @IsOptional()
  @IsUUID()
  subject_id?: string;

  @IsOptional()
  @IsUUID()
  teacher_id?: string;

  @IsUUID()
  academic_year_id: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}

