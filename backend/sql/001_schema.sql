create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Customer'),
    coalesce(new.raw_user_meta_data->>'phone', null),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text not null default '',
  image text,
  subcategories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table if not exists public.products (
  id bigint primary key,
  name text not null,
  slug text unique not null,
  description text not null default '',
  category_id text not null references public.categories (id) on delete restrict,
  subcategory text not null default '',
  price numeric(12, 2) not null,
  sale_price numeric(12, 2),
  images jsonb not null default '[]'::jsonb,
  color_images jsonb not null default '[]'::jsonb,
  color_swatches jsonb not null default '{}'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  stock integer not null default 0 check (stock >= 0),
  rating numeric(3, 2) not null default 5,
  review_count integer not null default 0,
  brand text not null default 'Budy Bear',
  featured boolean not null default false,
  new_arrival boolean not null default false,
  best_seller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_slug_idx on public.products (slug);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create sequence if not exists public.product_id_seq start 100;
create sequence if not exists public.order_number_seq start 1001;

create or replace function public.next_product_id()
returns bigint
language sql
as $$
  select nextval('public.product_id_seq');
$$;

create or replace function public.next_order_number()
returns bigint
language sql
as $$
  select nextval('public.order_number_seq');
$$;

create or replace function public.sync_product_id_seq()
returns bigint
language plpgsql
as $$
declare
  next_id bigint;
begin
  select coalesce(max(id), 99) + 1 into next_id from public.products;
  perform setval('public.product_id_seq', next_id, false);
  return next_id;
end;
$$;

create table if not exists public.orders (
  id text primary key,
  user_id uuid references public.profiles (id) on delete set null,
  items jsonb not null,
  subtotal numeric(12, 2) not null,
  discount numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  delivery_method text not null check (delivery_method in ('standard', 'express')),
  payment_method text not null default 'cod',
  payment_status text not null default 'Unpaid',
  order_status text not null default 'pending',
  shipping_address jsonb not null,
  customer jsonb not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_user_idx on public.orders (user_id);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.reviews (
  id text primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  product_name text,
  author text not null,
  user_id uuid references public.profiles (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  comment text not null default '',
  status text not null default 'Published' check (status in ('Published', 'Hidden', 'Pending')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews (product_id, status);

create table if not exists public.wishlists (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.coupons (
  id text primary key,
  code text unique not null,
  label text not null,
  discount_percent numeric(5, 2) not null,
  min_order numeric(12, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create table if not exists public.banners (
  id text primary key,
  title text not null,
  image text not null,
  href text not null default '/products',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists banners_updated_at on public.banners;
create trigger banners_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'Budy Bear',
  announcement text not null default '',
  support_email text not null default 'budybear2026@gmail.com',
  support_phone text not null default '+92 333 0370236',
  updated_at timestamptz not null default now()
);

drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

insert into public.store_settings (id, store_name, announcement, support_email, support_phone)
values (
  1,
  'Budy Bear',
  'Free Delivery on Orders Above Rs. 3,000',
  'budybear2026@gmail.com',
  '+92 333 0370236'
)
on conflict (id) do nothing;
