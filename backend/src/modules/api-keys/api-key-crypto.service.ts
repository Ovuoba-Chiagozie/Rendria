import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { env } from '../../config';

@Injectable()
export class ApiKeyCryptoService {
  create() {
    const key = randomBytes(36).toString('base64url').slice(0, 48);
    const keyId = randomBytes(8).toString('hex');
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      Buffer.from(env.apiKeyEncKey, 'base64'),
      iv,
    );
    const data = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      key,
      keyId,
      encrypted: JSON.stringify({
        v: 1,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        data: data.toString('base64'),
      }),
      hash: this.hash(key),
    };
  }

  hash(key: string) {
    return createHash('sha256').update(key).digest('hex');
  }

  decrypt(payload: string) {
    const value = JSON.parse(payload) as {
      iv: string;
      tag: string;
      data: string;
    };
    const decipher = createDecipheriv(
      'aes-256-gcm',
      Buffer.from(env.apiKeyEncKey, 'base64'),
      Buffer.from(value.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(value.data, 'base64')),
      decipher.final(),
    ]).toString();
  }
}
