alter table public.store_settings
  add column if not exists seasonal_collection text not null default 'winter';

alter table public.store_settings
  drop constraint if exists store_settings_seasonal_collection_check;

alter table public.store_settings
  add constraint store_settings_seasonal_collection_check
  check (seasonal_collection in ('winter', 'summer'));
