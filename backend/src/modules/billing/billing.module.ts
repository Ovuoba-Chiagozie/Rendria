import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { LemonSqueezyClient } from './lemon-squeezy.client';
import { BillingRepository } from './billing.repository';

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    WebhookService,
    LemonSqueezyClient,
    BillingRepository,
  ],
})
export class BillingModule {}
