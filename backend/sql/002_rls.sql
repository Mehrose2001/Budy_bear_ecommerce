alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.store_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (true);

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (true);

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (status = 'Published' or public.is_admin());

drop policy if exists coupons_public_read on public.coupons;
create policy coupons_public_read on public.coupons
  for select using (active = true or public.is_admin());

drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners
  for select using (active = true or public.is_admin());

drop policy if exists settings_public_read on public.store_settings;
create policy settings_public_read on public.store_settings
  for select using (true);

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
  );

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (user_id is null or user_id = auth.uid() or public.is_admin());

drop policy if exists wishlists_own on public.wishlists;
create policy wishlists_own on public.wishlists
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Writes go through the API service role. No public insert/update/delete policies
-- on catalog tables, so shoppers cannot mutate products from the anon key.

revoke all on function public.next_product_id() from public, anon, authenticated;
revoke all on function public.next_order_number() from public, anon, authenticated;
revoke all on function public.sync_product_id_seq() from public, anon, authenticated;
grant execute on function public.next_product_id() to service_role;
grant execute on function public.next_order_number() to service_role;
grant execute on function public.sync_product_id_seq() to service_role;
