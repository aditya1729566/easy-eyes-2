# Easy Eyes

Easy Eyes is an editorial eyewear storefront built with Next.js 16, TypeScript, Supabase Auth/PostgreSQL/Storage and Tailwind CSS. Customers can browse published frames, save products, keep a persisted bag, and submit **unpaid** order requests. Admins manage merchandise, campaigns, reviews, media and order status.

## Status

The application builds and runs locally. A Supabase project is connected, schema migrations are applied, and three clearly labelled demonstration products are seeded as drafts. Local server-side access is configured; Vercel deployment is pending. The current frame artwork is an explicitly labelled illustration slot; real campaign and catalog assets have not been supplied. Final product prices, support details and legal policies must be supplied before production launch. See [IMPLEMENTATION.md](IMPLEMENTATION.md) and [docs/QA.md](docs/QA.md).

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill the Supabase URL, publishable key and **server-only** secret key. Never prefix the secret key with `NEXT_PUBLIC_`. This checkout already contains the project URL and publishable key in its gitignored `.env.local`.
3. On a new Supabase project, apply SQL files in `supabase/migrations/` in order through the Supabase CLI or SQL editor. All four migrations are already applied to the connected Easy Eyes project. Optionally apply `supabase/seed.sql` for clearly labelled draft merchandise.
4. Configure Supabase Auth site URL and redirect URLs for `http://localhost:3000/auth/callback` and the production domain.
5. Set `NEXT_PUBLIC_SITE_URL` and `STORE_SUPPORT_EMAIL`. Keep `NEXT_PUBLIC_SITE_READY=false` until final content and policy review. `CRON_SECRET` protects the optional manual expiry endpoint; the scheduled job runs inside Supabase.
6. `npm run dev`; open `http://localhost:3000`.

Commands: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`.

The checkout reserves stock for 24 hours and records `payment_status=not_collected`. A Supabase Cron job runs hourly to release expired unconfirmed holds. No payment gateway or card collection is present.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database and RLS](docs/DATABASE.md)
- [REST API](docs/API.md)
- [Assets](docs/ASSETS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [QA](docs/QA.md)
- [Design direction](docs/DESIGN.md)
