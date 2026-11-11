import type { TemplateRow } from './template.types';

export function serializeTemplate(template: TemplateRow) {
  return {
    _id: template.id,
    name: template.name,
    elements: template.elements,
    thumbnailUrl: template.thumbnail_url,
    publicId: template.public_id,
    userId: template.user_id,
    canvasSize: {
      width: template.canvas_width,
      height: template.canvas_height,
    },
    counters: template.counters,
    premade: template.premade,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
  };
}
