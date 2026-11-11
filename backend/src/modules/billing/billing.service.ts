import { BadRequestException, Injectable } from '@nestjs/common';
import { requireString } from '../../common/pipes/required-string';
import type { User } from '../users/user.types';
import { LemonSqueezyClient } from './lemon-squeezy.client';

@Injectable()
export class BillingService {
  constructor(private readonly lemon: LemonSqueezyClient) {}

  subscription(user: User) {
    return {
      success: true,
      data: {
        subscriptionPlan: user.subscription_plan || 'free',
        subscriptionStatus: user.subscription_status,
        subscriptionCurrentPeriodEnd: user.subscription_current_period_end,
        lemonSubscriptionId: user.lemon_subscription_id,
        credits: user.credits,
      },
    };
  }

  async checkout(user: User, plan: unknown) {
    const selected = requireString(plan, 'plan').toLowerCase();
    if (selected !== 'starter' && selected !== 'premium') {
      throw new BadRequestException({
        success: false,
        message: 'Invalid plan. Must be either "starter" or "premium"',
      });
    }
    const checkoutUrl = await this.lemon.createCheckout(user, selected);
    return {
      success: true,
      data: {
        checkoutUrl,
        plan: selected,
        credits: selected === 'starter' ? 1000 : 5000,
        price: selected === 'starter' ? 29 : 99,
      },
    };
  }
}
