alter table public.store_settings
  add column if not exists seo jsonb not null default '{}'::jsonb;

alter table public.products
  add column if not exists seo jsonb not null default '{}'::jsonb;

alter table public.categories
  add column if not exists seo jsonb not null default '{}'::jsonb;

alter table public.categories
  add column if not exists subcategory_seo jsonb not null default '{}'::jsonb;
