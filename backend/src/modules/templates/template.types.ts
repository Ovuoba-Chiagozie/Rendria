export type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  elements: Record<string, unknown>[];
  thumbnail_url: string;
  public_id: string;
  canvas_width: number;
  canvas_height: number;
  counters: Record<string, number>;
  premade: boolean;
  created_at: string;
  updated_at: string;
};

export const TEMPLATE_COLUMNS =
  'id,user_id,name,elements,thumbnail_url,public_id,canvas_width,canvas_height,counters,premade,created_at,updated_at';
