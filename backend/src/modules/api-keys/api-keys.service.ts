import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { requireString } from '../../common/pipes/required-string';
import { ApiKeyCryptoService } from './api-key-crypto.service';
import type { User } from '../users/user.types';
import { ApiKeysRepository } from './api-keys.repository';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly keys: ApiKeysRepository,
    private readonly crypto: ApiKeyCryptoService,
  ) {}

  async apiKeyUser(key?: string): Promise<User> {
    if (!key) throw new UnauthorizedException('API key missing');
    const hash = this.crypto.hash(key);
    const user = await this.keys.findActiveUser(hash);
    if (!user) throw new UnauthorizedException('Invalid or revoked API key');
    await this.keys.markUsed(hash);
    return user;
  }

  async listKeys(user: User) {
    const keys = await this.keys.listActive(user.id);
    return keys.map((key) => ({
      apiKey: this.crypto.decrypt(key.encrypted_key),
      keyId: key.key_id,
      createdAt: key.created_at,
    }));
  }

  async regenerateKey(user: User) {
    const material = this.crypto.create();
    await this.keys.regenerate(user.id, material);
    return {
      message: 'API key regenerated',
      apiKey: material.key,
      keyId: material.keyId,
      createdAt: new Date().toISOString(),
    };
  }

  async revokeKey(user: User, keyId: string) {
    const revoked = await this.keys.revoke(
      user.id,
      requireString(keyId, 'keyId'),
    );
    if (!revoked)
      throw new NotFoundException('API key not found or already revoked');
    return { message: 'API key revoked', keyId };
  }
}
