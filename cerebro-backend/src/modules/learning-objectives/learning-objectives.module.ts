import { Module } from '@nestjs/common';
import { LearningObjectivesController } from './learning-objectives.controller';
import { LearningObjectivesService } from './learning-objectives.service';

@Module({
  controllers: [LearningObjectivesController],
  providers: [LearningObjectivesService],
  exports: [LearningObjectivesService],
})
export class LearningObjectivesModule {}

