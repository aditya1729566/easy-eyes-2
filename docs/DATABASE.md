# Database

Apply migrations in `supabase/migrations/` in timestamp order. The initial migration creates identity, merchandising, shopping, orders, reviews, campaigns and contact tables; checks, foreign keys, indexes, RLS policies, private Storage buckets and transaction functions are included. `seed.sql` is optional demonstration content.

## Admin bootstrap

Create a normal account through Supabase Auth. In the Supabase SQL editor, after verifying the user's email and UUID, promote exactly that profile with a privileged database session. The profile role guard blocks ordinary customer updates. For a SQL editor session, temporarily disable only `profiles_role_guard`, update the exact verified UUID, then re-enable the trigger immediately in the same transaction:

```sql
begin;
alter table public.profiles disable trigger profiles_role_guard;
update public.profiles set role='admin' where id='<verified-auth-user-uuid>';
alter table public.profiles enable trigger profiles_role_guard;
commit;
```

Never expose a signup path that sets roles.

## Inventory and unpaid orders

`stock_quantity` is available units. `place_unpaid_order` decrements it under row locks and creates `inventory_movements`. A requested order expires after 24 hours unless staff confirms it. The hourly cron restores stock for expired requests; decline or cancellation also restores it. The transition function records `order_status_events`. `payment_status` is constrained to `not_collected`; there is no payment table or gateway. Configure shipping in the single `store_settings` row. Monetary values are integer paise.

## RLS

Anonymous users can read only published catalog and campaigns and approved reviews. Customers can read/update their own profile (excluding role), addresses, wishlist and user cart and read their own orders. Admins have explicit role policies. Orders and stock are written only through controlled functions or admin paths. Guest carts are accessed by a server-only client after verifying the guest cookie hash. Storage objects are readable through RLS only when linked to published content or accessed by an admin.
