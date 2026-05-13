import nodemailer from 'nodemailer'
import twilio from 'twilio'

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `Better EPC Rating <${process.env.GMAIL_FROM ?? process.env.GMAIL_USER}>`,
    to,
    subject,
    html: body,
  })
}

export async function sendSMS({ to, body }: { to: string; body: string }) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  // Normalise UK numbers to E.164
  const formatted = to.replace(/^0/, '+44').replace(/\s+/g, '')

  await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to: formatted,
    body,
  })
}
