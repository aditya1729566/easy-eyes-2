# Architecture

Next.js App Router renders the public catalog and protected account/admin pages. Client components are limited to forms, navigation and bag interaction. Route handlers validate input with Zod, check server-validated Supabase users, and return `{data}` or `{error:{message}}` JSON. Admin routes check `profiles.role` on the server; RLS also enforces privilege at the database.

PostgreSQL stores products, variants, orders, carts and editorial records. Public catalog reads use an SSR cookie-aware Supabase client. A service-role client is confined to server code for guest carts and contact messages. Guest identity is a 256-bit HTTP-only cookie; only its SHA-256 hash is stored. The bag merges on login. No privileged key reaches browser bundles.

Media buckets are private. The `/api/media/...` route downloads an object through a session-aware Supabase client. Storage RLS permits published product/campaign media or admin access. The local SVG frame study is a labelled fallback, not merchandise photography.

Order submission uses the `place_unpaid_order` PostgreSQL function. It locks variants, verifies prices and quantities, snapshots address/items, decrements available stock, and writes audit movements in one transaction. A per-user idempotency key prevents duplicate orders. The hourly cron calls `expire_unconfirmed_orders`; confirmed requests retain the stock allocation. Payment status remains `not_collected` in this release. A future payment adapter belongs in `src/features/payments/` and must not mutate status without an audited gateway event.

Design keeps one large frame silhouette as a campaign placeholder until approved photography arrives. Public pages use gallery scale and editorial typography; the admin area uses denser operational layouts.
