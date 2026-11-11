import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TEMPLATE_COLUMNS, type TemplateRow } from './template.types';

export type TemplateInput = {
  name: string;
  elements: Record<string, unknown>[];
  width: number;
  height: number;
  counters: Record<string, unknown>;
  thumbnail: string;
};

@Injectable()
export class TemplatesRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(userId: string, input: TemplateInput): Promise<TemplateRow> {
    const result = await this.database.query<TemplateRow>(
      `INSERT INTO templates (user_id,name,elements,thumbnail_url,canvas_width,canvas_height,counters) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${TEMPLATE_COLUMNS}`,
      [
        userId,
        input.name,
        JSON.stringify(input.elements),
        input.thumbnail,
        input.width,
        input.height,
        JSON.stringify(input.counters),
      ],
    );
    return result.rows[0];
  }

  async list(userId: string): Promise<TemplateRow[]> {
    return (
      await this.database.query<TemplateRow>(
        `SELECT ${TEMPLATE_COLUMNS} FROM templates WHERE user_id=$1 OR premade=true ORDER BY created_at DESC`,
        [userId],
      )
    ).rows;
  }

  async findAccessible(
    id: string,
    userId: string,
    editable: boolean,
  ): Promise<TemplateRow | undefined> {
    const condition = editable
      ? 'user_id=$2 AND premade=false'
      : '(user_id=$2 OR premade=true)';
    return (
      await this.database.query<TemplateRow>(
        `SELECT ${TEMPLATE_COLUMNS} FROM templates WHERE (id::text=$1 OR mongo_id=$1) AND ${condition}`,
        [id, userId],
      )
    ).rows[0];
  }

  async update(
    id: string,
    userId: string,
    input: TemplateInput,
  ): Promise<TemplateRow | undefined> {
    return (
      await this.database.query<TemplateRow>(
        `UPDATE templates SET name=$3,elements=$4,thumbnail_url=CASE WHEN $5='' THEN thumbnail_url ELSE $5 END,canvas_width=$6,canvas_height=$7,counters=$8,updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING ${TEMPLATE_COLUMNS}`,
        [
          id,
          userId,
          input.name,
          JSON.stringify(input.elements),
          input.thumbnail,
          input.width,
          input.height,
          JSON.stringify(input.counters),
        ],
      )
    ).rows[0];
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.database.query(
      'DELETE FROM templates WHERE id=$1 AND user_id=$2',
      [id, userId],
    );
  }

  async setThumbnail(
    id: string,
    userId: string,
    url: string,
    publicId: string,
  ): Promise<void> {
    await this.database.query(
      'UPDATE templates SET thumbnail_url=$3,public_id=$4,updated_at=now() WHERE id=$1 AND user_id=$2',
      [id, userId, url, publicId],
    );
  }
}
