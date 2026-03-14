import { DifficultyLevel, QuestionType } from '@prisma/client';
import { IsEnum, IsInt, IsUUID, Max, Min } from 'class-validator';

export class GenerateQuestionsDto {
  @IsUUID()
  learning_objective_id: string;

  @IsEnum(QuestionType)
  question_type: QuestionType;

  @IsEnum(DifficultyLevel)
  difficulty_level: DifficultyLevel;

  @IsInt()
  @Min(1)
  @Max(20)
  count: number;
}
