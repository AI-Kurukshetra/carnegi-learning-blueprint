import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMilestoneTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;
}
