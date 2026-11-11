import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly api: HealthService) {}

  @Get()
  root() {
    return this.api.root();
  }

  @Get('health')
  health() {
    return this.api.health();
  }

  @Get('assets/placeholder.svg')
  placeholder(@Res() response: Response) {
    return response
      .type('image/svg+xml')
      .send(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e5e7eb"/><path d="M120 450l160-180 110 110 90-90 200 240H120z" fill="#9ca3af"/></svg>',
      );
  }
}
