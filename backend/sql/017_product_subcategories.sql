-- Review only. Do not run this against production.
-- Adds a list of subcategory names on each product while keeping the
-- existing subcategory text column as the first selected name.
-- Products that already have a single subcategory keep working before and
-- after this migration: the application reads that text value when the
-- new list is empty.

alter table public.products
  add column if not exists subcategories jsonb not null default '[]'::jsonb;

update public.products
set subcategories = jsonb_build_array(btrim(subcategory))
where btrim(coalesce(subcategory, '')) <> ''
  and btrim(subcategory) not like '[%'
  and (
    subcategories is null
    or subcategories = '[]'::jsonb
    or jsonb_typeof(subcategories) <> 'array'
    or jsonb_array_length(subcategories) = 0
  );

create index if not exists products_subcategories_idx
  on public.products using gin (subcategories);
