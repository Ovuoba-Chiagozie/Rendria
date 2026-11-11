import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { env } from '../../config';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly db: DatabaseService) {}

  async health() {
    try {
      if (env.databaseUrl) await this.db.query('SELECT 1');
      return {
        status: 'ok',
        environment: env.production ? 'production' : 'development',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unavailable',
      });
    }
  }

  root() {
    return {
      message: 'Rendria API is running',
      version: '1.0.0',
      environment: env.production ? 'production' : 'development',
    };
  }
}
