-- ============================================================================
-- Monthly review-submission reminder: send log (run once in the Supabase SQL editor)
-- ============================================================================
-- One row per month that has been sent, so the reminder goes out only once even
-- though the cron route runs every 15 minutes. A ':test' suffix marks a send made
-- while NOTIFY_OVERRIDE_TO was set (test mode), so the real send still happens later.
create table if not exists public.monthly_review_reminders (
  period     text primary key,          -- '2026-09' or '2026-09:test'
  sent_at    timestamptz not null default now(),
  recipients int not null default 0
);
alter table public.monthly_review_reminders enable row level security;
revoke all on public.monthly_review_reminders from anon, authenticated;
