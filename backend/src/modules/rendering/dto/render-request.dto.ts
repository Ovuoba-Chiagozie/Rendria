import { BadRequestException } from '@nestjs/common';
import { requireString } from '../../../common/pipes/required-string';

export class RenderRequestDto {
  templateId!: string;
  format!: string;
  width?: number;
  height?: number;
  modifications!: Record<string, Record<string, unknown>>;

  static parse(body: Record<string, unknown>): RenderRequestDto {
    const normalized = normalizeRenderRequest(body);
    const templateId = requireString(normalized.templateId, 'templateId');
    const format =
      typeof normalized.format === 'string'
        ? normalized.format.toLowerCase()
        : 'png';
    if (!['png', 'jpeg', 'webp'].includes(format)) {
      throw new BadRequestException('format must be one of png, jpeg, webp');
    }
    for (const field of ['width', 'height'] as const) {
      const value = normalized[field];
      if (
        value !== undefined &&
        (!Number.isInteger(value) ||
          Number(value) < 100 ||
          Number(value) > 5000)
      ) {
        throw new BadRequestException(`${field} must be between 100 and 5000`);
      }
    }
    const modifications = normalized.modifications;
    if (
      modifications !== undefined &&
      (modifications === null ||
        typeof modifications !== 'object' ||
        Array.isArray(modifications))
    ) {
      throw new BadRequestException('modifications must be an object');
    }
    if (
      modifications &&
      Object.values(modifications).some(
        (changes) =>
          changes === null ||
          typeof changes !== 'object' ||
          Array.isArray(changes),
      )
    ) {
      throw new BadRequestException('each modification must be an object');
    }
    return {
      templateId,
      format,
      width: normalized.width as number | undefined,
      height: normalized.height as number | undefined,
      modifications: (modifications || {}) as Record<
        string,
        Record<string, unknown>
      >,
    };
  }
}

export function normalizeRenderRequest(
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
  const normalized = walk(body) as Record<string, unknown>;
  if (body.modifications && typeof body.modifications === 'object') {
    normalized.modifications = Object.fromEntries(
      Object.entries(body.modifications).map(([name, value]) => [
        name,
        walk(value),
      ]),
    );
  }
  return normalized;
}
