import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../../config';
import { BillingRepository } from './billing.repository';
import type { LemonWebhookEvent } from './billing.types';

@Injectable()
export class WebhookService {
  constructor(private readonly billing: BillingRepository) {}

  async handle(raw: Buffer, signature?: string) {
    this.verifySignature(raw, signature);
    let event: LemonWebhookEvent;
    try {
      event = JSON.parse(raw.toString()) as LemonWebhookEvent;
    } catch {
      throw new BadRequestException('Invalid payload');
    }

    const type = event.meta?.event_name;
    const data = event.data;
    if (!type || !data?.id) throw new BadRequestException('Invalid payload');
    const eventId = `${type}_${data.id}`;
    if (!(await this.billing.startWebhook(eventId, type, event))) {
      return { message: 'Event already processed' };
    }

    try {
      await this.applyEvent(event, type);
      await this.billing.markWebhookProcessed(eventId);
      return { message: 'Webhook processed successfully' };
    } catch (error) {
      await this.billing.markWebhookFailed(
        eventId,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return { message: 'Webhook received but processing failed' };
    }
  }

  private async applyEvent(
    event: LemonWebhookEvent,
    type: string,
  ): Promise<void> {
    const data = event.data!;
    const attributes = data.attributes || {};
    const custom = event.meta?.custom_data || {};
    const user = await this.billing.findUser(
      custom.user_id || custom.userId,
      custom.user_email || custom.userEmail || attributes.user_email,
    );
    if (!user) return;

    const subscriptionId = String(data.id);
    const periodEnd = this.periodEnd(attributes.renews_at);
    const variant = String(attributes.variant_id || '');
    const plan =
      variant === env.starterVariantId
        ? 'starter'
        : variant === env.premiumVariantId
          ? 'premium'
          : undefined;
    const credits =
      plan === 'starter' ? 1000 : plan === 'premium' ? 5000 : undefined;

    switch (type) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_resumed':
      case 'subscription_unpaused':
      case 'order_created':
        await this.billing.updateSubscription(user.id, {
          subscriptionId,
          plan: plan || 'free',
          status: 'active',
          credits: credits ?? 0,
          periodEnd,
        });
        break;
      case 'subscription_cancelled':
      case 'subscription_paused':
      case 'subscription_payment_failed':
      case 'subscription_expired':
        if (user.lemon_subscription_id !== subscriptionId) return;
        await this.billing.updateSubscription(
          user.id,
          type === 'subscription_expired'
            ? { plan: 'free', status: 'expired', credits: 0 }
            : {
                status:
                  type === 'subscription_cancelled'
                    ? 'cancelled'
                    : type === 'subscription_paused'
                      ? 'paused'
                      : 'past_due',
                periodEnd,
              },
        );
        break;
      case 'subscription_payment_success':
      case 'subscription_payment_recovered':
        await this.billing.updateSubscription(user.id, {
          plan,
          status: 'active',
          credits,
          periodEnd,
        });
        break;
      // Refunds require manual reconciliation.
      default:
        break;
    }
  }

  private periodEnd(value?: string | number | null): Date | undefined {
    if (!value) return undefined;
    const date = new Date(typeof value === 'number' ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private verifySignature(raw: Buffer, signature?: string): void {
    if (!env.lemonWebhookSecret || !signature)
      throw new UnauthorizedException('Invalid signature');
    const expected = createHmac('sha256', env.lemonWebhookSecret)
      .update(raw)
      .digest('hex');
    const provided = signature.trim();
    if (
      expected.length !== provided.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
    ) {
      throw new UnauthorizedException('Invalid signature');
    }
  }
}
