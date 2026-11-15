-- ARISE CORE: ads (run once in Supabase SQL Editor, after files 1 to 4. Safe to repeat.)
-- The ad codes you paste in the admin panel (Ads tab) are stored in app_settings under the key 'ad_slots'.
-- Logged-in app users may READ them through this function. Only admins can change them (admin_set_setting).
create or replace function public.get_ad_slots()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select value from public.app_settings where key = 'ad_slots'), '{}'::jsonb);
$$;
revoke all on function public.get_ad_slots() from public, anon;
grant execute on function public.get_ad_slots() to authenticated;
