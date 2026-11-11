import { ForbiddenException, Injectable } from '@nestjs/common';
import archiver from 'archiver';
import { randomBytes } from 'crypto';
import { PassThrough } from 'stream';
import { CloudinaryClient } from '../media/cloudinary.client';
import { TemplatesService } from '../templates/templates.service';
import type { User } from '../users/user.types';
import { BatchRenderRequestDto } from './dto/batch-render-request.dto';
import { RenderRequestDto } from './dto/render-request.dto';
import { RenderingService } from './rendering.service';
import { RendersRepository } from './renders.repository';

@Injectable()
export class BatchRenderService {
  constructor(
    private readonly rendering: RenderingService,
    private readonly templates: TemplatesService,
    private readonly renders: RendersRepository,
    private readonly media: CloudinaryClient,
  ) {}

  async batch(user: User, body: Record<string, unknown>) {
    const { requests } = BatchRenderRequestDto.parse(body);
    const first = RenderRequestDto.parse(requests[0]);
    const template = await this.templates.template(
      user,
      first.templateId,
      false,
    );
    const available = await this.renders.availableCredits(user.id);
    if (!available) throw new ForbiddenException('Insufficient credits');

    const affordable = Math.min(available, requests.length);
    const batchId = randomBytes(15).toString('base64url');
    const recordId = await this.renders.createBatch({
      batchId,
      templateId: template.id,
      userId: user.id,
      templateName: template.name,
      format: first.format,
      width: template.canvas_width,
      height: template.canvas_height,
      total: requests.length,
    });

    const refs: { render_id: string; url: string }[] = [];
    let failed = 0;
    for (let index = 0; index < affordable; index += 10) {
      const chunk = requests.slice(index, index + 10);
      const outcomes = await Promise.allSettled(
        chunk.map((request) => this.rendering.render(user, request)),
      );
      for (const outcome of outcomes) {
        if (outcome.status === 'fulfilled') {
          refs.push({
            render_id: outcome.value.render_id,
            url: outcome.value.url || '',
          });
        } else {
          failed++;
        }
      }
      await this.renders.updateBatchProgress(
        recordId,
        user.id,
        refs.length,
        failed,
      );
    }

    const status = failed ? (refs.length ? 'partial' : 'failed') : 'completed';
    try {
      const zip = await this.createZip(
        refs.map((ref) => ref.url),
        first.format,
      );
      const uploaded = await this.media.uploadZip(zip, batchId);
      await this.renders.completeBatch(
        recordId,
        user.id,
        uploaded.secure_url,
        status,
        refs.length,
        failed,
      );
      return {
        batchId,
        status,
        zip_url: uploaded.secure_url,
        total_requested: requests.length,
        total_processed: refs.length,
        total_failed: failed,
        credits_used: refs.length,
        insufficient_credits: requests.length > affordable,
        individual_renders: refs,
        message:
          affordable < requests.length
            ? `Only ${affordable} of ${requests.length} rows processed due to insufficient credits`
            : 'Batch completed successfully',
      };
    } catch (error) {
      await this.renders.failBatch(
        recordId,
        user.id,
        error instanceof Error ? error.message : 'batch failed',
      );
      throw error;
    }
  }

  private async createZip(urls: string[], format: string): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    output.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    const completed = new Promise<Buffer>((resolve, reject) => {
      output.once('end', () => resolve(Buffer.concat(chunks)));
      output.once('error', reject);
      archive.once('error', reject);
    });
    archive.pipe(output);
    for (let index = 0; index < urls.length; index++) {
      try {
        const response = await fetch(urls[index]);
        if (!response.ok) continue;
        archive.append(Buffer.from(await response.arrayBuffer()), {
          name: `render_${index + 1}.${format}`,
        });
      } catch {
        // Omit images that are no longer available at their source URL.
      }
    }
    await archive.finalize();
    return completed;
  }
}
