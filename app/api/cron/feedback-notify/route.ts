import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/notify/mailer'
import { NO_EMAIL, buildReminderEmail, reminderDueToday, reminderPlanFor, reminderRecipients, todayIn } from '@/lib/notify/monthlyReminder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FORM_LABELS: Record<string, string> = {
  self_review_submissions: 'Self Review',
  leader_review_submissions: 'Leader Review',
  hr_review_submissions: 'HR Review',
  finance_review_submissions: 'Finance Review',
  marketing_review_submissions: 'Marketing Review',
}

const SEND_FROM_HOUR = 9
const SEND_TO_HOUR = 19

function localHour(tz: string) {
  const h = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: tz }).format(new Date())
  return parseInt(h, 10) % 24
}

function periodLabel(period?: string) {
  if (!period) return ''
  const m = /^(\d{4})-(\d{2})$/.exec(period)
  if (!m) return period
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${names[parseInt(m[2], 10) - 1]} ${m[1]}`
}

type FeedbackItem = { form: string; period: string; commentCount: number; hasRating: boolean }

// One e-mail per person: every form of theirs with new Director comments is listed in it
function buildEmail(items: FeedbackItem[], link: string) {
  const detail = (it: FeedbackItem) => {
    const p: string[] = []
    if (it.commentCount > 0) p.push(`${it.commentCount} comment${it.commentCount > 1 ? 's' : ''}`)
    if (it.hasRating) p.push('a rating')
    return p.join(' and ')
  }
  const forms = [...new Set(items.map(i => i.form))]
  const subject = `【Tassure Review】 Your ${forms.join(' & ')} has new Director comments`
  const line = (it: FeedbackItem) => `${it.form}${it.period ? ` (${it.period})` : ''}${detail(it) ? ` — ${detail(it)}` : ''}`
  const text =
`Hi,

This is a notification from the Tassure Review System.

A Director has left comments on:
${items.map(i => `- ${line(i)}`).join('\n')}

Please click the link below to log in and read them:
👉 ${link}

— Tassure Review System
This is an automated message. Please do not reply to this e-mail.`
  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;color:#1e293b;line-height:1.6">
<div style="font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#64748b;padding-bottom:10px;border-bottom:2px solid #1e3a5f;margin-bottom:16px">Tassure Review System</div>
<p>Hi,</p>
<p>A Director has left comments on:</p>
<ul style="padding-left:20px;margin:0 0 16px">${items.map(i => `<li style="margin:2px 0">${line(i).replace(i.form, `<b>${i.form}</b>`)}</li>`).join('')}</ul>
<p style="margin-bottom:8px">Please click the button below to log in and read them:</p>
<p><a href="${link}" style="display:inline-block;padding:11px 22px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">👉 View comments</a></p>
<p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px">— Tassure Review System<br>This is an automated message. Please do not reply to this e-mail.</p>
</div>`
  return { subject, text, html }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sp = request.nextUrl.searchParams
  if (sp.get('status') === '1' || sp.get('send') === 'reminder') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Supabase service config missing' }, { status: 500 })
    const db = createClient(url, key, { auth: { persistSession: false } })
    const tz = process.env.NOTIFY_TZ || 'Asia/Singapore'
    const today = todayIn(tz)
    const plan = reminderPlanFor(today.getUTCFullYear(), today.getUTCMonth())

    // ?status=1 — read-only health check of the notification setup
    if (sp.get('status') === '1') {
      const reminders = await db.from('monthly_review_reminders').select('period, sent_at, recipients').order('sent_at', { ascending: false }).limit(5)
      const all = await db.from('feedback_notifications').select('source_table, recipient_email, status, attempts, last_error, last_change_at, notified_at, content_hash, notified_hash, has_content')
      const rows = (all.data || []) as any[]
      const pending = rows.filter(r => r.has_content && r.content_hash !== r.notified_hash)
      const claim = await db.rpc('claim_due_feedback_notifications', { p_limit: 0 })
      return NextResponse.json({
        env: {
          NOTIFY_ENABLED: process.env.NOTIFY_ENABLED || null,
          SMTP_USER: process.env.SMTP_USER || '(default vincent@tassure.com)',
          SMTP_PASS: process.env.SMTP_PASS ? 'set' : null,
          APP_URL: process.env.APP_URL || null,
        },
        reminderTable: reminders.error ? `missing: ${reminders.error.message}` : 'ok',
        remindersSent: reminders.data || [],
        thisMonthPlan: plan,
        claimFunction: claim.error ? `error: ${claim.error.message}` : 'ok',
        v2Sql: (await db.rpc('mark_feedback_notified', { p_table: '-', p_id: '-' })).error ? 'missing' : 'ok',
        reminderRecipients: reminderRecipients((process.env.SMTP_USER || 'vincent@tassure.com').toLowerCase()),
        feedbackNotifications: {
          tracked: rows.length,
          pending: pending.map(r => ({ table: r.source_table, to: r.recipient_email, last_change_at: r.last_change_at, attempts: r.attempts, last_error: r.last_error })),
          lastSent: rows.filter(r => r.notified_at).sort((x, y) => String(y.notified_at).localeCompare(String(x.notified_at))).slice(0, 5)
            .map(r => ({ table: r.source_table, to: r.recipient_email, notified_at: r.notified_at })),
          failed: rows.filter(r => r.last_error).map(r => ({ table: r.source_table, to: r.recipient_email, attempts: r.attempts, last_error: r.last_error })),
        },
      })
    }

    // ?send=reminder&period=YYYY-MM — send this month's reminder to all staff now, once.
    // Only run when Vincent asks; period must match the current month as a safety check.
    if (sp.get('period') !== plan.period) {
      return NextResponse.json({ error: `period must be ${plan.period}` }, { status: 400 })
    }
    const sender = (process.env.SMTP_USER || 'vincent@tassure.com').toLowerCase()
    const { to: recipients, cc } = reminderRecipients(sender)
    const { error: logErr } = await db.from('monthly_review_reminders').insert({ period: plan.period, recipients: recipients.length + cc.length })
    if (logErr) return NextResponse.json({ error: `not sent: ${logErr.message}` }, { status: 409 })
    try {
      const appUrl = (process.env.APP_URL || request.nextUrl.origin).replace(/\/$/, '')
      await sendMail({ to: recipients, cc, ...buildReminderEmail(plan, appUrl), fromName: 'Vincent Seow' })
      return NextResponse.json({ to: recipients, cc, period: plan.period, deadline: `${plan.deadlineDay}, ${plan.deadlineLabel}` })
    } catch (e: any) {
      await db.from('monthly_review_reminders').delete().eq('period', plan.period)
      return NextResponse.json({ error: e?.message }, { status: 500 })
    }
  }

  if (process.env.NOTIFY_ENABLED !== 'true') {
    return NextResponse.json({ skipped: 'NOTIFY_ENABLED is not true' })
  }

  const tz = process.env.NOTIFY_TZ || 'Asia/Singapore'
  const hour = localHour(tz)
  if (hour < SEND_FROM_HOUR || hour >= SEND_TO_HOUR) {
    return NextResponse.json({ skipped: `outside send window (${hour}h ${tz})` })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Supabase service config missing' }, { status: 500 })
  const db = createClient(url, key, { auth: { persistSession: false } })

  const appUrl = (process.env.APP_URL || request.nextUrl.origin).replace(/\/$/, '')
  const link = `${appUrl}/dashboard?tab=my-submissions`

  // Monthly submission reminder: on its send Monday, once (logged in monthly_review_reminders).
  let reminder: any = null
  const plan = reminderDueToday(todayIn(tz))
  if (plan) {
    const key = plan.period
    const { data: done } = await db.from('monthly_review_reminders').select('period').eq('period', key).maybeSingle()
    if (!done) {
      const sender = (process.env.SMTP_USER || 'vincent@tassure.com').toLowerCase()
      const list = reminderRecipients(sender)
      const recipients = list.to
      const cc = list.cc
      const { error: logErr } = await db.from('monthly_review_reminders').insert({ period: key, recipients: recipients.length + cc.length })
      if (logErr) {
        reminder = { period: key, error: logErr.message }
      } else {
        try {
          await sendMail({ to: recipients, cc, ...buildReminderEmail(plan, appUrl), fromName: 'Vincent Seow' })
          reminder = { period: key, sent: recipients.length }
        } catch (e: any) {
          await db.from('monthly_review_reminders').delete().eq('period', key)
          reminder = { period: key, error: e?.message }
        }
      }
    }
  }

  const { data: claimed, error } = await db.rpc('claim_due_feedback_notifications', { p_limit: 50 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by person so one e-mail covers every form of theirs (e.g. Self + Leader Review)
  const byRecipient = new Map<string, any[]>()
  for (const c of (claimed || []) as any[]) {
    const list = byRecipient.get(c.recipient_email) || []
    list.push(c)
    byRecipient.set(c.recipient_email, list)
  }
  const order = Object.keys(FORM_LABELS)

  const results: { recipient: string; to: string; forms: string[]; ok: boolean; error?: string }[] = []
  for (const [recipient, rows] of byRecipient) {
    if (NO_EMAIL.has(recipient)) {
      for (const c of rows) await db.rpc('mark_feedback_notified', { p_table: c.source_table, p_id: c.submission_id })
      continue
    }
    const to = recipient
    rows.sort((x, y) => order.indexOf(x.source_table) - order.indexOf(y.source_table))
    const forms = rows.map(r => FORM_LABELS[r.source_table] || 'Review')
    try {
      const items: FeedbackItem[] = []
      for (const c of rows) {
        const { data: row } = await db.from(c.source_table).select('review_period').eq('id', c.submission_id).maybeSingle()
        items.push({ form: FORM_LABELS[c.source_table] || 'Review', period: periodLabel((row as any)?.review_period), commentCount: c.comment_count, hasRating: c.has_rating })
      }
      await sendMail({ to, ...buildEmail(items, link) })
      for (const c of rows) {
        // v2 SQL: the claimed content becomes the new baseline; fall back to the hash-only update before v2 is run
        const { error: markErr } = await db.rpc('mark_feedback_notified', { p_table: c.source_table, p_id: c.submission_id })
        if (markErr) {
          await db.from('feedback_notifications')
            .update({ notified_hash: c.claimed_hash, notified_at: new Date().toISOString(), status: 'idle', attempts: 0, last_error: null })
            .eq('source_table', c.source_table).eq('submission_id', c.submission_id)
        }
      }
      results.push({ recipient, to, forms, ok: true })
    } catch (e: any) {
      for (const c of rows) {
        const { data: cur } = await db.from('feedback_notifications').select('attempts')
          .eq('source_table', c.source_table).eq('submission_id', c.submission_id).maybeSingle()
        await db.from('feedback_notifications')
          .update({ status: 'idle', attempts: ((cur as any)?.attempts || 0) + 1, last_error: String(e?.message || e).slice(0, 500) })
          .eq('source_table', c.source_table).eq('submission_id', c.submission_id)
      }
      results.push({ recipient, to, forms, ok: false, error: e?.message })
    }
  }
  return NextResponse.json({ reminder, sent: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results })
}
