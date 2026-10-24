-- Trigger functions are invoked by PostgreSQL, never through the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
