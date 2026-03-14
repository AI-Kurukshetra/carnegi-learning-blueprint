import { IsString, MinLength } from 'class-validator';

export class AddPrerequisiteDto {
  @IsString()
  @MinLength(1)
  prerequisite_lo_id: string;
}

