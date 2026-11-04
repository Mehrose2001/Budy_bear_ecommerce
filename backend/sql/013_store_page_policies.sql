alter table public.store_pages drop constraint if exists store_pages_slug_check;

alter table public.store_pages
  add constraint store_pages_slug_check
  check (slug in (
    'about',
    'privacy',
    'terms',
    'complaints',
    'shipping',
    'exchange',
    'returns',
    'refund',
    'cancellation'
  ));

insert into public.store_pages (slug, title, intro, body)
values
  ('complaints', 'Customer Complaint Handling Policy', '', ''),
  ('shipping', 'Shipping & Delivery Policy', '', ''),
  ('exchange', 'Exchange Policy', '', ''),
  ('returns', 'Return Policy', '', ''),
  ('refund', 'Refund Policy', '', ''),
  ('cancellation', 'Order Cancellation Policy', '', '')
on conflict (slug) do nothing;
