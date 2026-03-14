import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class FreeTrialDto {
  @IsString()
  @MinLength(1)
  school_name: string;

  @IsString()
  @MinLength(1)
  slug: string;

  @IsString()
  @MinLength(1)
  admin_first_name: string;

  @IsString()
  @MinLength(1)
  admin_last_name: string;

  @IsEmail()
  admin_email: string;

  @IsString()
  @MinLength(8)
  admin_password: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
