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
  line_price numeric;
begin
  for item in select value from jsonb_array_elements(payload->'items')
  loop
    pid := (item->>'productId')::bigint;
    qty := greatest(1, coalesce((item->>'quantity')::integer, 0));
    select * into product_row from public.products where id = pid for update;
    if not found or product_row.is_active is false then
      raise exception 'A product in your cart is no longer available.';
    end if;
    if coalesce(product_row.stock_quantity, product_row.stock, 0) < qty then
      raise exception '% does not have enough stock.', product_row.name;
    end if;
    update public.products
      set
        stock_quantity = coalesce(stock_quantity, stock, 0) - qty,
        stock = coalesce(stock_quantity, stock, 0) - qty
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
    shipping_fee,
    total,
    total_amount,
    delivery_method,
    payment_method,
    payment_status,
    order_status,
    shipping_address,
    shipping_address_text,
    customer,
    customer_name,
    customer_email,
    customer_phone,
    city,
    postal_code,
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
    coalesce((payload->>'shipping')::numeric, 0),
    (payload->>'total')::numeric,
    (payload->>'total')::numeric,
    payload->>'deliveryMethod',
    payment_method,
    'pending',
    'pending',
    payload->'shippingAddress',
    concat_ws(', ',
      payload#>>'{shippingAddress,address}',
      payload#>>'{shippingAddress,city}',
      payload#>>'{shippingAddress,province}',
      payload#>>'{shippingAddress,postalCode}'
    ),
    payload->'customer',
    payload#>>'{customer,fullName}',
    payload#>>'{customer,email}',
    payload#>>'{customer,phone}',
    payload#>>'{shippingAddress,city}',
    payload#>>'{shippingAddress,postalCode}',
    coalesce(payload->>'notes', ''),
    nullif(payload->>'couponCode', '')
  )
  returning * into order_row;

  for item in select value from jsonb_array_elements(payload->'items')
  loop
    line_price := coalesce((item->>'unitPrice')::numeric, (item->>'price')::numeric, 0);
    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      subtotal
    )
    values (
      new_id,
      nullif(item->>'productId', '')::bigint,
      coalesce(item->>'name', 'Product'),
      line_price,
      greatest(1, coalesce((item->>'quantity')::integer, 1)),
      line_price * greatest(1, coalesce((item->>'quantity')::integer, 1))
    );
  end loop;

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
  select * into product_row from public.products where id = p_product_id and is_active = true;
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
    p_author,
    p_author,
    p_user_id,
    p_rating,
    coalesce(p_title, ''),
    coalesce(p_comment, ''),
    'Published',
    true
  )
  returning * into review_row;

  update public.products
    set
      review_count = (
        select count(*) from public.reviews
        where product_id = p_product_id and (is_approved = true or status = 'Published')
      ),
      rating = coalesce((
        select round(avg(rating)::numeric, 2) from public.reviews
        where product_id = p_product_id and (is_approved = true or status = 'Published')
      ), 0)
    where id = p_product_id;

  return review_row;
end;
$$;

revoke all on function public.place_order(jsonb) from public;
revoke all on function public.submit_review(bigint, text, integer, text, text, uuid) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated, service_role;
grant execute on function public.submit_review(bigint, text, integer, text, text, uuid) to anon, authenticated, service_role;

create or replace function public.get_order(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders;
begin
  select * into order_row from public.orders where id = p_id;
  if not found then
    return null;
  end if;
  return to_jsonb(order_row);
end;
$$;

grant execute on function public.get_order(text) to anon, authenticated, service_role;
