import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queueMessage } from '@/lib/comms/queue'
import { dayBeforeReminderSMS, paymentChaserEmail } from '@/lib/comms/templates'
import { format, addDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const twentyOneDaysAgo = format(addDays(new Date(), -21), 'yyyy-MM-dd')

  let queued = 0

  // ── Day-before SMS reminders ──────────────────────────────────────────────
  const { data: upcomingJobs } = await supabase
    .from('jobs')
    .select('id, property_address, service, date, contact_phone, client_type')
    .eq('date', tomorrow)
    .eq('status', 'Booked In')
    .neq('client_type', 'Estate Agent')
    .not('contact_phone', 'is', null)

  for (const job of upcomingJobs ?? []) {
    const { body } = dayBeforeReminderSMS({
      propertyAddress: job.property_address ?? 'the property',
      date: format(new Date(job.date), 'd MMMM yyyy'),
      service: job.service ?? 'assessment',
    })
    await queueMessage({ jobId: job.id, type: 'sms', recipient: job.contact_phone, body })
    queued++
  }

  // ── Payment chaser emails ─────────────────────────────────────────────────
  const { data: unpaidJobs } = await supabase
    .from('jobs')
    .select('id, ref, fee, client_id, created_at, clients(name, email)')
    .eq('status', 'Invoice Sent')
    .eq('paid', false)
    .lte('created_at', `${twentyOneDaysAgo}T23:59:59Z`)

  for (const job of unpaidJobs ?? []) {
    const client = (Array.isArray(job.clients) ? job.clients[0] : job.clients) as { name: string; email: string } | null
    if (!client?.email) continue

    const { subject, body } = paymentChaserEmail({
      clientName: client.name,
      ref: job.ref ?? 'N/A',
      fee: job.fee ?? 0,
    })
    await queueMessage({ jobId: job.id, type: 'email', recipient: client.email, subject, body })
    queued++
  }

  return NextResponse.json({ success: true, queued })
}
