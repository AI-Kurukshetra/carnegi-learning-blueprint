import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  due_date?: string;
}
