-- Allow logged-in admins to delete orders via the admin JWT (when service role is not on the app server).
-- Run once in Supabase: SQL Editor → New query → paste → Run.

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
  for delete using (public.is_admin());

drop policy if exists order_items_admin_delete on public.order_items;
create policy order_items_admin_delete on public.order_items
  for delete using (public.is_admin());
