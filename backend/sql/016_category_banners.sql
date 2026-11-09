-- Optional additive migration for first-class category banner columns.
-- Do not run on production without owner approval.
-- Until then, banners are stored in store_settings.legal_pages._categoryBanners.

alter table public.categories
  add column if not exists banner jsonb default '{}'::jsonb;

alter table public.categories
  add column if not exists subcategory_banners jsonb default '{}'::jsonb;
