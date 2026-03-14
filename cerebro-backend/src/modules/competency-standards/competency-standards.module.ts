import { Module } from '@nestjs/common';
import { CompetencyStandardsController } from './competency-standards.controller';
import { CompetencyStandardsService } from './competency-standards.service';

@Module({
  controllers: [CompetencyStandardsController],
  providers: [CompetencyStandardsService],
  exports: [CompetencyStandardsService],
})
export class CompetencyStandardsModule {}

