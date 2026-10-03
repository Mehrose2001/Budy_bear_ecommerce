alter table public.reviews
  add column if not exists is_testimonial boolean not null default false;

create index if not exists reviews_testimonial_idx
  on public.reviews (is_testimonial, created_at desc);

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (
    status in ('Published', 'Testimonial')
    or is_approved = true
    or is_testimonial = true
    or public.is_admin()
  );

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
    and (
      is_approved = true
      or is_testimonial = true
      or status in ('Published', 'Testimonial')
    );

  update public.products
  set
    review_count = coalesce(stats.review_count, 0),
    rating = coalesce(stats.rating, 0)
  where id = p_product_id;
end;
$$;
