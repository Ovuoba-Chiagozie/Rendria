import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireString } from '../../common/pipes/required-string';
import { CloudinaryClient } from '../media/cloudinary.client';
import type { User } from '../users/user.types';
import { serializeTemplate } from './template.serializer';
import type { TemplateRow } from './template.types';
import { TemplatesRepository } from './templates.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templates: TemplatesRepository,
    private readonly media: CloudinaryClient,
  ) {}

  async createTemplate(user: User, body: Record<string, unknown>) {
    const input = CreateTemplateDto.parse(body);
    input.elements = input.elements.map((element) => {
      const clean = { ...element };
      delete clean.publicId;
      return clean;
    });
    return serializeTemplate(await this.templates.create(user.id, input));
  }

  async listTemplates(user: User) {
    return (await this.templates.list(user.id)).map(serializeTemplate);
  }

  async template(
    user: User,
    id: string,
    editable = true,
  ): Promise<TemplateRow> {
    const template = await this.templates.findAccessible(id, user.id, editable);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async getTemplate(user: User, id: string) {
    return serializeTemplate(await this.template(user, id));
  }

  async updateTemplate(user: User, id: string, body: Record<string, unknown>) {
    const input = UpdateTemplateDto.parse(body);
    const old = await this.template(user, id);
    const oldImages = this.imagePublicIds(old.elements);
    const newImages = this.imagePublicIds(input.elements);
    await this.media.deleteResources(
      oldImages.filter((id) => !newImages.includes(id)),
    );
    const updated = await this.templates.update(old.id, user.id, input);
    if (!updated) throw new NotFoundException('Template not found');
    return serializeTemplate(updated);
  }

  async deleteTemplate(user: User, id: string) {
    const template = await this.template(user, id);
    await this.media.deleteResources(
      [template.public_id, ...this.imagePublicIds(template.elements)].filter(
        Boolean,
      ),
    );
    await this.media.deleteFolder(`templates/${template.id}`);
    await this.templates.delete(template.id, user.id);
    return {
      message:
        'Template and related Cloudinary assets/folder deleted successfully',
      template: serializeTemplate(template),
    };
  }

  async upload(
    user: User,
    templateId: string,
    file: Express.Multer.File,
    kind: 'thumbnail' | 'image',
    elementId?: string,
  ) {
    const template = await this.template(user, templateId);
    if (!file) throw new BadRequestException('No file provided');
    const publicId =
      kind === 'thumbnail'
        ? template.id
        : requireString(elementId, 'elementId');
    const folder =
      kind === 'thumbnail' ? 'thumbnails' : `templates/${template.id}/images`;
    const result = await this.media.uploadImage(file.buffer, folder, publicId);
    if (kind === 'thumbnail') {
      await this.templates.setThumbnail(
        template.id,
        user.id,
        result.secure_url,
        result.public_id,
      );
    }
    return {
      message:
        kind === 'thumbnail'
          ? 'Thumbnail uploaded successfully'
          : 'Image uploaded successfully',
      url: result.secure_url,
      public_id: result.public_id,
    };
  }

  private imagePublicIds(elements: Record<string, unknown>[]): string[] {
    return elements
      .filter(
        (element) =>
          element.type === 'image' && typeof element.publicId === 'string',
      )
      .map((element) => element.publicId as string);
  }
}
