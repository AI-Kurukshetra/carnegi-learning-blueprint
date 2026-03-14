import { ReviewStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ReviewQuestionDto {
  @IsEnum(ReviewStatus)
  review_status: ReviewStatus;
}

