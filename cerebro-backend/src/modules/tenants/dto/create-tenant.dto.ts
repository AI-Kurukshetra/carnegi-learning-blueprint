import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  slug: string;

  @IsEmail()
  admin_email: string;

  @IsString()
  @MinLength(8)
  admin_password: string;

  @IsString()
  @MinLength(1)
  admin_first_name: string;

  @IsString()
  @MinLength(1)
  admin_last_name: string;
}
