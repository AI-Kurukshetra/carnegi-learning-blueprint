import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ReviewMilestoneTaskDto {
  @IsInt()
  @Min(0)
  @Max(100)
  completion_pct: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  teacher_comment?: string;
}
