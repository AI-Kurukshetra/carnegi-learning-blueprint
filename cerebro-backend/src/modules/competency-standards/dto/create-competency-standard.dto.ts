import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompetencyStandardDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

