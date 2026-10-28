import nodemailer from 'nodemailer'

export type MailMessage = { to: string; subject: string; html: string; text: string }

// Google Workspace SMTP with an App Password. Swap this one file to change provider.
export async function sendMail(msg: MailMessage) {
  const user = process.env.SMTP_USER || 'vincent@tassure.com'
  const pass = process.env.SMTP_PASS
  if (!user || !pass) throw new Error('SMTP_USER / SMTP_PASS not configured')

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
  await transport.sendMail({
    from: `"Tassure Review" <${user}>`,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  })
}
