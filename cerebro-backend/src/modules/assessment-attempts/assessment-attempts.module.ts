import { Module } from '@nestjs/common';
import { AssessmentAttemptsController } from './assessment-attempts.controller';
import { AssessmentAttemptsService } from './assessment-attempts.service';
import { AdaptiveEngineService } from './adaptive-engine.service';
import { SemiAdaptiveEngineService } from './semi-adaptive-engine.service';

@Module({
  controllers: [AssessmentAttemptsController],
  providers: [
    AssessmentAttemptsService,
    AdaptiveEngineService,
    SemiAdaptiveEngineService,
  ],
  exports: [
    AssessmentAttemptsService,
    AdaptiveEngineService,
    SemiAdaptiveEngineService,
  ],
})
export class AssessmentAttemptsModule {}

