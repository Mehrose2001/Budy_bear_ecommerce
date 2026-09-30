-- RLS uses profile.role from auth.uid(), never a client-supplied role.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (is_active = true or public.is_admin());

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin())
  with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin())
  with check (public.is_admin());

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (is_approved = true or status = 'Published' or public.is_admin());

drop policy if exists reviews_insert_customer on public.reviews;
create policy reviews_insert_customer on public.reviews
  for insert with check (
    is_approved = false
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists reviews_admin_write on public.reviews;
create policy reviews_admin_write on public.reviews
  for update using (public.is_admin())
  with check (public.is_admin());

drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews
  for delete using (public.is_admin());

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
  );

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (user_id is null or user_id = auth.uid() or public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update using (public.is_admin())
  with check (public.is_admin());

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id is null or o.user_id = auth.uid())
    )
  );

drop policy if exists coupons_public_read on public.coupons;
create policy coupons_public_read on public.coupons
  for select using (active = true or public.is_admin());

drop policy if exists coupons_admin_write on public.coupons;
create policy coupons_admin_write on public.coupons
  for all using (public.is_admin())
  with check (public.is_admin());

drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners
  for select using (active = true or public.is_admin());

drop policy if exists banners_admin_write on public.banners;
create policy banners_admin_write on public.banners
  for all using (public.is_admin())
  with check (public.is_admin());

drop policy if exists settings_public_read on public.store_settings;
create policy settings_public_read on public.store_settings
  for select using (true);

drop policy if exists settings_admin_write on public.store_settings;
create policy settings_admin_write on public.store_settings
  for all using (public.is_admin())
  with check (public.is_admin());

drop policy if exists wishlists_own on public.wishlists;
create policy wishlists_own on public.wishlists
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.next_product_id() to authenticated, service_role;
grant execute on function public.next_order_number() to anon, authenticated, service_role;
