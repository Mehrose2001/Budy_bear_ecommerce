alter table public.store_settings
  add column if not exists legal_pages jsonb not null default '{}'::jsonb;

create table if not exists public.store_pages (
  slug text primary key check (slug in ('about', 'privacy', 'terms')),
  title text not null,
  intro text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists store_pages_updated_at on public.store_pages;
create trigger store_pages_updated_at
before update on public.store_pages
for each row execute function public.set_updated_at();

alter table public.store_pages enable row level security;

drop policy if exists store_pages_public_read on public.store_pages;
create policy store_pages_public_read on public.store_pages
  for select using (true);

drop policy if exists store_pages_admin_write on public.store_pages;
create policy store_pages_admin_write on public.store_pages
  for all using (public.is_admin())
  with check (public.is_admin());

insert into public.store_pages (slug, title, intro, body)
values
  ('about', 'About Budy Bear', '', ''),
  ('privacy', 'Privacy Policy', '', ''),
  ('terms', 'Terms & Conditions', '', '')
on conflict (slug) do nothing;
