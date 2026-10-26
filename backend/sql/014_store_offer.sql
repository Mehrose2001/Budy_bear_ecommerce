alter table public.store_settings
  add column if not exists offer jsonb not null default '{}'::jsonb;
