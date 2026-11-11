import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { User } from '../users/user.types';
import { BillingService } from './billing.service';
import { WebhookService } from './webhook.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('app')
export class BillingController {
  constructor(
    private readonly api: BillingService,
    private readonly webhooks: WebhookService,
  ) {}

  @Post('checkout/create-checkout')
  @UseGuards(SessionAuthGuard)
  async checkout(@CurrentUser() user: User, @Body() body: CreateCheckoutDto) {
    return this.api.checkout(user, body.plan);
  }

  @Get('checkout/subscription-status')
  @UseGuards(SessionAuthGuard)
  subscription(@CurrentUser() user: User) {
    return this.api.subscription(user);
  }

  @Post('webhooks/lemon')
  @HttpCode(200)
  webhook(@Req() request: Request & { rawBody?: Buffer }) {
    return this.webhooks.handle(
      request.rawBody || Buffer.from(''),
      request.header('x-signature'),
    );
  }
}
