# Deployment

1. Use the dedicated Supabase project `dwxjecxzpxhkdsvqlipu`. All three SQL migrations are applied. Complete customer/admin and Storage access tests, then bootstrap one admin account through the documented manual SQL process.
2. Set Supabase Auth site URL and allowed callbacks for the production domain and `/auth/callback`. Use HTTPS.
3. Import the repository into Vercel. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, and `STORE_SUPPORT_EMAIL`. Keep secret and cron values server-only. The app also accepts the older `SUPABASE_SERVICE_ROLE_KEY` variable as a fallback.
4. `vercel.json` schedules `/api/admin/expire` hourly. Vercel invokes it with the `CRON_SECRET` bearer value. Verify an expired test request is released and stock is restored once.
5. Publish approved merchandise, media, support details and reviewed legal policies. Verify signup/login, product search, bag, unpaid order, account isolation and admin status changes on the production URL.

No production deployment is configured in this checkout. Complete content and policy review, then verify the deployed flows before making the site discoverable.
