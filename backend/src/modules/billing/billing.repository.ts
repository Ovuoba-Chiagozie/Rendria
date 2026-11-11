import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { USER_COLUMNS, type User } from '../users/user.types';
import type { LemonWebhookEvent } from './billing.types';

@Injectable()
export class BillingRepository {
  constructor(private readonly database: DatabaseService) {}

  async startWebhook(
    eventId: string,
    type: string,
    event: LemonWebhookEvent,
  ): Promise<boolean> {
    const result = await this.database.query(
      "INSERT INTO webhook_events(event_id,event_type,payload,status) VALUES($1,$2,$3,'processing') ON CONFLICT(event_id) DO NOTHING RETURNING id",
      [eventId, type, JSON.stringify(event)],
    );
    return Boolean(result.rowCount);
  }

  async findUser(
    userId: string | undefined,
    email: string | undefined,
  ): Promise<User | undefined> {
    if (userId) {
      const user = (
        await this.database.query<User>(
          `SELECT ${USER_COLUMNS} FROM users WHERE id=$1`,
          [userId],
        )
      ).rows[0];
      if (user) return user;
    }
    if (!email) return undefined;
    return (
      await this.database.query<User>(
        `SELECT ${USER_COLUMNS} FROM users WHERE email=$1`,
        [email],
      )
    ).rows[0];
  }

  async updateSubscription(
    userId: string,
    changes: {
      subscriptionId?: string;
      plan?: string;
      status?: string;
      credits?: number;
      periodEnd?: Date;
    },
  ): Promise<void> {
    await this.database.query(
      `UPDATE users SET
        lemon_subscription_id=COALESCE($2,lemon_subscription_id),
        subscription_plan=COALESCE($3,subscription_plan),
        subscription_status=COALESCE($4,subscription_status),
        credits=COALESCE($5,credits),
        subscription_current_period_end=COALESCE($6,subscription_current_period_end),
        subscription_updated_at=now(),updated_at=now() WHERE id=$1`,
      [
        userId,
        changes.subscriptionId,
        changes.plan,
        changes.status,
        changes.credits,
        changes.periodEnd,
      ],
    );
  }

  async markWebhookFailed(eventId: string, message: string): Promise<void> {
    await this.database.query(
      "UPDATE webhook_events SET status='failed',error=$2,updated_at=now() WHERE event_id=$1",
      [eventId, message],
    );
  }

  async markWebhookProcessed(eventId: string): Promise<void> {
    await this.database.query(
      "UPDATE webhook_events SET status='processed',processed_at=now(),updated_at=now() WHERE event_id=$1",
      [eventId],
    );
  }
}
