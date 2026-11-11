import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { env } from '../../config';
import type { User } from '../users/user.types';

@Injectable()
export class LemonSqueezyClient {
  async createCheckout(
    user: User,
    plan: 'starter' | 'premium',
  ): Promise<string> {
    const variant =
      plan === 'starter' ? env.starterVariantId : env.premiumVariantId;
    if (!env.lemonApiKey || !env.lemonStoreId || !variant) {
      throw new InternalServerErrorException({
        success: false,
        message: 'lemon not configured',
      });
    }
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.lemonApiKey}`,
        accept: 'application/vnd.api+json',
        'content-type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_options: { embed: false, media: false, logo: true },
            checkout_data: {
              custom: {
                userId: user.id,
                user_id: user.id,
                userEmail: user.email,
                user_email: user.email,
                plan,
              },
            },
            preview: false,
            test_mode: !env.production,
          },
          relationships: {
            store: { data: { type: 'stores', id: env.lemonStoreId } },
            variant: { data: { type: 'variants', id: variant } },
          },
        },
      }),
    });
    const payload = (await response.json()) as {
      data?: { attributes?: { url?: string } };
    };
    const url = payload.data?.attributes?.url;
    if (!response.ok || !url) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to create checkout session',
      });
    }
    return url;
  }
}
