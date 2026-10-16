-- ============================================================================
-- Director feedback e-mail notifications (6-hour quiet period)
-- ============================================================================
-- Run this whole file in the Supabase SQL editor (once).
--
-- How it works
--   * A trigger on the 5 review tables hashes the director feedback (per-question
--     comments + overall comment + rating). When the hash really changes,
--     last_change_at = now(). Re-saving identical content, employee edits and
--     metadata (updated_at / updated_by / rating_at) do NOT restart the timer.
--   * A row is "due" when: content_hash <> notified_hash, has_content, and
--     last_change_at <= now() - 6 hours. After sending, notified_hash is set to
--     the hash that was sent, so any later change starts a new 6-hour round.
--   * State lives in its own table (RLS on, no policies => service role only),
--     because employees may UPDATE their own submission rows.
-- ============================================================================

create table if not exists public.feedback_notifications (
  source_table   text        not null,
  submission_id  text        not null,
  recipient_email text       not null,
  content_hash   text        not null,
  has_content    boolean     not null default false,
  comment_count  int         not null default 0,
  has_rating     boolean     not null default false,
  last_change_at timestamptz not null default now(),
  notified_hash  text,
  notified_at    timestamptz,
  status         text        not null default 'idle',   -- idle | sending
  claimed_at     timestamptz,
  claimed_hash   text,
  attempts       int         not null default 0,
  last_error     text,
  primary key (source_table, submission_id)
);

alter table public.feedback_notifications enable row level security;
revoke all on public.feedback_notifications from anon, authenticated;

-- Normalised summary of the director feedback of one row ----------------------
create or replace function public.feedback_summary(rec jsonb)
returns table(content_hash text, has_content boolean, comment_count int, has_rating boolean)
language plpgsql
immutable
as $$
declare
  fd      jsonb := coalesce(rec -> 'form_data' -> 'director_feedback', '{}'::jsonb);
  items   jsonb;
  cnt     int;
  overall text;
  rating  text;
begin
  select coalesce(jsonb_object_agg(k, btrim(v)), '{}'::jsonb), count(*)::int
    into items, cnt
    from jsonb_each_text(coalesce(fd -> 'items', '{}'::jsonb)) as e(k, v)
   where btrim(v) <> '';
  overall := coalesce(nullif(btrim(coalesce(rec ->> 'director_comment', '')), ''),
                      nullif(btrim(coalesce(fd ->> 'overall', '')), ''), '');
  rating  := coalesce(nullif(fd ->> 'rating', ''), '');
  content_hash  := md5(items::text || '|' || overall || '|' || rating);
  has_content   := (cnt > 0 or overall <> '' or rating <> '');
  comment_count := cnt + case when overall <> '' then 1 else 0 end;
  has_rating    := rating <> '';
  return next;
end;
$$;

-- Trigger: stamp last_change_at only when the content hash changes ------------
create or replace function public.track_director_feedback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  existing text;
begin
  select * into s from public.feedback_summary(to_jsonb(new));
  select content_hash into existing from public.feedback_notifications
   where source_table = tg_table_name and submission_id = new.id::text;

  if existing is null and not s.has_content then
    return new;  -- nothing to track yet
  end if;
  if existing is not distinct from s.content_hash then
    return new;  -- unchanged
  end if;

  insert into public.feedback_notifications as f
    (source_table, submission_id, recipient_email, content_hash, has_content,
     comment_count, has_rating, last_change_at)
  values
    (tg_table_name, new.id::text, lower(new.employee_email), s.content_hash,
     s.has_content, s.comment_count, s.has_rating, now())
  on conflict (source_table, submission_id) do update
    set content_hash    = excluded.content_hash,
        has_content     = excluded.has_content,
        comment_count   = excluded.comment_count,
        has_rating      = excluded.has_rating,
        recipient_email = excluded.recipient_email,
        last_change_at  = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'self_review_submissions', 'leader_review_submissions', 'hr_review_submissions',
    'finance_review_submissions', 'marketing_review_submissions'
  ] loop
    execute format('drop trigger if exists track_director_feedback on public.%I;', t);
    execute format(
      'create trigger track_director_feedback after insert or update on public.%I
         for each row execute function public.track_director_feedback();', t);
  end loop;
end $$;

-- Claim due rows (idempotent, safe with overlapping runs) ---------------------
create or replace function public.claim_due_feedback_notifications(p_limit int default 20)
returns table(source_table text, submission_id text, recipient_email text,
              claimed_hash text, comment_count int, has_rating boolean)
language sql
security definer
set search_path = public
as $$
  with due as (
    select f.source_table, f.submission_id
      from public.feedback_notifications f
     where f.has_content
       and f.content_hash is distinct from f.notified_hash
       and f.last_change_at <= now() - interval '6 hours'
       and f.attempts < 5
       and (f.status <> 'sending' or f.claimed_at < now() - interval '15 minutes')
     order by f.last_change_at
     limit p_limit
     for update skip locked
  )
  update public.feedback_notifications f
     set status = 'sending', claimed_at = now(), claimed_hash = f.content_hash
    from due
   where f.source_table = due.source_table and f.submission_id = due.submission_id
  returning f.source_table, f.submission_id, f.recipient_email, f.claimed_hash,
            f.comment_count, f.has_rating;
$$;

revoke all on function public.claim_due_feedback_notifications(int) from public, anon, authenticated;
grant execute on function public.claim_due_feedback_notifications(int) to service_role;

-- Backfill: existing feedback counts as already notified (no mass e-mail) ------
do $$
declare t text;
begin
  foreach t in array array[
    'self_review_submissions', 'leader_review_submissions', 'hr_review_submissions',
    'finance_review_submissions', 'marketing_review_submissions'
  ] loop
    execute format($f$
      insert into public.feedback_notifications
        (source_table, submission_id, recipient_email, content_hash, has_content,
         comment_count, has_rating, last_change_at, notified_hash, notified_at)
      select %L, r.id::text, lower(r.employee_email), s.content_hash, s.has_content,
             s.comment_count, s.has_rating, now(), s.content_hash, now()
        from public.%I r, lateral public.feedback_summary(to_jsonb(r)) s
       where s.has_content
      on conflict do nothing;
    $f$, t, t);
  end loop;
end $$;

-- ============================================================================
-- LAST STEP (after the app is deployed with its env vars): schedule the check.
-- Enable the pg_cron and pg_net extensions (Database > Extensions) first, then
-- replace <APP_URL> and <CRON_SECRET> and run this separately:
--
-- select cron.schedule(
--   'feedback-notify', '*/15 * * * *',
--   $$select net.http_get(
--       url     := 'https://<APP_URL>/api/cron/feedback-notify',
--       headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--     )$$
-- );
-- To stop it:  select cron.unschedule('feedback-notify');
-- ============================================================================
