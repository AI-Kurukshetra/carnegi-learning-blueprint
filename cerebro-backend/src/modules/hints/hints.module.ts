import { Module } from '@nestjs/common';
import { HintsController } from './hints.controller';
import { HintsService } from './hints.service';

@Module({
  controllers: [HintsController],
  providers: [HintsService],
  exports: [HintsService],
})
export class HintsModule {}

