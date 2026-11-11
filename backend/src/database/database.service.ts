import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { env } from '../config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: env.databaseUrl,
    max: Number(process.env.DATABASE_POOL_MAX || 2),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: env.production ? { rejectUnauthorized: true } : undefined,
  });
  async onModuleInit() {
    if (env.databaseUrl) {
      attachDatabasePool(this.pool);
      await this.pool.query('SELECT 1');
    }
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ) {
    return this.pool.query<T>(text, values);
  }
  connect(): Promise<PoolClient> {
    return this.pool.connect();
  }
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
