begin;
create extension if not exists pgcrypto;
create table public.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from admins where user_id=auth.uid())$$;
create table public.products(id uuid primary key default gen_random_uuid(),slug text not null unique,name_tr text not null,name_ar text not null,description_tr text not null,description_ar text not null,category text not null check(category in ('bags','homeware','accessories')),price integer not null check(price>0),stock integer not null default 0 check(stock>=0),images text[] not null default '{}',colors text[] not null default '{}',active boolean not null default false,featured boolean not null default false,created_at timestamptz not null default now());
create table public.store_settings(id integer primary key check(id=1),store_name text not null default 'Jawaher Crochet',shipping_fee integer not null default 0 check(shipping_fee>=0),free_shipping_threshold integer not null default 0 check(free_shipping_threshold>=0),contact_email text not null default '',instagram_url text not null default '');
insert into public.store_settings(id) values(1);
create table public.orders(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),idempotency_key uuid not null, status text not null default 'pending_payment' check(status in ('pending_payment','paid','processing','shipped','delivered','payment_failed','payment_review','refunded')),currency text not null default 'try',total integer not null check(total>0),shipping integer not null default 0,address jsonb not null,items jsonb not null,checkout_id text,plan_id text,payment_id text unique,tracking_number text,created_at timestamptz not null default now(),unique(user_id,idempotency_key));
create index orders_user on public.orders(user_id,created_at desc);
create table public.reviews(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),user_id uuid not null references auth.users(id),rating integer not null check(rating between 1 and 5),display_name text not null check(length(display_name) between 2 and 80),body text not null check(length(body) between 10 and 2000),approved boolean not null default false,created_at timestamptz not null default now(),unique(product_id,user_id));
create table public.webhook_events(id text primary key,payment_id text not null,event_type text not null,created_at timestamptz not null default now());
alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.webhook_events enable row level security;
create policy own_admin on public.admins for select to authenticated using(user_id=auth.uid());
create policy public_products on public.products for select using(active or public.is_admin());
create policy admin_products on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy read_settings on public.store_settings for select using(true);
create policy admin_settings on public.store_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy own_orders on public.orders for select to authenticated using(user_id=auth.uid() or public.is_admin());
-- No client write policies on orders: only transactional service-role RPCs may create/pay orders.
create policy read_reviews on public.reviews for select using(approved or user_id=auth.uid() or public.is_admin());
create policy create_review on public.reviews for insert to authenticated with check(user_id=auth.uid() and not approved and exists(select 1 from public.orders o where o.user_id=auth.uid() and o.status in('paid','processing','shipped','delivered') and o.items @> jsonb_build_array(jsonb_build_object('id',product_id::text))));
create policy moderate_reviews on public.reviews for update to authenticated using(public.is_admin()) with check(public.is_admin());

-- Prices, inventory and shipping are read inside one locked transaction, never accepted from a browser.
create function public.create_store_order(p_user uuid,p_key uuid,p_items jsonb,p_address jsonb) returns public.orders language plpgsql security definer set search_path=public as $$
declare result orders; line jsonb; product products; snapshot jsonb='[]'; subtotal integer=0; shipping_cost integer; settings store_settings; requested integer; reserved integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into result from orders where user_id=p_user and idempotency_key=p_key;
 if found then return result; end if;
 if jsonb_array_length(p_items) not between 1 and 30 then raise exception 'INVALID_CART';end if;
 if (select count(*) from orders where user_id=p_user and created_at>now()-interval '1 hour')>=10 then raise exception 'RATE_LIMIT';end if;
 -- Lock in deterministic order to avoid deadlocks between carts.
 perform 1 from products where id in(select (v->>'id')::uuid from jsonb_array_elements(p_items) v) order by id for update;
 for line in select value from jsonb_array_elements(p_items) loop
  select * into product from products where id=(line->>'id')::uuid and active;
  if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
  requested=(line->>'quantity')::integer;
  if requested not between 1 and 10 or not ((line->>'color')=any(product.colors)) then raise exception 'INVALID_CART';end if;
  select coalesce(sum((x->>'quantity')::integer),0) into requested from jsonb_array_elements(p_items) x where x->>'id'=product.id::text;
  select coalesce(sum((x->>'quantity')::integer),0) into reserved from orders o cross join lateral jsonb_array_elements(o.items) x where o.status='pending_payment' and o.created_at>now()-interval '30 minutes' and x->>'id'=product.id::text;
  if product.stock-reserved<requested then raise exception 'INSUFFICIENT_STOCK';end if;
  requested=(line->>'quantity')::integer;
  subtotal=subtotal+product.price*requested;
  snapshot=snapshot||jsonb_build_array(jsonb_build_object('id',product.id,'name_tr',product.name_tr,'name_ar',product.name_ar,'price',product.price,'quantity',requested,'color',line->>'color'));
 end loop;
 select * into settings from store_settings where id=1;
 shipping_cost=case when settings.free_shipping_threshold>0 and subtotal>=settings.free_shipping_threshold then 0 else settings.shipping_fee end;
 insert into orders(user_id,idempotency_key,total,shipping,address,items) values(p_user,p_key,subtotal+shipping_cost,shipping_cost,p_address,snapshot) returning * into result;
 return result;
end;$$;
revoke all on function public.create_store_order(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.create_store_order(uuid,uuid,jsonb,jsonb) to service_role;

-- Event insertion, payment validation, stock deduction and order state commit atomically.
create function public.confirm_store_payment(p_event text,p_order uuid,p_payment text,p_amount integer,p_currency text,p_plan text) returns text language plpgsql security definer set search_path=public as $$
declare o orders; line record; available integer;
begin
 select * into o from orders where id=p_order for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if exists(select 1 from webhook_events where id=p_event) then return 'duplicate';end if;
 if o.total<>p_amount or o.currency<>lower(p_currency) or o.plan_id is distinct from p_plan then raise exception 'PAYMENT_MISMATCH';end if;
 insert into webhook_events(id,payment_id,event_type) values(p_event,p_payment,'payment.succeeded');
 if o.payment_id=p_payment then return 'duplicate';end if;
 if o.payment_id is not null then raise exception 'SECOND_PAYMENT_REQUIRES_REVIEW';end if;
 perform 1 from products where id in(select (v->>'id')::uuid from jsonb_array_elements(o.items) v) order by id for update;
 for line in select (x->>'id')::uuid as id,sum((x->>'quantity')::integer)::integer as qty from jsonb_array_elements(o.items) x group by x->>'id' loop
  select stock into available from products where id=line.id;
  if available is null or available<line.qty then
   update orders set status='payment_review',payment_id=p_payment where id=p_order;
   return 'payment_review';
  end if;
 end loop;
 for line in select (x->>'id')::uuid as id,sum((x->>'quantity')::integer)::integer as qty from jsonb_array_elements(o.items) x group by x->>'id' loop
  update products set stock=stock-line.qty where id=line.id;
 end loop;
 update orders set status='paid',payment_id=p_payment where id=p_order;
 return 'paid';
end;$$;
revoke all on function public.confirm_store_payment(text,uuid,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.confirm_store_payment(text,uuid,text,integer,text,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy public_product_images on storage.objects for select using(bucket_id='product-images');
create policy admin_product_images on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
create policy admin_update_images on storage.objects for update to authenticated using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());
create policy admin_delete_images on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());
commit;
