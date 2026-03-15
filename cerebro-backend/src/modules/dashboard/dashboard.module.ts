import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { ClassroomsModule } from '../classrooms/classrooms.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ClassroomsModule, PrismaModule, AiModule, ConfigModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
