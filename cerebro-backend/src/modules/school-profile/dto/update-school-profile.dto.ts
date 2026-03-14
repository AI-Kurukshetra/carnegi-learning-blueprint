import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSchoolProfileDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  timezone?: string;
}

