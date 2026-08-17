-- ============================================================================
-- Tassure Review System — Row Level Security (RLS) policies
-- ============================================================================
-- Run this in the Supabase SQL editor AFTER Google OAuth login is working.
--
-- Security model
--   * Every authenticated request carries the user's Google identity as a JWT.
--     We match rows by the verified email claim: auth.jwt() ->> 'email'.
--   * A normal member can only read/write rows they submitted
--     (employee_email = their own email). For leader reviews, the submitter is
--     the leader; the reviewed subordinates live inside form_data, so the
--     leader still owns the row.
--   * Admins (management + internal) can read and update every row, e.g. to add
--     director_comment.
--   * Anonymous (anon) requests carry no email claim and are therefore blocked
--     on every table once RLS is enabled.
--
-- NOTE: This relies on requests being made with the user's Supabase session
-- (supabase-js attaches the JWT automatically after signInWithOAuth). Do NOT
-- use the service_role key from the browser — it bypasses RLS.
-- ============================================================================

-- Helper: is the current JWT one of the admin accounts? -----------------------
create or replace function public.is_review_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'cindyzhang@tassure.com',
    'samuellng@tassure.com',
    'yeesoon@tassure.com',
    'esther@tassure.com',
    'vincent@tassure.com'
  );
$$;

-- Helper: current verified email (lower-cased), or '' when unauthenticated ----
create or replace function public.current_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- ============================================================================
-- Apply identical owner/admin policies to every submission table.
-- The owner column differs: review tables use employee_email, the suggestion
-- box uses user_email. Each entry below is 'table:owner_column'.
-- ============================================================================
do $$
declare
  spec text;
  t text;
  col text;
  specs text[] := array[
    'self_review_submissions:employee_email',
    'leader_review_submissions:employee_email',
    'hr_review_submissions:employee_email',
    'finance_review_submissions:employee_email',
    'marketing_review_submissions:employee_email',
    'suggestion_submissions:user_email'
  ];
begin
  foreach spec in array specs
  loop
    t   := split_part(spec, ':', 1);
    col := split_part(spec, ':', 2);

    -- Enable RLS (anon requests are blocked once this is on).
    execute format('alter table public.%I enable row level security;', t);

    -- Drop old policies if re-running this script.
    execute format('drop policy if exists "owner_or_admin_select" on public.%I;', t);
    execute format('drop policy if exists "owner_insert" on public.%I;', t);
    execute format('drop policy if exists "owner_or_admin_update" on public.%I;', t);
    execute format('drop policy if exists "owner_or_admin_delete" on public.%I;', t);

    -- SELECT: own rows, or any row if admin.
    execute format($f$
      create policy "owner_or_admin_select" on public.%I
        for select to authenticated
        using (%I = public.current_email() or public.is_review_admin());
    $f$, t, col);

    -- INSERT: may only create rows under your own email.
    execute format($f$
      create policy "owner_insert" on public.%I
        for insert to authenticated
        with check (%I = public.current_email());
    $f$, t, col);

    -- UPDATE: own rows, or any row if admin (e.g. director_comment).
    execute format($f$
      create policy "owner_or_admin_update" on public.%I
        for update to authenticated
        using (%I = public.current_email() or public.is_review_admin())
        with check (%I = public.current_email() or public.is_review_admin());
    $f$, t, col, col);

    -- DELETE: own rows, or any row if admin.
    execute format($f$
      create policy "owner_or_admin_delete" on public.%I
        for delete to authenticated
        using (%I = public.current_email() or public.is_review_admin());
    $f$, t, col);
  end loop;
end $$;

-- ============================================================================
-- Verify (optional): list policies after running.
--   select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename, policyname;
-- ============================================================================
