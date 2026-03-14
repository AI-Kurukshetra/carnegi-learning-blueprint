import { Module } from '@nestjs/common';
import { KnowledgeStatesController } from './knowledge-states.controller';
import { KnowledgeStatesService } from './knowledge-states.service';

@Module({
  controllers: [KnowledgeStatesController],
  providers: [KnowledgeStatesService],
  exports: [KnowledgeStatesService],
})
export class KnowledgeStatesModule {}

