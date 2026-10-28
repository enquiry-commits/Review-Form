-- ============================================================================
-- Director feedback notifications — v2 (run once in the Supabase SQL editor,
-- after supabase-feedback-notifications.sql)
-- ============================================================================
-- Only NEW, non-empty Director content triggers an e-mail. Compared with what
-- the employee was last notified about:
--   * a comment (per question or overall) that is new or changed, and not empty
--   * a rating (Good emoji) that ends up different from before, and not empty
-- Removing a comment or a rating, or picking an emoji and then removing it
-- again, sends nothing. Includes the per-person 6-hour quiet period
-- (Self + Leader Review in one e-mail).
-- ============================================================================

alter table public.feedback_notifications
  add column if not exists content          jsonb,
  add column if not exists notified_content jsonb,
  add column if not exists claimed_content  jsonb;

-- Non-empty Director content of one row, as { 'item:<key>': text, 'overall': text, 'rating': key }
create or replace function public.feedback_content(rec jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce((
    select jsonb_object_agg(k, v) from (
      select 'item:' || e.key as k, btrim(e.value) as v
        from jsonb_each_text(coalesce(rec -> 'form_data' -> 'director_feedback' -> 'items', '{}'::jsonb)) e
       where btrim(e.value) <> ''
      union all
      select 'overall', coalesce(nullif(btrim(coalesce(rec ->> 'director_comment', '')), ''),
                                 nullif(btrim(coalesce(rec -> 'form_data' -> 'director_feedback' ->> 'overall', '')), ''))
      union all
      select 'rating', nullif(rec -> 'form_data' -> 'director_feedback' ->> 'rating', '')
    ) x
    where v is not null
  ), '{}'::jsonb);
$$;

-- What is new in cur compared with prev (removed entries do not count)
create or replace function public.feedback_new_items(cur jsonb, prev jsonb)
returns table(new_comments int, new_rating boolean)
language sql
immutable
as $$
  select (count(*) filter (where e.key <> 'rating'))::int,
         coalesce(bool_or(e.key = 'rating'), false)
    from jsonb_each_text(coalesce(cur, '{}'::jsonb)) e
   where e.value is distinct from (coalesce(prev, '{}'::jsonb) ->> e.key);
$$;

-- Trigger: also keep the current content -------------------------------------
create or replace function public.track_director_feedback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  c jsonb;
  existing text;
begin
  select * into s from public.feedback_summary(to_jsonb(new));
  c := public.feedback_content(to_jsonb(new));
  select content_hash into existing from public.feedback_notifications
   where source_table = tg_table_name and submission_id = new.id::text;

  if existing is null and not s.has_content then
    return new;
  end if;
  if existing is not distinct from s.content_hash then
    return new;
  end if;

  insert into public.feedback_notifications as f
    (source_table, submission_id, recipient_email, content_hash, content, has_content,
     comment_count, has_rating, last_change_at)
  values
    (tg_table_name, new.id::text, lower(new.employee_email), s.content_hash, c, s.has_content,
     s.comment_count, s.has_rating, now())
  on conflict (source_table, submission_id) do update
    set content_hash    = excluded.content_hash,
        content         = excluded.content,
        has_content     = excluded.has_content,
        comment_count   = excluded.comment_count,
        has_rating      = excluded.has_rating,
        recipient_email = excluded.recipient_email,
        last_change_at  = now();
  return new;
end;
$$;

-- Backfill current content; what was already notified becomes the baseline ----
do $$
declare t text;
begin
  foreach t in array array[
    'self_review_submissions', 'leader_review_submissions', 'hr_review_submissions',
    'finance_review_submissions', 'marketing_review_submissions'
  ] loop
    execute format(
      'update public.feedback_notifications f
          set content = public.feedback_content(to_jsonb(r))
         from public.%I r
        where f.source_table = %L and f.submission_id = r.id::text', t, t);
  end loop;
end $$;

update public.feedback_notifications
   set notified_content = content
 where notified_content is null
   and notified_hash is not distinct from content_hash;

-- Claim: per person, due when they have new content and nothing changed for 6h -
create or replace function public.claim_due_feedback_notifications(p_limit int default 50)
returns table(source_table text, submission_id text, recipient_email text,
              claimed_hash text, comment_count int, has_rating boolean)
language sql
security definer
set search_path = public
as $$
  with pending as (
    select f.source_table, f.submission_id, f.recipient_email, f.last_change_at,
           n.new_comments, n.new_rating
      from public.feedback_notifications f
      cross join lateral public.feedback_new_items(f.content, f.notified_content) n
     where f.attempts < 5
       and (n.new_comments > 0 or n.new_rating)
  ),
  busy as (
    select p.recipient_email from pending p
     where p.last_change_at > now() - interval '6 hours'
  ),
  due as (
    select f.source_table, f.submission_id, p.new_comments, p.new_rating
      from public.feedback_notifications f
      join pending p on p.source_table = f.source_table and p.submission_id = f.submission_id
     where f.recipient_email not in (select recipient_email from busy)
       and (f.status <> 'sending' or f.claimed_at < now() - interval '15 minutes')
     order by f.recipient_email, f.last_change_at
     limit p_limit
     for update of f skip locked
  )
  update public.feedback_notifications f
     set status = 'sending', claimed_at = now(),
         claimed_hash = f.content_hash, claimed_content = f.content
    from due
   where f.source_table = due.source_table and f.submission_id = due.submission_id
  returning f.source_table, f.submission_id, f.recipient_email, f.claimed_hash,
            due.new_comments, due.new_rating;
$$;

-- After a successful send: the claimed content becomes the new baseline -------
create or replace function public.mark_feedback_notified(p_table text, p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.feedback_notifications
     set notified_hash = claimed_hash, notified_content = claimed_content,
         notified_at = now(), status = 'idle', attempts = 0, last_error = null
   where source_table = p_table and submission_id = p_id;
$$;

revoke all on function public.claim_due_feedback_notifications(int) from public, anon, authenticated;
grant execute on function public.claim_due_feedback_notifications(int) to service_role;
revoke all on function public.mark_feedback_notified(text, text) from public, anon, authenticated;
grant execute on function public.mark_feedback_notified(text, text) to service_role;
