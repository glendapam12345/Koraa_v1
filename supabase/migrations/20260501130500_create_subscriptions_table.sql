create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revenuecat_app_user_id text not null unique,
  is_active boolean not null default false,
  entitlement_ids text[] not null default '{}',
  product_id text,
  store text,
  environment text,
  purchased_at timestamptz,
  expires_at timestamptz,
  last_event_type text,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_is_active_idx on public.subscriptions (is_active);
create index if not exists subscriptions_expires_at_idx on public.subscriptions (expires_at desc);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists update_subscriptions_updated_at on public.subscriptions;
create trigger update_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.update_updated_at_column();
