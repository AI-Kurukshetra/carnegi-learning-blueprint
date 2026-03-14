import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [PrismaModule, TenantsModule, InvoicesModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
