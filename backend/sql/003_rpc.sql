alter table public.orders
  add column if not exists coupon_code text;

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  order_row public.orders;
  new_id text;
  qty integer;
  pid bigint;
  payment_method text;
begin
  for item in select value from jsonb_array_elements(payload->'items')
  loop
    pid := (item->>'productId')::bigint;
    qty := greatest(1, coalesce((item->>'quantity')::integer, 0));
    select * into product_row from public.products where id = pid for update;
    if not found then
      raise exception 'A product in your cart is no longer available.';
    end if;
    if product_row.stock < qty then
      raise exception '% does not have enough stock.', product_row.name;
    end if;
    update public.products
      set stock = stock - qty
      where id = pid;
  end loop;

  new_id := 'BB-' || nextval('public.order_number_seq')::text;
  payment_method := coalesce(payload->>'paymentMethod', 'cod');

  insert into public.orders (
    id,
    user_id,
    items,
    subtotal,
    discount,
    shipping,
    total,
    delivery_method,
    payment_method,
    payment_status,
    order_status,
    shipping_address,
    customer,
    notes,
    coupon_code
  )
  values (
    new_id,
    nullif(payload->>'userId', '')::uuid,
    payload->'items',
    (payload->>'subtotal')::numeric,
    coalesce((payload->>'discount')::numeric, 0),
    coalesce((payload->>'shipping')::numeric, 0),
    (payload->>'total')::numeric,
    payload->>'deliveryMethod',
    payment_method,
    'pending',
    'pending',
    payload->'shippingAddress',
    payload->'customer',
    coalesce(payload->>'notes', ''),
    nullif(payload->>'couponCode', '')
  )
  returning * into order_row;

  return to_jsonb(order_row);
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
  select * into product_row from public.products where id = p_product_id;
  if not found then
    raise exception 'Product not found';
  end if;

  insert into public.reviews (
    id,
    product_id,
    product_name,
    author,
    user_id,
    rating,
    title,
    comment,
    status
  )
  values (
    gen_random_uuid()::text,
    p_product_id,
    product_row.name,
    p_author,
    p_user_id,
    p_rating,
    coalesce(p_title, ''),
    coalesce(p_comment, ''),
    'Published'
  )
  returning * into review_row;

  update public.products
    set
      review_count = review_count + 1,
      rating = round(
        ((rating * review_count) + p_rating)::numeric / (review_count + 1),
        2
      )
    where id = p_product_id;

  return review_row;
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
revoke all on function public.submit_review(bigint, text, integer, text, text, uuid) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
grant execute on function public.submit_review(bigint, text, integer, text, text, uuid) to service_role;
