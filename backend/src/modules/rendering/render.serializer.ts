import type { RenderRow } from './render.types';

export function serializeRender(render: RenderRow) {
  return {
    ...render,
    _id: render.id,
    isBatch: render.is_batch,
    batchId: render.batch_id,
    batchStatus: render.batch_status,
    batchZipUrl: render.batch_zip_url,
    batchTotalRows: render.batch_total_rows,
    batchCompletedRows: render.batch_completed_rows,
    batchFailedRows: render.batch_failed_rows,
    batchError: render.batch_error,
  };
}
