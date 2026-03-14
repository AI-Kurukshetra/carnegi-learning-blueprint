import { IsString, MinLength } from 'class-validator';

export class AddCompetencyStandardDto {
  @IsString()
  @MinLength(1)
  competency_standard_id: string;
}

