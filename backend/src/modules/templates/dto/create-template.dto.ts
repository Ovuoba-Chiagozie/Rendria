import { BadRequestException } from '@nestjs/common';
import { requireString } from '../../../common/pipes/required-string';
import type { TemplateInput } from '../templates.repository';

export class CreateTemplateDto {
  name!: string;
  elements!: Record<string, unknown>[];
  canvasSize!: { width: number; height: number };
  counters?: Record<string, unknown>;
  thumbnailUrl?: string;

  static parse(body: Record<string, unknown>): TemplateInput {
    const normalized = normalizeTemplate(body);
    const name = requireString(normalized.name, 'name');
    const canvas = normalized.canvasSize as
      { width?: number; height?: number } | undefined;
    if (
      name.length > 100 ||
      !canvas ||
      !Number.isInteger(canvas.width) ||
      !Number.isInteger(canvas.height) ||
      Number(canvas.width) < 1 ||
      Number(canvas.height) < 1 ||
      !Array.isArray(normalized.elements)
    ) {
      throw new BadRequestException({
        error: 'Validation failed',
        details: ['name, elements, and canvasSize width/height are required'],
      });
    }
    return {
      name,
      elements: normalized.elements as Record<string, unknown>[],
      width: canvas.width!,
      height: canvas.height!,
      counters: (normalized.counters || {}) as Record<string, unknown>,
      thumbnail:
        typeof normalized.thumbnailUrl === 'string'
          ? normalized.thumbnailUrl
          : '',
    };
  }
}

function normalizeTemplate(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
          walk(entry),
        ]),
      );
    }
    return value;
  };
  return walk(body) as Record<string, unknown>;
}
