import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @MinLength(1)
  first_name: string;

  @IsString()
  @MinLength(1)
  last_name: string;

  @IsOptional()
  @IsUUID()
  classroom_id?: string;
}
