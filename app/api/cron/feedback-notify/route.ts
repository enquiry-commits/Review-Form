import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/notify/mailer'

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

function buildEmail(form: string, period: string, commentCount: number, hasRating: boolean, link: string) {
  const when = period ? ` (${period})` : ''
  const parts: string[] = []
  const partsZh: string[] = []
  if (commentCount > 0) { parts.push(`${commentCount} comment${commentCount > 1 ? 's' : ''}`); partsZh.push(`${commentCount} 条评语`) }
  if (hasRating) { parts.push('a rating'); partsZh.push('评价表情') }
  const subject = `Your ${form} has new Director feedback / 你的 ${form} 有新的主管反馈`
  const text =
`Hi,

A Director has left feedback on your ${form}${when}${parts.length ? ` (${parts.join(' and ')})` : ''}.
Please log in to view it: ${link}

你好，

主管已对你的 ${form}${when} 留下反馈${partsZh.length ? `（${partsZh.join('、')}）` : ''}。
请登录系统查看：${link}

— Tassure Review`
  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;color:#1e293b;line-height:1.6">
<p>Hi,</p>
<p>A Director has left feedback on your <b>${form}</b>${when}${parts.length ? ` (${parts.join(' and ')})` : ''}.</p>
<p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View feedback / 查看反馈</a></p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
<p>你好，</p>
<p>主管已对你的 <b>${form}</b>${when} 留下反馈${partsZh.length ? `（${partsZh.join('、')}）` : ''}。请点击上方按钮登录查看。</p>
<p style="color:#94a3b8;font-size:12px">— Tassure Review</p>
</div>`
  return { subject, text, html }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ?test=1 sends one sample e-mail per form type to the override (or sender) address — no DB access
  if (request.nextUrl.searchParams.get('test') === '1') {
    const to = process.env.NOTIFY_OVERRIDE_TO || process.env.SMTP_USER || 'vincent@tassure.com'
    const appUrl = (process.env.APP_URL || request.nextUrl.origin).replace(/\/$/, '')
    const link = `${appUrl}/dashboard?tab=my-submissions`
    const samples = [
      buildEmail('Self Review', 'October 2026', 3, true, link),
      buildEmail('Leader Review', 'October 2026', 2, false, link),
    ]
    try {
      for (const m of samples) await sendMail({ to, ...m, subject: `[TEST] ${m.subject}` })
      return NextResponse.json({ test: true, sent: samples.length, to })
    } catch (e: any) {
      return NextResponse.json({ test: true, error: e?.message }, { status: 500 })
    }
  }
  if (process.env.NOTIFY_ENABLED !== 'true') {
    return NextResponse.json({ skipped: 'NOTIFY_ENABLED is not true' })
  }

  const tz = process.env.NOTIFY_TZ || 'Asia/Kuala_Lumpur'
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
  const override = process.env.NOTIFY_OVERRIDE_TO || ''

  const { data: claimed, error } = await db.rpc('claim_due_feedback_notifications', { p_limit: 20 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: { table: string; id: string; to: string; ok: boolean; error?: string }[] = []
  for (const c of (claimed || []) as any[]) {
    const to = override || c.recipient_email
    try {
      const { data: row } = await db.from(c.source_table).select('review_period').eq('id', c.submission_id).maybeSingle()
      const form = FORM_LABELS[c.source_table] || 'review'
      const mail = buildEmail(form, periodLabel((row as any)?.review_period), c.comment_count, c.has_rating, link)
      await sendMail({ to, ...mail })
      await db.from('feedback_notifications')
        .update({ notified_hash: c.claimed_hash, notified_at: new Date().toISOString(), status: 'idle', attempts: 0, last_error: null })
        .eq('source_table', c.source_table).eq('submission_id', c.submission_id)
      results.push({ table: c.source_table, id: c.submission_id, to, ok: true })
    } catch (e: any) {
      const { data: cur } = await db.from('feedback_notifications').select('attempts')
        .eq('source_table', c.source_table).eq('submission_id', c.submission_id).maybeSingle()
      await db.from('feedback_notifications')
        .update({ status: 'idle', attempts: ((cur as any)?.attempts || 0) + 1, last_error: String(e?.message || e).slice(0, 500) })
        .eq('source_table', c.source_table).eq('submission_id', c.submission_id)
      results.push({ table: c.source_table, id: c.submission_id, to, ok: false, error: e?.message })
    }
  }
  return NextResponse.json({ sent: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results })
}
