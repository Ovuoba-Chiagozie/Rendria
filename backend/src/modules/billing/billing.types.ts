export type LemonWebhookEvent = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string | undefined>;
  };
  data?: {
    id?: string | number;
    attributes?: {
      user_email?: string;
      variant_id?: string | number;
      renews_at?: string | number | null;
    };
  };
};
