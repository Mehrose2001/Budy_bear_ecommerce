alter table public.store_settings
  add column if not exists seasonal_banner jsonb not null default '{}'::jsonb;
