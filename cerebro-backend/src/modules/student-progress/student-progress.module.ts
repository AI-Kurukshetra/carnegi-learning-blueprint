import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudentProgressController } from './student-progress.controller';
import { StudentProgressService } from './student-progress.service';

@Module({
  imports: [PrismaModule, AiModule, ConfigModule],
  controllers: [StudentProgressController],
  providers: [StudentProgressService],
  exports: [StudentProgressService],
})
export class StudentProgressModule {}
