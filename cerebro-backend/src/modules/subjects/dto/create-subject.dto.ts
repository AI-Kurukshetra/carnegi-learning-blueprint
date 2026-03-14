import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}

