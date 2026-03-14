import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { QuestionGenerationService } from './services/question-generation.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AiController],
  providers: [GeminiService, QuestionGenerationService],
  exports: [GeminiService, QuestionGenerationService],
})
export class AiModule {}
