-- Keep the 24-hour stock reservation independent of Vercel plan limits.
create extension if not exists pg_cron with schema extensions;
select cron.schedule('easy-eyes-expire-orders','0 * * * *','select public.expire_unconfirmed_orders();');
