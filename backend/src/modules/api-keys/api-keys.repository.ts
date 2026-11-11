import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { USER_COLUMNS, type User } from '../users/user.types';
import type { ApiKeyMaterial, ApiKeyRow } from './api-key.types';
import type { PoolClient } from 'pg';

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly database: DatabaseService) {}

  async insert(
    userId: string,
    material: ApiKeyMaterial,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      'INSERT INTO api_keys (user_id,key_id,encrypted_key,hashed_key) VALUES ($1,$2,$3,$4)',
      [userId, material.keyId, material.encrypted, material.hash],
    );
  }

  async findActiveUser(hash: string): Promise<User | undefined> {
    const columns = USER_COLUMNS.split(',')
      .map((column) => `u.${column}`)
      .join(',');
    const result = await this.database.query<User>(
      `SELECT ${columns} FROM api_keys k JOIN users u ON u.id=k.user_id WHERE k.hashed_key=$1 AND k.revoked=false`,
      [hash],
    );
    return result.rows[0];
  }

  async markUsed(hash: string): Promise<void> {
    await this.database.query(
      'UPDATE api_keys SET last_used_at=now() WHERE hashed_key=$1',
      [hash],
    );
  }

  async listActive(userId: string): Promise<ApiKeyRow[]> {
    return (
      await this.database.query<ApiKeyRow>(
        'SELECT key_id,encrypted_key,created_at FROM api_keys WHERE user_id=$1 AND revoked=false ORDER BY created_at DESC',
        [userId],
      )
    ).rows;
  }

  async regenerate(userId: string, material: ApiKeyMaterial): Promise<void> {
    const client = await this.database.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE api_keys SET revoked=true WHERE user_id=$1 AND revoked=false',
        [userId],
      );
      await client.query(
        'INSERT INTO api_keys (user_id,key_id,encrypted_key,hashed_key) VALUES ($1,$2,$3,$4)',
        [userId, material.keyId, material.encrypted, material.hash],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async revoke(userId: string, keyId: string): Promise<boolean> {
    const result = await this.database.query(
      'UPDATE api_keys SET revoked=true WHERE user_id=$1 AND key_id=$2 AND revoked=false',
      [userId, keyId],
    );
    return Boolean(result.rowCount);
  }
}
