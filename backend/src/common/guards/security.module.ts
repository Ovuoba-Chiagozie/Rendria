import { Global, Module } from '@nestjs/common';
import { SessionAuthGuard } from './session-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { AuthModule } from '../../modules/auth/auth.module';
import { ApiKeysModule } from '../../modules/api-keys/api-keys.module';

@Global()
@Module({
  imports: [AuthModule, ApiKeysModule],
  providers: [SessionAuthGuard, ApiKeyAuthGuard],
  exports: [SessionAuthGuard, ApiKeyAuthGuard, AuthModule, ApiKeysModule],
})
export class SecurityModule {}
