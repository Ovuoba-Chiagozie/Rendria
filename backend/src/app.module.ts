import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { SecurityModule } from './common/guards/security.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AuthModule } from './modules/auth/auth.module';
import { AutomationModule } from './modules/automation/automation.module';
import { BillingModule } from './modules/billing/billing.module';
import { RenderingModule } from './modules/rendering/rendering.module';
import { HealthModule } from './modules/health/health.module';
import { TemplatesModule } from './modules/templates/templates.module';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    HealthModule,
    AuthModule,
    ApiKeysModule,
    TemplatesModule,
    RenderingModule,
    AutomationModule,
    BillingModule,
  ],
})
export class AppModule {}
