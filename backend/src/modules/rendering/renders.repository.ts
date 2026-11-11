import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RENDER_COLUMNS, type RenderRow } from './render.types';

export type RenderRecordInput = {
  renderId: string;
  templateId: string;
  userId: string;
  templateName: string;
  url: string;
  format: string;
  width: number;
  height: number;
};

export type BatchRecordInput = {
  batchId: string;
  templateId: string;
  userId: string;
  templateName: string;
  format: string;
  width: number;
  height: number;
  total: number;
};

@Injectable()
export class RendersRepository {
  constructor(private readonly database: DatabaseService) {}

  async saveRenderWithCredit(input: RenderRecordInput): Promise<RenderRow> {
    const client = await this.database.connect();
    try {
      await client.query('BEGIN');
      const credit = await client.query(
        'UPDATE users SET credits=credits-1,updated_at=now() WHERE id=$1 AND credits>=1 RETURNING credits',
        [input.userId],
      );
      if (!credit.rowCount)
        throw new ForbiddenException('Insufficient credits');
      const render = await client.query<RenderRow>(
        `INSERT INTO renders(render_id,template_id,user_id,template_name,url,format,width,height) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${RENDER_COLUMNS}`,
        [
          input.renderId,
          input.templateId,
          input.userId,
          input.templateName,
          input.url,
          input.format,
          input.width,
          input.height,
        ],
      );
      await client.query(
        `INSERT INTO usage_logs(user_id,action,credits_used,metadata) VALUES($1,'render',1,$2)`,
        [
          input.userId,
          JSON.stringify({
            renderId: input.renderId,
            templateId: input.templateId,
          }),
        ],
      );
      await client.query('COMMIT');
      return render.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listRenders(userId: string): Promise<RenderRow[]> {
    return (
      await this.database.query<RenderRow>(
        `SELECT ${RENDER_COLUMNS} FROM renders WHERE user_id=$1 AND is_batch=false ORDER BY created_at DESC`,
        [userId],
      )
    ).rows;
  }

  async listBatches(userId: string): Promise<RenderRow[]> {
    return (
      await this.database.query<RenderRow>(
        `SELECT ${RENDER_COLUMNS} FROM renders WHERE user_id=$1 AND is_batch=true ORDER BY created_at DESC`,
        [userId],
      )
    ).rows;
  }

  async findBatch(
    userId: string,
    batchId: string,
  ): Promise<RenderRow | undefined> {
    return (
      await this.database.query<RenderRow>(
        `SELECT ${RENDER_COLUMNS} FROM renders WHERE user_id=$1 AND is_batch=true AND batch_id=$2`,
        [userId, batchId],
      )
    ).rows[0];
  }

  async deleteRender(
    userId: string,
    id: string,
  ): Promise<RenderRow | undefined> {
    return (
      await this.database.query<RenderRow>(
        `DELETE FROM renders WHERE (id::text=$1 OR mongo_id=$1) AND user_id=$2 RETURNING ${RENDER_COLUMNS}`,
        [id, userId],
      )
    ).rows[0];
  }

  async availableCredits(userId: string): Promise<number> {
    return (
      (
        await this.database.query<{ credits: number }>(
          'SELECT credits FROM users WHERE id=$1',
          [userId],
        )
      ).rows[0]?.credits || 0
    );
  }

  async createBatch(input: BatchRecordInput): Promise<string> {
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO renders(render_id,template_id,user_id,template_name,format,width,height,is_batch,batch_id,batch_status,batch_total_rows,batch_completed_rows,batch_failed_rows) VALUES($1,$2,$3,$4,$5,$6,$7,true,$8,'processing',$9,0,0) RETURNING id`,
      [
        input.batchId,
        input.templateId,
        input.userId,
        input.templateName,
        input.format,
        input.width,
        input.height,
        input.batchId,
        input.total,
      ],
    );
    return result.rows[0].id;
  }

  async updateBatchProgress(
    id: string,
    userId: string,
    completed: number,
    failed: number,
  ): Promise<void> {
    await this.database.query(
      'UPDATE renders SET batch_completed_rows=$3,batch_failed_rows=$4,updated_at=now() WHERE id=$1 AND user_id=$2',
      [id, userId, completed, failed],
    );
  }

  async completeBatch(
    id: string,
    userId: string,
    url: string,
    status: string,
    completed: number,
    failed: number,
  ): Promise<void> {
    await this.database.query(
      'UPDATE renders SET url=$3,batch_zip_url=$3,batch_status=$4,batch_completed_rows=$5,batch_failed_rows=$6,updated_at=now() WHERE id=$1 AND user_id=$2',
      [id, userId, url, status, completed, failed],
    );
  }

  async failBatch(id: string, userId: string, error: string): Promise<void> {
    await this.database.query(
      "UPDATE renders SET batch_status='failed',batch_error=$3,updated_at=now() WHERE id=$1 AND user_id=$2",
      [id, userId, error],
    );
  }
}
