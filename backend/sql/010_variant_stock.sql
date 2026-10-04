-- Per-color / per-size inventory on products.
alter table public.products
  add column if not exists variant_stock jsonb not null default '{}'::jsonb;

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
  v_color text;
  v_size text;
  color_key text;
  size_key text;
  available integer;
  remaining integer;
  variants jsonb;
  color_map jsonb;
  total_stock integer;
begin
  for item in select value from jsonb_array_elements(payload->'items')
  loop
    pid := (item->>'productId')::bigint;
    qty := greatest(1, coalesce((item->>'quantity')::integer, 0));
    v_color := coalesce(item->>'color', '');
    v_size := coalesce(item->>'size', '');
    select * into product_row from public.products where id = pid for update;
    if not found or product_row.is_active is false then
      raise exception 'A product in your cart is no longer available.';
    end if;

    variants := coalesce(product_row.variant_stock, '{}'::jsonb);
    if variants <> '{}'::jsonb and v_color <> '' then
      color_key := null;
      for color_key in select jsonb_object_keys(variants)
      loop
        if lower(color_key) = lower(v_color) then
          exit;
        end if;
        color_key := null;
      end loop;
      if color_key is null then
        raise exception '% does not have enough stock.', product_row.name;
      end if;
      color_map := coalesce(variants -> color_key, '{}'::jsonb);
      size_key := null;
      for size_key in select jsonb_object_keys(color_map)
      loop
        if lower(size_key) = lower(v_size) then
          exit;
        end if;
        size_key := null;
      end loop;
      if size_key is null then
        raise exception '% does not have enough stock.', product_row.name;
      end if;
      available := coalesce((color_map ->> size_key)::integer, 0);
      if available < qty then
        raise exception '% does not have enough stock.', product_row.name;
      end if;
      remaining := available - qty;
      variants := jsonb_set(variants, array[color_key, size_key], to_jsonb(remaining), true);
      total_stock := 0;
      for color_key in select jsonb_object_keys(variants)
      loop
        for size_key in select jsonb_object_keys(coalesce(variants -> color_key, '{}'::jsonb))
        loop
          total_stock := total_stock + coalesce(((variants -> color_key) ->> size_key)::integer, 0);
        end loop;
      end loop;
      update public.products
        set
          variant_stock = variants,
          stock_quantity = total_stock,
          stock = total_stock
        where id = pid;
    else
      if coalesce(product_row.stock_quantity, product_row.stock, 0) < qty then
        raise exception '% does not have enough stock.', product_row.name;
      end if;
      update public.products
        set
          stock_quantity = coalesce(stock_quantity, stock, 0) - qty,
          stock = coalesce(stock_quantity, stock, 0) - qty
        where id = pid;
    end if;
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

revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated, service_role;
