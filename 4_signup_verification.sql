-- ============================================================
-- ARISE CORE: sign up with email code + 8-digit password (NO phone verification)
-- Run AFTER files 1, 2 and 3: Supabase dashboard > SQL Editor > New query > paste > Run. Safe to run again.
-- ============================================================

-- 1) A half-finished sign up (email verified, no password yet) must NOT block that email from trying again.
create or replace function public.signup_check(e text, p text)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
begin
  return jsonb_build_object(
    'email_taken', coalesce(length(trim(coalesce(e, ''))) > 0 and exists (
        select 1 from auth.users u
        where lower(u.email) = lower(trim(e))
          and u.email_confirmed_at is not null
          and (coalesce(u.raw_user_meta_data ->> 'signup_complete', '') = 'true' or coalesce(u.encrypted_password, '') <> '')), false),
    'phone_taken', false);
end;
$$;
grant execute on function public.signup_check(text, text) to anon, authenticated;

-- 2) Profiles no longer need a phone number.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles (user_id, email) values (new.id, new.email)
    on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_new_user();

-- 3) App data opens as soon as the email is confirmed (no phone needed).
create or replace function public.is_verified()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select coalesce((select u.email_confirmed_at is not null from auth.users u where u.id = auth.uid()), false);
$$;
grant execute on function public.is_verified() to authenticated;
