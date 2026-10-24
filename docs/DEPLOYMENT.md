# Deployment

1. Use the dedicated Supabase project `dwxjecxzpxhkdsvqlipu`. All four SQL migrations are applied, including the active hourly Supabase Cron job. Complete admin and Storage access tests, then bootstrap one admin account through the documented manual SQL process.
2. Set Supabase Auth site URL and allowed callbacks for the production domain and `/auth/callback`. Use HTTPS.
3. Deploy the private repository `aditya1729566/easy-eyes` to Vercel project `prj_jny7Qv8e0FNF3Ho1JxW5AVpkuohS`. The project has URL, publishable key, server secret and optional manual cron secret configured for preview and production. Set `NEXT_PUBLIC_SITE_URL` to the final domain and add `STORE_SUPPORT_EMAIL` when supplied. Keep `NEXT_PUBLIC_SITE_READY=false` until launch. The app also accepts the older `SUPABASE_SERVICE_ROLE_KEY` variable as a fallback.
4. Supabase Cron runs `expire_unconfirmed_orders()` hourly. Verify its job history and an expired test request. `/api/admin/expire` remains available for a guarded manual run; Vercel Cron is not used.
5. Publish approved merchandise, media, support details and reviewed legal policies. Verify signup/login, product search, bag, unpaid order, account isolation and admin status changes on the production URL.

No production deployment is configured in this checkout. Complete content and policy review, then verify the deployed flows before making the site discoverable.
