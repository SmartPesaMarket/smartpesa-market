-- SmartPesa Market initial database schema
-- Run this file in the Supabase SQL Editor for your project.
-- Never put a service-role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category text not null,
  price_ugx bigint not null check (price_ugx >= 0),
  compare_at_price_ugx bigint check (compare_at_price_ugx is null or compare_at_price_ugx >= price_ugx),
  product_type text not null default 'Digital download',
  image_url text,
  file_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_published_category_idx
  on public.products (is_published, category);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'refunded', 'failed')),
  currency text not null default 'UGX' check (currency = 'UGX'),
  subtotal_ugx bigint not null check (subtotal_ugx >= 0),
  total_ugx bigint not null check (total_ugx >= 0),
  payment_provider text,
  provider_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_customer_created_idx
  on public.orders (customer_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  quantity integer not null check (quantity > 0),
  unit_price_ugx bigint not null check (unit_price_ugx >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public visitors can read published catalogue items only.
drop policy if exists "Published products are visible to everyone" on public.products;
create policy "Published products are visible to everyone"
  on public.products for select
  using (is_published = true);

-- Customers can read and update their own basic profile.
drop policy if exists "Customers read their own profile" on public.profiles;
create policy "Customers read their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Customers update their own profile" on public.profiles;
create policy "Customers update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'customer');

-- Customers can see only their own orders and their own order lines.
drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read their own orders"
  on public.orders for select to authenticated
  using (auth.uid() = customer_id);

drop policy if exists "Customers read their own order items" on public.order_items;
create policy "Customers read their own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.customer_id = auth.uid()
    )
  );

-- Deliberately no browser-side INSERT/UPDATE policies for orders or order_items.
-- Trusted Edge Functions will create orders and update payment status only
-- after validating product prices and verifying provider callbacks server-side.

-- Create a profile for every newly registered user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- The profile role is managed only by trusted server/admin operations.
revoke update (role) on public.profiles from authenticated;
