// Monthly "please submit your review" e-mail.
// Sent on the Monday of the week (Mon–Sun) that holds the month's last day;
// the deadline is the Friday of that same week, even when it falls next month.
// e.g. Sep 2026: 30 Sep is a Wednesday -> send Mon 28 Sep, deadline Fri 2 Oct.
// Singapore public holidays: a holiday deadline moves back to the previous working
// day, a holiday send date moves forward to the next working day.

import { SG_PUBLIC_HOLIDAYS } from './sgHolidays'
import { ALL_USERS, DIRECTOR_EMAILS } from '../auth'

// People who no longer receive any review e-mail (monthly reminder or comment notification)
export const NO_EMAIL = new Set<string>([
  'minquan@tassure.com', // from the October 2026 cycle
])

// Monthly reminder: To = everyone who fills in a review, CC = management + Esther.
export const REMINDER_CC = [...DIRECTOR_EMAILS, 'esther@tassure.com']

export function reminderRecipients(sender: string) {
  const cc = REMINDER_CC.filter(e => !NO_EMAIL.has(e))
  const to = ALL_USERS.map(u => u.email)
    .filter(e => e !== sender && !cc.includes(e) && !NO_EMAIL.has(e))
  return { to, cc }
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export type ReminderPlan = {
  period: string        // '2026-09' — the month being reviewed
  monthLabel: string    // 'September 2026'
  sendDate: string      // '2026-09-28'
  deadlineLabel: string // '2 Oct 2026'
  deadlineDay: string   // 'Friday'
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const isHoliday = (d: Date) => SG_PUBLIC_HOLIDAYS.has(iso(d))

// Today's calendar date in the given time zone, as a UTC-midnight Date
export function todayIn(tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return new Date(`${parts}T00:00:00Z`)
}

export function reminderPlanFor(year: number, monthIndex: number): ReminderPlan {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0))
  const sinceMonday = (lastDay.getUTCDay() + 6) % 7
  const monday = new Date(lastDay); monday.setUTCDate(lastDay.getUTCDate() - sinceMonday)
  const deadline = new Date(monday); deadline.setUTCDate(monday.getUTCDate() + 4)
  while (isHoliday(deadline) && deadline > monday) deadline.setUTCDate(deadline.getUTCDate() - 1)
  const send = new Date(monday)
  while (isHoliday(send) && send < deadline) send.setUTCDate(send.getUTCDate() + 1)
  return {
    period: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    monthLabel: `${MONTHS[monthIndex]} ${year}`,
    sendDate: iso(send),
    deadlineLabel: `${deadline.getUTCDate()} ${SHORT[deadline.getUTCMonth()]} ${deadline.getUTCFullYear()}`,
    deadlineDay: DAYS[deadline.getUTCDay()],
  }
}

// The plan whose send date is today, or null
export function reminderDueToday(today: Date): ReminderPlan | null {
  const plan = reminderPlanFor(today.getUTCFullYear(), today.getUTCMonth())
  return plan.sendDate === iso(today) ? plan : null
}

export function buildReminderEmail(plan: ReminderPlan, link: string) {
  const subject = `【TASSURE】${plan.monthLabel} Employee Review Form Submission`
  const due = `${plan.deadlineDay}, ${plan.deadlineLabel}`
  const text =
`Dear All,

It's time to complete your Employee Review Form for ${plan.monthLabel}.

Deadline: ${due}

👉 Fill in my Review Form: ${link}

Before you start:
1. Log in with your company Google account (name@tassure.com).
2. You can upload images or files as supporting documents.
3. Your draft is saved automatically, so you can come back and continue any time before you submit.

Important: once the form is submitted, it can no longer be changed. Please check everything carefully before clicking Submit.

If you have any technical issues, just reply to this e-mail or let me know.

Thank you!

Best regards,
Vincent Seow
Tassure Review System`
  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#1e293b;line-height:1.6;font-size:14px">
<div style="font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#64748b;padding-bottom:10px;border-bottom:2px solid #1e3a5f;margin-bottom:18px">Tassure Review System</div>
<p>Dear All,</p>
<p>It's time to complete your <b>Employee Review Form</b> for <b>${plan.monthLabel}</b>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:collapse"><tr>
<td style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:12px 18px">
<div style="font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#92400e">Submission deadline</div>
<div style="font-size:18px;font-weight:700;color:#78350f;margin-top:2px">${due}</div>
</td></tr></table>
<p style="margin:22px 0"><a href="${link}" style="display:inline-block;padding:12px 26px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">👉 Fill in my Review Form</a></p>
<p style="margin-bottom:6px;font-weight:700">Before you start:</p>
<ol style="margin-top:0;padding-left:20px">
<li>Log in with your company Google account (<b>name@tassure.com</b>).</li>
<li>You can upload images or files as supporting documents.</li>
<li>Your draft is saved automatically, so you can come back and continue any time before you submit.</li>
</ol>
<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:10px 14px;margin:18px 0;color:#991b1b;border-radius:4px">
<b>Important:</b> once the form is submitted, it can no longer be changed. Please check everything carefully before clicking <b>Submit</b>.
</div>
<p>If you have any technical issues, just reply to this e-mail or let me know.</p>
<p>Thank you!</p>
<p style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px">Best regards,<br><b>Vincent Seow</b><br><span style="color:#94a3b8;font-size:12px">Tassure Review System</span></p>
</div>`
  return { subject, text, html }
}
