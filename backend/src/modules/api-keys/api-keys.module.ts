import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyCryptoService } from './api-key-crypto.service';
import { ApiKeysRepository } from './api-keys.repository';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyCryptoService, ApiKeysRepository],
  exports: [ApiKeysService, ApiKeyCryptoService, ApiKeysRepository],
})
export class ApiKeysModule {}
