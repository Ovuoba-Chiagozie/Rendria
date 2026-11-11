import { BadRequestException } from '@nestjs/common';
import { normalizeRenderRequest } from './render-request.dto';

export class BatchRenderRequestDto {
  requests!: Record<string, unknown>[];

  static parse(body: Record<string, unknown>): BatchRenderRequestDto {
    const requests = normalizeRenderRequest(body).requests;
    if (!Array.isArray(requests) || requests.length === 0) {
      throw new BadRequestException('Requests array is required');
    }
    if (requests.length > 1000) {
      throw new BadRequestException(
        'Requests array may contain at most 1000 rows',
      );
    }
    if (
      requests.some(
        (row) => row === null || typeof row !== 'object' || Array.isArray(row),
      )
    ) {
      throw new BadRequestException('each request must be an object');
    }
    return { requests: requests as Record<string, unknown>[] };
  }
}
