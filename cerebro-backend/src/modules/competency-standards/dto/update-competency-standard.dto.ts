import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCompetencyStandardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

