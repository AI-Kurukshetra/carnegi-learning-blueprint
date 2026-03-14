import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoiceStatus } from '@prisma/client';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { InvoicesService } from '../invoices/invoices.service';
import { TenantsService } from '../tenants/tenants.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FreeTrialDto } from './dto/free-trial.dto';

const PLAN_AMOUNTS: Record<string, { amount: string; description: string }> = {
  basic: { amount: '1000.00', description: 'Basic Plan - 100 Users x $10/user' },
  enterprise: { amount: '3500.00', description: 'Enterprise Plan - $35/user/month' },
};

@Injectable()
export class OnboardingService {
  private readonly razorpay: Razorpay;

  constructor(
    private readonly config: ConfigService,
    private readonly tenantsService: TenantsService,
    private readonly invoicesService: InvoicesService,
    private readonly prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.config.get<string>('RAZORPAY_KEY_ID')!,
      key_secret: this.config.get<string>('RAZORPAY_KEY_SECRET')!,
    });
  }

  async createOrder(dto: CreateOrderDto) {
    const amountInSmallestUnit = Math.round(dto.amount * 100);
    try {
      const order = await this.razorpay.orders.create({
        amount: amountInSmallestUnit,
        currency: dto.currency,
        receipt: `onboard_${Date.now()}`,
        notes: { plan: dto.plan, admin_email: dto.admin_email },
      });
      return {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: this.config.get<string>('RAZORPAY_KEY_ID'),
      };
    } catch (err: any) {
      const message = err?.error?.description ?? err?.message ?? 'Payment gateway error. Please try again.';
      throw new BadRequestException(message);
    }
  }

  private verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac('sha256', this.config.get<string>('RAZORPAY_KEY_SECRET')!)
      .update(body)
      .digest('hex');
    return expected === signature;
  }

  async completeOnboarding(dto: CompleteOnboardingDto) {
    const isValid = this.verifySignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    if (!isValid) {
      throw new BadRequestException('Payment verification failed. Please contact support.');
    }

    const tenant = await this.tenantsService.create({
      name: dto.school_name,
      slug: dto.slug,
      admin_email: dto.admin_email,
      admin_password: dto.admin_password,
      admin_first_name: dto.admin_first_name,
      admin_last_name: dto.admin_last_name,
    });

    await this.prisma.schoolProfile.upsert({
      where: { tenant_id: tenant.id },
      create: { tenant_id: tenant.id, address: dto.address, phone: dto.phone },
      update: { address: dto.address, phone: dto.phone },
    });

    const planInfo = PLAN_AMOUNTS[dto.plan.toLowerCase()];
    if (planInfo) {
      await this.invoicesService.create({
        tenant_id: tenant.id,
        amount: planInfo.amount,
        currency: 'USD',
        status: InvoiceStatus.PAID,
        due_date: new Date().toISOString(),
        description: planInfo.description,
      });
    }

    return { tenant_slug: tenant.slug, message: 'School registered successfully.' };
  }

  async freeTrial(dto: FreeTrialDto) {
    const tenant = await this.tenantsService.create({
      name: dto.school_name,
      slug: dto.slug,
      admin_email: dto.admin_email,
      admin_password: dto.admin_password,
      admin_first_name: dto.admin_first_name,
      admin_last_name: dto.admin_last_name,
    });

    await this.prisma.schoolProfile.upsert({
      where: { tenant_id: tenant.id },
      create: { tenant_id: tenant.id, address: dto.address, phone: dto.phone },
      update: { address: dto.address, phone: dto.phone },
    });

    return { tenant_slug: tenant.slug, message: 'Free trial activated successfully.' };
  }
}
