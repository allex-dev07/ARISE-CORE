-- ============================================================
-- ARISE CORE: database setup for Supabase
-- Run this FIRST (file 1 of 2): Supabase dashboard > SQL Editor > New query > paste > Run
-- ============================================================

-- One row per user. "data" holds that user's whole ARISE CORE data (habits, tasks, notes, water...).
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  device     text,
  updated_at timestamptz not null default now(),
  constraint user_data_size check (octet_length(data::text) < 2000000)
);

-- VERIFIED ONLY: an account is "verified" when its email is confirmed (by the code we email) AND it has a phone number.
-- Unverified accounts cannot read or write any app data (the server enforces this, not just the app).
-- (plpgsql on purpose: the profiles table is created later by 2_admin_setup.sql)
create or replace function public.is_verified()
returns boolean language plpgsql stable security definer set search_path = public, auth as $$
begin
  return coalesce((select u.email_confirmed_at is not null
                          and exists (select 1 from public.profiles p where p.user_id = u.id and coalesce(p.phone, '') <> '')
                   from auth.users u where u.id = auth.uid()), false);
end;
$$;
grant execute on function public.is_verified() to authenticated;

-- DUPLICATES: sign up asks this BEFORE creating an account. A phone number counts as taken once an account
-- with a confirmed email uses it, so a number typed into an unfinished sign up never blocks anyone.
create or replace function public.signup_check(e text, p text)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare digits text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  return jsonb_build_object(
    'email_taken', coalesce(length(trim(coalesce(e, ''))) > 0 and exists (select 1 from auth.users where lower(email) = lower(trim(e))), false),
    'phone_taken', coalesce(length(digits) > 0 and exists (select 1 from public.profiles where regexp_replace(coalesce(phone, ''), '\D', '', 'g') = digits), false));
end;
$$;
grant execute on function public.signup_check(text, text) to anon, authenticated;

-- SECURITY: every user can only see and change their OWN row.
alter table public.user_data enable row level security;

drop policy if exists "read own data"   on public.user_data;
drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;
drop policy if exists "delete own data" on public.user_data;

create policy "read own data"   on public.user_data for select to authenticated using (auth.uid() = user_id and public.is_verified());
create policy "insert own data" on public.user_data for insert to authenticated with check (auth.uid() = user_id and public.is_verified());
create policy "update own data" on public.user_data for update to authenticated using (auth.uid() = user_id and public.is_verified()) with check (auth.uid() = user_id and public.is_verified());
create policy "delete own data" on public.user_data for delete to authenticated using (auth.uid() = user_id);

-- Logged-out visitors (the public "anon" key) get no access at all.
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;

-- The server sets updated_at itself, so users cannot fake it.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before insert or update on public.user_data
  for each row execute function public.touch_updated_at();

-- "Delete my account" button: lets a logged-in user delete only their own account.
create or replace function public.delete_my_account()
returns void language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
