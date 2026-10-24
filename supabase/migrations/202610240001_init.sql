-- Easy Eyes initial schema. Apply with Supabase migrations before starting the app.
create extension if not exists pgcrypto;
create type public.product_status as enum ('draft','published','archived');
create type public.order_status as enum ('requested','confirmed','declined','expired','cancelled');
create type public.payment_status as enum ('not_collected');
create type public.review_status as enum ('pending','approved','hidden');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.addresses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, phone text not null, line_1 text not null, line_2 text,
  city text not null, state text not null, postal_code text not null, country text not null default 'IN' check (country='IN'),
  is_default boolean not null default false, created_at timestamptz not null default now()
);
create unique index addresses_one_default on public.addresses(user_id) where is_default;
create table public.categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  description text not null default '', display_order integer not null default 0, active boolean not null default true
);
create table public.collections (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  description text not null default '', hero_image_path text, published boolean not null default false,
  display_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  description text not null default '', category_id uuid references public.categories(id),
  base_price_minor integer not null check (base_price_minor>=0), currency text not null default 'INR' check (currency='INR'),
  material text, frame_shape text, fit text, specifications jsonb not null default '{}'::jsonb,
  status public.product_status not null default 'draft', featured_order integer,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index products_published_idx on public.products(status, featured_order, created_at desc);
create index products_search_idx on public.products using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));
create table public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
  sku text not null unique, frame_color text not null, lens_color text not null,
  price_minor integer not null check (price_minor>=0), stock_quantity integer not null default 0 check (stock_quantity>=0),
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index variants_product_idx on public.product_variants(product_id);
create table public.product_images (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
  variant_id uuid references public.product_variants(id), storage_path text not null, alt_text text not null,
  kind text not null default 'front', display_order integer not null default 0, created_at timestamptz not null default now()
);
create index product_images_order_idx on public.product_images(product_id,display_order);
create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  display_order integer not null default 0, primary key(collection_id,product_id)
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
  subtitle text not null default '', video_path text, poster_path text, image_path text,
  cta_label text, cta_href text, published boolean not null default false,
  display_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.carts (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade,
  guest_session_hash text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint cart_owner_one check ((user_id is not null) <> (guest_session_hash is not null))
);
create unique index cart_one_per_user on public.carts(user_id) where user_id is not null;
create table public.cart_items (
  id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id), quantity integer not null check (quantity>0 and quantity<=20),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(cart_id,variant_id)
);
create table public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,product_id)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), order_number bigint generated always as identity unique,
  user_id uuid not null references public.profiles(id), customer_email text not null,
  shipping_address_snapshot jsonb not null, subtotal_minor integer not null check (subtotal_minor>=0),
  shipping_minor integer not null check (shipping_minor>=0), total_minor integer not null check (total_minor>=0),
  currency text not null default 'INR' check (currency='INR'),
  order_status public.order_status not null default 'requested', payment_status public.payment_status not null default 'not_collected',
  customer_note text, idempotency_key uuid not null, reservation_expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,idempotency_key), check(total_minor=subtotal_minor+shipping_minor)
);
create index orders_user_date_idx on public.orders(user_id,created_at desc);
create index orders_expiry_idx on public.orders(reservation_expires_at) where order_status='requested';
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id), variant_id uuid references public.product_variants(id),
  product_name_snapshot text not null, sku_snapshot text not null, variant_snapshot jsonb not null,
  unit_price_minor integer not null check(unit_price_minor>=0), quantity integer not null check(quantity>0),
  line_total_minor integer not null check(line_total_minor=unit_price_minor*quantity)
);
create table public.order_status_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id), previous_status public.order_status,
  next_status public.order_status not null, note text, created_at timestamptz not null default now()
);
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(), variant_id uuid not null references public.product_variants(id),
  order_id uuid references public.orders(id), delta integer not null check(delta<>0), reason text not null,
  created_at timestamptz not null default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
  user_id uuid not null references public.profiles(id), rating integer not null check(rating between 1 and 5),
  title text not null, body text not null, status public.review_status not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(product_id,user_id)
);
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(), sender_name text not null, email text not null,
  subject text not null, body text not null, status text not null default 'new', created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
create function public.protect_profile_role() returns trigger language plpgsql set search_path='' as $$
begin if new.role is distinct from old.role and not public.is_admin() then raise exception 'role change denied'; end if; return new; end $$;
create trigger profiles_role_guard before update on public.profiles for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.collection_products enable row level security;
alter table public.campaigns enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
create policy profiles_self_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());
create policy addresses_owner on public.addresses for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy categories_read on public.categories for select using(active or public.is_admin());
create policy categories_admin on public.categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy collections_read on public.collections for select using(published or public.is_admin());
create policy collections_admin on public.collections for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy products_read on public.products for select using(status='published' or public.is_admin());
create policy products_admin on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy variants_read on public.product_variants for select using((active and exists(select 1 from public.products p where p.id=product_id and p.status='published')) or public.is_admin());
create policy variants_admin on public.product_variants for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy images_read on public.product_images for select using(exists(select 1 from public.products p where p.id=product_id and p.status='published') or public.is_admin());
create policy images_admin on public.product_images for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy collection_products_read on public.collection_products for select using(exists(select 1 from public.collections c where c.id=collection_id and c.published) and exists(select 1 from public.products p where p.id=product_id and p.status='published') or public.is_admin());
create policy collection_products_admin on public.collection_products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy campaigns_read on public.campaigns for select using(published or public.is_admin());
create policy campaigns_admin on public.campaigns for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy carts_owner on public.carts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy cart_items_owner on public.cart_items for all to authenticated using(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid())) with check(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid()));
create policy wishlist_owner on public.wishlists for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy orders_read on public.orders for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy order_items_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy order_events_read on public.order_status_events for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy movements_admin on public.inventory_movements for select to authenticated using(public.is_admin());
create policy reviews_read on public.reviews for select using(status='approved' or user_id=auth.uid() or public.is_admin());
create policy reviews_insert on public.reviews for insert to authenticated with check(
 user_id=auth.uid() and status='pending' and exists(
  select 1 from public.order_items i join public.orders o on o.id=i.order_id
  where i.product_id=reviews.product_id and o.user_id=auth.uid() and o.order_status='confirmed'
 )
);
create policy reviews_admin on public.reviews for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy contact_admin on public.contact_messages for select to authenticated using(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('catalog','catalog',false,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
('campaigns','campaigns',false,52428800,array['image/jpeg','image/png','image/webp','image/avif','video/mp4'])
on conflict(id) do nothing;
create policy media_approved_read on storage.objects for select using(
  public.is_admin() or
  (bucket_id='catalog' and exists(select 1 from public.product_images i join public.products p on p.id=i.product_id where i.storage_path=storage.objects.name and p.status='published')) or
  (bucket_id='campaigns' and exists(select 1 from public.campaigns c where c.published and storage.objects.name in (c.video_path,c.poster_path,c.image_path)))
);
create policy media_admin_insert on storage.objects for insert to authenticated with check(bucket_id in ('catalog','campaigns') and public.is_admin());
create policy media_admin_update on storage.objects for update to authenticated using(bucket_id in ('catalog','campaigns') and public.is_admin()) with check(bucket_id in ('catalog','campaigns') and public.is_admin());
create policy media_admin_delete on storage.objects for delete to authenticated using(bucket_id in ('catalog','campaigns') and public.is_admin());

grant execute on function public.is_admin() to anon;
create table public.store_settings (
  id boolean primary key default true check(id), shipping_minor integer not null default 0 check(shipping_minor>=0),
  support_email text, updated_at timestamptz not null default now()
);
insert into public.store_settings(id,shipping_minor) values(true,0);
alter table public.store_settings enable row level security;
create policy settings_read on public.store_settings for select using(true);
create policy settings_admin on public.store_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());

create function public.place_unpaid_order(p_address jsonb,p_email text,p_note text,p_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid := auth.uid(); v_cart uuid; v_order uuid; v_subtotal integer := 0; v_shipping integer; v_item record; v_stock integer; v_price integer;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_address->>'country' <> 'IN' or length(coalesce(p_address->>'line_1','')) < 3 or length(coalesce(p_address->>'city','')) < 2 or length(coalesce(p_address->>'postal_code','')) <> 6 then
    raise exception 'Invalid shipping address' using errcode='22023';
  end if;
  if length(coalesce(p_email,'')) < 5 or position('@' in p_email)=0 then raise exception 'Invalid email' using errcode='22023'; end if;
  select id into v_order from public.orders where user_id=v_user and idempotency_key=p_key;
  if v_order is not null then return v_order; end if;
  select id into v_cart from public.carts where user_id=v_user for update;
  select id into v_order from public.orders where user_id=v_user and idempotency_key=p_key;
  if v_order is not null then return v_order; end if;
  if v_cart is null or not exists(select 1 from public.cart_items where cart_id=v_cart) then raise exception 'Cart is empty' using errcode='22023'; end if;
  -- Lock every variant in a stable order to avoid deadlocks and overselling.
  for v_item in select ci.variant_id,ci.quantity,v.product_id,v.sku,v.frame_color,v.lens_color,p.name,p.status,v.active
    from public.cart_items ci join public.product_variants v on v.id=ci.variant_id join public.products p on p.id=v.product_id
    where ci.cart_id=v_cart order by ci.variant_id for update of v
  loop
    if v_item.status <> 'published' or not v_item.active then raise exception 'Unavailable product' using errcode='22023'; end if;
    select stock_quantity,price_minor into v_stock,v_price from public.product_variants where id=v_item.variant_id;
    if v_stock < v_item.quantity then raise exception 'Insufficient stock' using errcode='22023'; end if;
    v_subtotal := v_subtotal + v_price*v_item.quantity;
  end loop;
  select shipping_minor into v_shipping from public.store_settings where id=true;
  insert into public.orders(user_id,customer_email,shipping_address_snapshot,subtotal_minor,shipping_minor,total_minor,customer_note,idempotency_key,reservation_expires_at)
  values(v_user,p_email,p_address,v_subtotal,v_shipping,v_subtotal+v_shipping,nullif(left(coalesce(p_note,''),1000),''),p_key,now()+interval '24 hours') returning id into v_order;
  for v_item in select ci.variant_id,ci.quantity,v.product_id,v.sku,v.frame_color,v.lens_color,v.price_minor,p.name
    from public.cart_items ci join public.product_variants v on v.id=ci.variant_id join public.products p on p.id=v.product_id
    where ci.cart_id=v_cart order by ci.variant_id
  loop
    insert into public.order_items(order_id,product_id,variant_id,product_name_snapshot,sku_snapshot,variant_snapshot,unit_price_minor,quantity,line_total_minor)
    values(v_order,v_item.product_id,v_item.variant_id,v_item.name,v_item.sku,
      jsonb_build_object('frame_color',v_item.frame_color,'lens_color',v_item.lens_color),v_item.price_minor,v_item.quantity,v_item.price_minor*v_item.quantity);
    update public.product_variants set stock_quantity=stock_quantity-v_item.quantity where id=v_item.variant_id;
    insert into public.inventory_movements(variant_id,order_id,delta,reason) values(v_item.variant_id,v_order,-v_item.quantity,'order_hold');
  end loop;
  insert into public.order_status_events(order_id,actor_id,next_status,note) values(v_order,v_user,'requested','Order request received; payment not collected');
  delete from public.cart_items where cart_id=v_cart;
  return v_order;
end $$;
revoke execute on function public.place_unpaid_order(jsonb,text,text,uuid) from public, anon;
grant execute on function public.place_unpaid_order(jsonb,text,text,uuid) to authenticated;

create function public.set_order_status(p_order uuid,p_next public.order_status,p_note text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_order public.orders%rowtype; v_item record;
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='28000'; end if;
 select * into v_order from public.orders where id=p_order for update;
 if not found then raise exception 'Order not found' using errcode='22023'; end if;
 if not ((v_order.order_status='requested' and p_next in ('confirmed','declined','expired')) or
         (v_order.order_status='confirmed' and p_next='cancelled')) then raise exception 'Invalid status transition' using errcode='22023'; end if;
 if v_order.order_status='requested' and v_order.reservation_expires_at<=now() and p_next='confirmed' then raise exception 'Reservation expired' using errcode='22023'; end if;
 if p_next in ('declined','expired','cancelled') then
   for v_item in select variant_id,quantity from public.order_items where order_id=p_order and variant_id is not null loop
     update public.product_variants set stock_quantity=stock_quantity+v_item.quantity where id=v_item.variant_id;
     insert into public.inventory_movements(variant_id,order_id,delta,reason) values(v_item.variant_id,p_order,v_item.quantity,'order_release');
   end loop;
 end if;
 update public.orders set order_status=p_next, reservation_expires_at=null, updated_at=now() where id=p_order;
 insert into public.order_status_events(order_id,actor_id,previous_status,next_status,note) values(p_order,auth.uid(),v_order.order_status,p_next,p_note);
end $$;
revoke execute on function public.set_order_status(uuid,public.order_status,text) from public, anon;
grant execute on function public.set_order_status(uuid,public.order_status,text) to authenticated;

create function public.expire_unconfirmed_orders() returns integer language plpgsql security definer set search_path='' as $$
declare v_order record; v_item record; v_count integer := 0;
begin
 for v_order in select id from public.orders where order_status='requested' and reservation_expires_at<=now() order by id for update skip locked loop
   for v_item in select variant_id,quantity from public.order_items where order_id=v_order.id and variant_id is not null loop
     update public.product_variants set stock_quantity=stock_quantity+v_item.quantity where id=v_item.variant_id;
     insert into public.inventory_movements(variant_id,order_id,delta,reason) values(v_item.variant_id,v_order.id,v_item.quantity,'hold_expired');
   end loop;
   update public.orders set order_status='expired',reservation_expires_at=null,updated_at=now() where id=v_order.id;
   insert into public.order_status_events(order_id,next_status,previous_status,note) values(v_order.id,'expired','requested','24-hour reservation elapsed');
   v_count := v_count+1;
 end loop;
 return v_count;
end $$;
revoke execute on function public.expire_unconfirmed_orders() from public, anon, authenticated;
grant execute on function public.expire_unconfirmed_orders() to service_role;

create table public.contact_rate_limits (
  actor_hash text primary key, window_started timestamptz not null default now(), attempts integer not null default 0
);
alter table public.contact_rate_limits enable row level security;
create function public.submit_contact_message(p_actor_hash text,p_name text,p_email text,p_subject text,p_body text)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempts integer;
begin
  insert into public.contact_rate_limits(actor_hash,window_started,attempts) values(p_actor_hash,now(),1)
  on conflict(actor_hash) do update set
    attempts=case when public.contact_rate_limits.window_started<now()-interval '1 hour' then 1 else public.contact_rate_limits.attempts+1 end,
    window_started=case when public.contact_rate_limits.window_started<now()-interval '1 hour' then now() else public.contact_rate_limits.window_started end
  returning attempts into v_attempts;
  if v_attempts>5 then raise exception 'Rate limit exceeded' using errcode='P0001'; end if;
  insert into public.contact_messages(sender_name,email,subject,body) values(p_name,p_email,p_subject,p_body);
end $$;
revoke execute on function public.submit_contact_message(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_contact_message(text,text,text,text,text) to service_role;
