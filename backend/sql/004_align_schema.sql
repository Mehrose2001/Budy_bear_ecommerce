-- Align live Budy Bear schema with the app spec without dropping seeded catalog.
-- Extra UI columns (sizes, colors, banners, coupons, jsonb order payload) are kept.

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

alter table public.profiles
  add column if not exists address text,
  add column if not exists city text;

alter table public.categories
  add column if not exists image_url text,
  add column if not exists is_active boolean not null default true;

update public.categories
set image_url = image
where image_url is null and image is not null;

alter table public.products
  add column if not exists sku text,
  add column if not exists compare_at_price numeric(12, 2),
  add column if not exists stock_quantity integer,
  add column if not exists is_active boolean not null default true,
  add column if not exists is_featured boolean not null default false;

update public.products
set
  stock_quantity = coalesce(stock_quantity, stock, 0),
  is_featured = featured,
  compare_at_price = coalesce(compare_at_price, sale_price),
  is_active = coalesce(is_active, true);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_compare_at_price_check'
  ) then
    alter table public.products
      add constraint products_compare_at_price_check
      check (compare_at_price is null or compare_at_price >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_stock_quantity_check'
  ) then
    alter table public.products
      add constraint products_stock_quantity_check
      check (stock_quantity >= 0);
  end if;
end $$;

create unique index if not exists products_sku_unique on public.products (sku)
  where sku is not null and sku <> '';
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_is_featured_idx on public.products (is_featured);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists categories_is_active_idx on public.categories (is_active);

create or replace function public.sync_product_spec_columns()
returns trigger
language plpgsql
as $$
begin
  if new.stock_quantity is null then
    new.stock_quantity := coalesce(new.stock, 0);
  else
    new.stock := coalesce(new.stock_quantity, 0);
  end if;
  new.is_featured := coalesce(new.is_featured, new.featured, false);
  new.featured := new.is_featured;
  if new.compare_at_price is null then
    new.compare_at_price := new.sale_price;
  else
    new.sale_price := new.compare_at_price;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_spec on public.products;
create trigger products_sync_spec
before insert or update on public.products
for each row execute function public.sync_product_spec_columns();

alter table public.reviews
  add column if not exists customer_name text,
  add column if not exists is_approved boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

update public.reviews
set
  customer_name = coalesce(nullif(customer_name, ''), author),
  is_approved = coalesce(is_approved, status = 'Published');

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create index if not exists reviews_product_id_idx on public.reviews (product_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_approved_idx on public.reviews (is_approved);

alter table public.orders
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists shipping_address_text text,
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists shipping_fee numeric(12, 2),
  add column if not exists total_amount numeric(12, 2),
  add column if not exists coupon_code text;

update public.orders
set
  customer_name = coalesce(customer_name, customer->>'fullName'),
  customer_email = coalesce(customer_email, customer->>'email'),
  customer_phone = coalesce(customer_phone, customer->>'phone'),
  shipping_address_text = coalesce(
    shipping_address_text,
    concat_ws(', ',
      shipping_address->>'address',
      shipping_address->>'city',
      shipping_address->>'province',
      shipping_address->>'postalCode'
    )
  ),
  city = coalesce(city, shipping_address->>'city'),
  postal_code = coalesce(postal_code, shipping_address->>'postalCode'),
  shipping_fee = coalesce(shipping_fee, shipping, 0),
  total_amount = coalesce(total_amount, total);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_order_status_idx on public.orders (order_status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,
  product_price numeric(12, 2) not null,
  quantity integer not null check (quantity > 0),
  subtotal numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Customer'),
    nullif(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
