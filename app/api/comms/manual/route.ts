import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, sendSMS } from '@/lib/comms/send'
import { logJobActivity } from '@/lib/activity'
import {
  bookingConfirmationEmail,
  dayBeforeReminderSMS,
  reviewRequestSMS,
  paymentChaserEmail,
} from '@/lib/comms/templates'
import { format } from 'date-fns'

function plainToHtml(text: string): string {
  const SIG_HTML = `<br><br><strong>Yazen Yafai</strong><br>Better EPC Rating<br>07413 993550 | <a href="https://www.yourhomespecialist.co.uk">yourhomespecialist.co.uk</a>`
  const sigPlain = '\n\nYazen Yafai\nBetter EPC Rating\n07413 993550 | yourhomespecialist.co.uk'

  // Strip the plain-text signature so we re-add it as HTML
  const stripped = text.endsWith(sigPlain.trim())
    ? text.slice(0, text.lastIndexOf('\n\nYazen Yafai')).trim()
    : text.trim()

  const html = stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map(line => line.trim() === '' ? '<br>' : `<p style="margin:0 0 8px 0;font-family:sans-serif;font-size:14px;line-height:1.6;color:#333;">${line}</p>`)
    .join('')

  return html + SIG_HTML
}

export async function POST(req: NextRequest) {
  const { jobId, template, customBody, customSubject, channel, manualBody, manualSubject, manualRecipient } = await req.json()

  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, ref, property_address, service, date, fee, contact_phone, client_type, clients(name, email)')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const client = (Array.isArray(job.clients) ? job.clients[0] : job.clients) as { name: string; email: string } | null

  // ── Manual compose path (body provided directly from compose UI) ──────────
  if (manualBody) {
    const ch = channel as 'email' | 'sms'
    const recipient: string = manualRecipient?.trim()
      || (ch === 'email' ? (client?.email ?? '') : (job.contact_phone ?? ''))

    if (!recipient) return NextResponse.json({ error: `No ${ch === 'email' ? 'email' : 'phone'} provided` }, { status: 400 })

    const htmlBody = ch === 'email' ? plainToHtml(manualBody) : manualBody

    try {
      if (ch === 'email') await sendEmail({ to: recipient, subject: manualSubject ?? '', body: htmlBody })
      else await sendSMS({ to: recipient, body: manualBody })
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Send failed' }, { status: 500 })
    }

    await supabase.from('comms_queue').insert({
      job_id: jobId,
      type: ch,
      recipient,
      subject: manualSubject ?? null,
      body: manualBody,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    await logJobActivity(jobId, 'comm_sent', `${ch === 'email' ? 'Email' : 'SMS'} sent to ${recipient}`)
    return NextResponse.json({ success: true })
  }

  let type: 'email' | 'sms'
  let recipient: string
  let subject: string | undefined
  let body: string

  if (template === 'booking-confirmation') {
    if (!client?.email) return NextResponse.json({ error: 'No client email' }, { status: 400 })
    const msg = bookingConfirmationEmail({
      clientName: client.name,
      propertyAddress: job.property_address ?? 'the property',
      service: job.service ?? 'assessment',
      date: job.date ? format(new Date(job.date), 'd MMMM yyyy') : 'your scheduled date',
    })
    type = 'email'; recipient = client.email; subject = msg.subject; body = msg.body

  } else if (template === 'day-before-reminder') {
    if (!job.contact_phone) return NextResponse.json({ error: 'No contact phone' }, { status: 400 })
    const msg = dayBeforeReminderSMS({
      propertyAddress: job.property_address ?? 'the property',
      date: job.date ? format(new Date(job.date), 'd MMMM yyyy') : 'your scheduled date',
      service: job.service ?? 'assessment',
    })
    type = 'sms'; recipient = job.contact_phone; body = msg.body

  } else if (template === 'review-request') {
    if (!job.contact_phone) return NextResponse.json({ error: 'No contact phone' }, { status: 400 })
    const msg = reviewRequestSMS({
      propertyAddress: job.property_address ?? 'the property',
      service: job.service ?? 'assessment',
    })
    type = 'sms'; recipient = job.contact_phone; body = msg.body

  } else if (template === 'payment-chaser') {
    if (!client?.email) return NextResponse.json({ error: 'No client email' }, { status: 400 })
    const msg = paymentChaserEmail({
      clientName: client.name,
      ref: job.ref ?? 'N/A',
      fee: job.fee ?? 0,
    })
    type = 'email'; recipient = client.email; subject = msg.subject; body = msg.body

  } else if (template === 'custom') {
    if (!customBody) return NextResponse.json({ error: 'No message body' }, { status: 400 })
    type = channel as 'email' | 'sms'
    recipient = type === 'email' ? (client?.email ?? '') : (job.contact_phone ?? '')
    if (!recipient) return NextResponse.json({ error: 'No recipient' }, { status: 400 })
    body = customBody
    subject = customSubject

  } else {
    return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
  }

  try {
    if (type === 'email') {
      await sendEmail({ to: recipient, subject: subject!, body })
    } else {
      await sendSMS({ to: recipient, body })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Send failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await supabase.from('comms_queue').insert({
    job_id: jobId,
    type,
    recipient,
    subject: subject ?? null,
    body,
    status: 'sent',
    sent_at: new Date().toISOString(),
  })

  await logJobActivity(jobId, 'comm_sent', `${type === 'email' ? 'Email' : 'SMS'} sent to ${recipient}`)
  return NextResponse.json({ success: true })
}
