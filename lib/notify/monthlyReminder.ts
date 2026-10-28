// Monthly "please submit your review" e-mail.
// Sent on the Monday of the week (Mon–Sun) that holds the month's last day;
// the deadline is the Friday of that same week, even when it falls next month.
// e.g. Sep 2026: 30 Sep is a Wednesday -> send Mon 28 Sep, deadline Fri 2 Oct.

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export type ReminderPlan = {
  period: string        // '2026-09' — the month being reviewed
  monthLabel: string    // 'September 2026'
  sendDate: string      // '2026-09-28'
  deadlineLabel: string // '2 Oct 2026'
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

// Today's calendar date in the given time zone, as a UTC-midnight Date
export function todayIn(tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return new Date(`${parts}T00:00:00Z`)
}

export function reminderPlanFor(year: number, monthIndex: number): ReminderPlan {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0))
  const sinceMonday = (lastDay.getUTCDay() + 6) % 7
  const send = new Date(lastDay); send.setUTCDate(lastDay.getUTCDate() - sinceMonday)
  const deadline = new Date(send); deadline.setUTCDate(send.getUTCDate() + 4)
  return {
    period: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    monthLabel: `${MONTHS[monthIndex]} ${year}`,
    sendDate: iso(send),
    deadlineLabel: `${deadline.getUTCDate()} ${SHORT[deadline.getUTCMonth()]} ${deadline.getUTCFullYear()}`,
  }
}

// The plan whose send date is today, or null
export function reminderDueToday(today: Date): ReminderPlan | null {
  const plan = reminderPlanFor(today.getUTCFullYear(), today.getUTCMonth())
  return plan.sendDate === iso(today) ? plan : null
}

export function buildReminderEmail(plan: ReminderPlan, link: string) {
  const subject = `【TASSURE】${plan.monthLabel} Employee Review Form Submission`
  const text =
`Dear All,

Please complete your Employee Review Form for ${plan.monthLabel} by clicking the link below:
👉 Monthly Review Form: ${link}

Kindly take note of the following:
1. Please log in using your company email account (name@tassure.com).
2. You may upload images or files as supporting documents.
3. Please submit the form by ${plan.deadlineLabel}.

Please note that once the form is submitted, no further changes can be made. Kindly review all details carefully before clicking Submit.

Should you encounter any technical issues, please feel free to let me know.

--
Vincent Seow`
  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;line-height:1.6;font-size:14px">
<p>Dear All,</p>
<p>Please complete your <b>Employee Review Form</b> for <b>${plan.monthLabel}</b> by clicking the link below:</p>
<p>👉 <a href="${link}" style="color:#1a56db">Monthly Review Form</a></p>
<p>______________________</p>
<p>Kindly take note of the following:</p>
<ol style="margin-top:0">
<li>Please log in using your company email account: <b>name@tassure.com</b>.</li>
<li>You may upload images or files as supporting documents.</li>
<li>Please submit the form by <b>${plan.deadlineLabel}</b>.</li>
</ol>
<p>______________________</p>
<p style="color:#dc2626">Please note that once the form is submitted, no further changes can be made. Kindly review all details carefully before clicking <b>Submit</b>.</p>
<p>Should you encounter any technical issues, please feel free to let me know.</p>
<p>--<br>Vincent Seow</p>
</div>`
  return { subject, text, html }
}
