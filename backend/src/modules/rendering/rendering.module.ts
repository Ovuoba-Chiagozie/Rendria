import { Module } from '@nestjs/common';
import { RenderingController } from './rendering.controller';
import { RenderingService } from './rendering.service';
import { TemplatesModule } from '../templates/templates.module';
import { MediaModule } from '../media/media.module';
import { RendersRepository } from './renders.repository';
import { BatchRenderService } from './batch-render.service';
import { RendererClient } from './clients/renderer.client';

@Module({
  imports: [TemplatesModule, MediaModule],
  controllers: [RenderingController],
  providers: [
    RenderingService,
    BatchRenderService,
    RendersRepository,
    RendererClient,
  ],
})
export class RenderingModule {}
