import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { env } from '../../config';
import { TemplatesService } from '../templates/templates.service';
import type { User } from '../users/user.types';
import { RendererClient } from './clients/renderer.client';
import { RenderRequestDto } from './dto/render-request.dto';
import { serializeRender } from './render.serializer';
import { RendersRepository } from './renders.repository';
import { renderDocument } from './renderer/html-renderer.service';

const MODIFIABLE_FIELDS: Record<string, string[]> = {
  text: [
    'content',
    'color',
    'fontSize',
    'family',
    'textAlignIndex',
    'rotation',
    'x',
    'y',
    'width',
    'height',
  ],
  image: [
    'src',
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'borderWidth',
    'borderColor',
    'borderRadius',
    'objectFit',
  ],
  shape: [
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'fill',
    'strokeColor',
    'strokeWidth',
  ],
  'qr-code': ['x', 'y', 'width', 'height', 'rotation', 'value'],
  barcode: ['x', 'y', 'width', 'height', 'rotation', 'value', 'format'],
  'star-rating': ['x', 'y', 'width', 'height', 'rotation', 'rating'],
};

@Injectable()
export class RenderingService {
  constructor(
    private readonly templates: TemplatesService,
    private readonly renders: RendersRepository,
    private readonly renderer: RendererClient,
  ) {}

  async render(user: User, body: Record<string, unknown>) {
    const input = RenderRequestDto.parse(body);
    const template = await this.templates.template(
      user,
      input.templateId,
      false,
    );
    if (!Array.isArray(template.elements))
      throw new BadRequestException('invalid template elements');
    if (!(await this.renders.availableCredits(user.id))) {
      throw new ForbiddenException('Insufficient credits');
    }

    const byName = new Map(
      template.elements.map((element) => [String(element.name), element]),
    );
    for (const [name, changes] of Object.entries(input.modifications)) {
      const element = byName.get(name);
      if (!element)
        throw new BadRequestException(
          `Element '${name}' not found in template`,
        );
      for (const field of Object.keys(changes)) {
        if (!MODIFIABLE_FIELDS[String(element.type)]?.includes(field)) {
          throw new BadRequestException(
            `Field '${field}' is not valid for element type '${String(element.type)}'`,
          );
        }
      }
    }

    const elements = template.elements.map((element) => ({
      ...element,
      ...(input.modifications[String(element.name)] || {}),
    }));
    const width = input.width || template.canvas_width;
    const height = input.height || template.canvas_height;
    const output = await this.renderer.render({
      html: await renderDocument(
        elements,
        width,
        height,
        `${env.apiBaseUrl}/assets/placeholder.svg`,
      ),
      width,
      height,
      format: input.format,
      templateId: template.id,
    });
    const row = await this.renders.saveRenderWithCredit({
      renderId: output.renderId,
      templateId: template.id,
      userId: user.id,
      templateName: template.name,
      url: output.url,
      format: input.format,
      width,
      height,
    });
    return serializeRender(row);
  }

  async listRenders(user: User) {
    return (await this.renders.listRenders(user.id)).map(serializeRender);
  }

  async listBatches(user: User) {
    return (await this.renders.listBatches(user.id)).map(serializeRender);
  }

  async getBatch(user: User, id: string) {
    const row = await this.renders.findBatch(user.id, id);
    if (!row) throw new NotFoundException('Batch not found');
    return serializeRender(row);
  }

  async deleteRender(user: User, id: string) {
    const row = await this.renders.deleteRender(user.id, id);
    if (!row) throw new NotFoundException('Render not found or unauthorized');
    return {
      message:
        'Render and related Cloudinary assets/folder deleted successfully',
      render: serializeRender(row),
    };
  }
}
