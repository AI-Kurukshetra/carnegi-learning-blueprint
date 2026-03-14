import { IsString, MinLength } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  @MinLength(1)
  student_id: string;

  @IsString()
  @MinLength(1)
  section_id: string;

  @IsString()
  @MinLength(1)
  academic_year_id: string;
}

