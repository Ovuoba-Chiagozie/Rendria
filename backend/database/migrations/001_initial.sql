CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, name TEXT, credits INTEGER NOT NULL DEFAULT 30 CHECK (credits >= 0),
  lemon_subscription_id TEXT, subscription_plan TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT, subscription_current_period_end TIMESTAMPTZ,
  subscription_updated_at TIMESTAMPTZ, mongo_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_id TEXT NOT NULL, encrypted_key TEXT NOT NULL, hashed_key TEXT NOT NULL UNIQUE,
  revoked BOOLEAN NOT NULL DEFAULT false, last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, elements JSONB NOT NULL DEFAULT '[]', thumbnail_url TEXT NOT NULL DEFAULT '',
  public_id TEXT NOT NULL DEFAULT '', canvas_width INTEGER NOT NULL DEFAULT 800,
  canvas_height INTEGER NOT NULL DEFAULT 600, counters JSONB NOT NULL DEFAULT '{}',
  premade BOOLEAN NOT NULL DEFAULT false, mongo_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);

CREATE TABLE IF NOT EXISTS renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), render_id TEXT NOT NULL UNIQUE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, template_name TEXT NOT NULL,
  url TEXT, format TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL,
  is_batch BOOLEAN NOT NULL DEFAULT false, batch_id TEXT, batch_status TEXT,
  batch_zip_url TEXT, batch_total_rows INTEGER, batch_completed_rows INTEGER,
  batch_failed_rows INTEGER, batch_error TEXT, mongo_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS renders_user_id_idx ON renders(user_id);
CREATE INDEX IF NOT EXISTS renders_batch_id_idx ON renders(batch_id);

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, credits_used INTEGER NOT NULL, metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL, payload JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  error TEXT, processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
