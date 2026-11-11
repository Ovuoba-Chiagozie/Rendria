import { Injectable } from '@nestjs/common';
import { env } from '../../config';
import type { User } from '../users/user.types';
import { TemplatesService } from '../templates/templates.service';

@Injectable()
export class AutomationService {
  constructor(private readonly templates: TemplatesService) {}

  async automation(user: User, id: string) {
    const t = await this.templates.template(user, id, false);
    const headers = ['template_id'];
    for (const item of t.elements) {
      const n = typeof item.name === 'string' ? item.name : '';
      if (!n) continue;
      const type = item.type;
      headers.push(
        ...(type === 'text'
          ? [`${n}_content`, `${n}_fontSize`, `${n}_color`]
          : type === 'image'
            ? [`${n}_src`]
            : [`${n}_content`]),
      );
    }
    return {
      success: true,
      data: {
        templateId: t.id,
        templateName: t.name,
        columnHeaders: [
          ...new Set(headers),
          'format',
          'ready',
          'status',
          'image_url',
          'notes',
        ],
        sheetTemplateUrl: env.googleSheetTemplateUrl,
        apiUrl: `${env.apiBaseUrl}/v1/render`,
      },
    };
  }
}
