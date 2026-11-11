export type RenderRow = {
  id: string;
  render_id: string;
  template_id: string;
  user_id: string;
  template_name: string;
  url: string | null;
  format: string;
  width: number;
  height: number;
  is_batch: boolean;
  batch_id: string | null;
  batch_status: string | null;
  batch_zip_url: string | null;
  batch_total_rows: number | null;
  batch_completed_rows: number | null;
  batch_failed_rows: number | null;
  batch_error: string | null;
  created_at: string;
  updated_at: string;
};

export const RENDER_COLUMNS =
  'id,render_id,template_id,user_id,template_name,url,format,width,height,is_batch,batch_id,batch_status,batch_zip_url,batch_total_rows,batch_completed_rows,batch_failed_rows,batch_error,created_at,updated_at';
