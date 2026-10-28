// Singapore public holidays (weekday dates that are days off, incl. the Monday
// in lieu when a holiday falls on a Sunday). Update once a year from
// https://www.mom.gov.sg/employment-practices/public-holidays
export const SG_PUBLIC_HOLIDAYS = new Set<string>([
  // 2026 (gazetted)
  '2026-01-01', // New Year's Day
  '2026-02-17', '2026-02-18', // Chinese New Year
  '2026-04-03', // Good Friday
  '2026-05-01', // Labour Day
  '2026-05-27', // Hari Raya Haji
  '2026-06-01', // Vesak Day (in lieu of Sun 31 May)
  '2026-08-10', // National Day (in lieu of Sun 9 Aug)
  '2026-11-09', // Deepavali (in lieu of Sun 8 Nov)
  '2026-12-25', // Christmas Day

  // 2027 — please check against MOM's official list
  '2027-01-01', // New Year's Day
  '2027-02-08', // Chinese New Year (in lieu of Sun 7 Feb)
  '2027-03-10', // Hari Raya Puasa
  '2027-03-26', // Good Friday
  '2027-05-17', // Hari Raya Haji
  '2027-05-20', // Vesak Day
  '2027-08-09', // National Day
  '2027-10-28', // Deepavali
])

// Years the list above covers
export function holidayYears() {
  return new Set([...SG_PUBLIC_HOLIDAYS].map(d => Number(d.slice(0, 4))))
}

// Sent to Vincent from 1 July each year, once a month, until next year's holidays are added
export function buildHolidayReminderEmail(year: number) {
  const subject = `【Tassure Review】Please add Singapore public holidays for ${year}`
  const text =
`Hi Vincent,

The Tassure Review System does not have the Singapore public holidays for ${year} yet.

Without them, from January ${year} the monthly review reminder will only skip weekends, not public holidays, when it picks the send date and the deadline.

What to do:
1. Check the official list: https://www.mom.gov.sg/employment-practices/public-holidays
2. Ask Claude to add the ${year} dates to lib/notify/sgHolidays.ts in the tassure-review-form project.

You will get this reminder once a month until the ${year} dates are added.

— Tassure Review System`
  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#1e293b;line-height:1.6;font-size:14px">
<div style="font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#64748b;padding-bottom:10px;border-bottom:2px solid #1e3a5f;margin-bottom:18px">Tassure Review System</div>
<p>Hi Vincent,</p>
<p>The Tassure Review System does not have the <b>Singapore public holidays for ${year}</b> yet.</p>
<p>Without them, from January ${year} the monthly review reminder will only skip weekends, not public holidays, when it picks the send date and the deadline.</p>
<p style="margin-bottom:6px;font-weight:700">What to do:</p>
<ol style="margin-top:0;padding-left:20px">
<li>Check the official list: <a href="https://www.mom.gov.sg/employment-practices/public-holidays">MOM — Public holidays</a></li>
<li>Ask Claude to add the ${year} dates to <code>lib/notify/sgHolidays.ts</code> in the tassure-review-form project.</li>
</ol>
<p style="color:#64748b">You will get this reminder once a month until the ${year} dates are added.</p>
<p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px">— Tassure Review System</p>
</div>`
  return { subject, text, html }
}
