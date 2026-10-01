create or replace function public.refresh_product_review_stats(p_product_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  stats record;
begin
  select
    count(*)::integer as review_count,
    coalesce(round(avg(rating)::numeric, 2), 0) as rating
  into stats
  from public.reviews
  where product_id = p_product_id
    and (is_approved = true or status = 'Published');

  update public.products
  set
    review_count = coalesce(stats.review_count, 0),
    rating = coalesce(stats.rating, 0)
  where id = p_product_id;
end;
$$;

create or replace function public.submit_review(
  p_product_id bigint,
  p_author text,
  p_rating integer,
  p_title text,
  p_comment text,
  p_user_id uuid default null
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  product_row public.products;
  review_row public.reviews;
begin
  if p_author is null or length(trim(p_author)) < 2 then
    raise exception 'Please add your name.';
  end if;
  if p_comment is null or length(trim(p_comment)) < 8 then
    raise exception 'Please write a short review.';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Choose a rating from 1 to 5.';
  end if;

  select * into product_row
  from public.products
  where id = p_product_id and coalesce(is_active, true) = true;
  if not found then
    raise exception 'Product not found';
  end if;

  insert into public.reviews (
    id,
    product_id,
    product_name,
    author,
    customer_name,
    user_id,
    rating,
    title,
    comment,
    status,
    is_approved
  )
  values (
    gen_random_uuid()::text,
    p_product_id,
    product_row.name,
    trim(p_author),
    trim(p_author),
    p_user_id,
    p_rating,
    coalesce(nullif(trim(p_title), ''), 'Customer review'),
    trim(p_comment),
    'Published',
    true
  )
  returning * into review_row;

  perform public.refresh_product_review_stats(p_product_id);
  return review_row;
end;
$$;

create or replace function public.reviews_refresh_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_product_review_stats(old.product_id);
    return old;
  end if;
  perform public.refresh_product_review_stats(new.product_id);
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    perform public.refresh_product_review_stats(old.product_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_refresh_stats on public.reviews;
create trigger reviews_refresh_stats
after update or delete on public.reviews
for each row execute function public.reviews_refresh_stats();

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (
    status = 'Published'
    or is_approved = true
    or public.is_admin()
  );

revoke all on function public.submit_review(bigint, text, integer, text, text, uuid) from public;
revoke all on function public.refresh_product_review_stats(bigint) from public;
grant execute on function public.submit_review(bigint, text, integer, text, text, uuid) to anon, authenticated, service_role;
grant execute on function public.refresh_product_review_stats(bigint) to service_role;
