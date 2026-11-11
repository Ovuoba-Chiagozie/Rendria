import { createHmac } from 'crypto';
import { env } from '../../config';
import { BillingRepository } from './billing.repository';
import { WebhookService } from './webhook.service';

describe('WebhookService', () => {
  const originalSecret = env.lemonWebhookSecret;
  const user = {
    id: 'user-1',
    email: 'buyer@example.com',
    name: null,
    credits: 700,
    subscription_plan: 'starter',
    subscription_status: 'active',
    subscription_current_period_end: null,
    lemon_subscription_id: 'sub-1',
  };
  const billing = {
    startWebhook: jest.fn().mockResolvedValue(true),
    findUser: jest.fn().mockResolvedValue(user),
    updateSubscription: jest.fn().mockResolvedValue(undefined),
    markWebhookProcessed: jest.fn().mockResolvedValue(undefined),
    markWebhookFailed: jest.fn().mockResolvedValue(undefined),
  };
  const service = new WebhookService(billing as unknown as BillingRepository);

  beforeEach(() => {
    env.lemonWebhookSecret = 'test-secret';
    jest.clearAllMocks();
  });

  afterAll(() => {
    env.lemonWebhookSecret = originalSecret;
  });

  const send = (type: string, id = 'sub-1') => {
    const raw = Buffer.from(
      JSON.stringify({
        meta: { event_name: type, custom_data: { user_id: user.id } },
        data: { id, attributes: {} },
      }),
    );
    const signature = createHmac('sha256', 'test-secret')
      .update(raw)
      .digest('hex');
    return service.handle(raw, signature);
  };

  it('does not reset credits when a subscription is cancelled', async () => {
    await send('subscription_cancelled');
    expect(billing.updateSubscription).toHaveBeenCalledWith(user.id, {
      status: 'cancelled',
      periodEnd: undefined,
    });
    expect(billing.markWebhookProcessed).toHaveBeenCalled();
  });

  it('ignores expiration of a superseded subscription', async () => {
    await send('subscription_expired', 'old-subscription');
    expect(billing.updateSubscription).not.toHaveBeenCalled();
  });

  it('reports a duplicate event without applying it', async () => {
    billing.startWebhook.mockResolvedValueOnce(false);
    expect(await send('subscription_cancelled')).toEqual({
      message: 'Event already processed',
    });
    expect(billing.updateSubscription).not.toHaveBeenCalled();
  });
});
