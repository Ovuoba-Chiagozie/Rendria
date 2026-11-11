import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { User } from '../users/user.types';
import { ApiKeysService } from './api-keys.service';
import { RevokeApiKeyDto } from './dto/revoke-api-key.dto';

@Controller('app/api-keys')
@UseGuards(SessionAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  async list(@CurrentUser() user: User) {
    return this.apiKeys.listKeys(user);
  }

  @Post('regenerate')
  async regenerate(@CurrentUser() user: User) {
    return this.apiKeys.regenerateKey(user);
  }

  @Post('revoke')
  async revoke(@CurrentUser() user: User, @Body() body: RevokeApiKeyDto) {
    return this.apiKeys.revokeKey(user, body.keyId || '');
  }
}
