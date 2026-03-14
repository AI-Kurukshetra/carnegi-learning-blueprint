import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FreeTrialDto } from './dto/free-trial.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Post('create-order')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.onboardingService.createOrder(dto);
  }

  @Public()
  @Post('complete')
  complete(@Body() dto: CompleteOnboardingDto) {
    return this.onboardingService.completeOnboarding(dto);
  }

  @Public()
  @Post('free-trial')
  freeTrial(@Body() dto: FreeTrialDto) {
    return this.onboardingService.freeTrial(dto);
  }
}
