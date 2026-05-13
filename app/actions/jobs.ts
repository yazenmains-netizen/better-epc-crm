'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { queueMessage } from '@/lib/comms/queue'
import { bookingConfirmationEmail, reviewRequestSMS } from '@/lib/comms/templates'
import { logJobActivity } from '@/lib/activity'
import { format } from 'date-fns'

export async function createJob(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: row, error } = await supabase.from('jobs').insert(data).select('id').single()
  if (error) return { error: error.message }
  await logJobActivity(row.id, 'created', 'Job created')
  revalidatePath('/jobs')
  revalidatePath('/')
  return { success: true }
}

export async function updateJob(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()

  const { data: current } = await supabase.from('jobs').select('*').eq('id', id).single()

  const { error } = await supabase.from('jobs').update(data).eq('id', id)
  if (error) return { error: error.message }

  if (current) {
    const changes: string[] = []
    const str = (v: unknown) => (v == null ? '' : String(v))
    const bool = (v: unknown) => Boolean(v)
    const fmtDate = (v: unknown) =>
      v ? new Date(v as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'cleared'

    if (data.status    !== undefined && str(data.status)   !== str(current.status))   changes.push(`Status → "${data.status}"`)
    if (data.service   !== undefined && str(data.service)  !== str(current.service))   changes.push(`Service → ${data.service || 'cleared'}`)
    if (data.date      !== undefined && str(data.date)     !== str(current.date))      changes.push(`Date → ${fmtDate(data.date)}`)
    if (data.time      !== undefined && str(data.time)     !== str(current.time))      changes.push(`Time → ${data.time || 'cleared'}`)
    if (data.fee       !== undefined && str(data.fee)      !== str(current.fee))       changes.push(`Fee → £${data.fee ?? '—'}`)
    if (data.client_type !== undefined && str(data.client_type) !== str(current.client_type) && data.client_type)
      changes.push(`Client type → ${data.client_type}`)
    if (data.property_address !== undefined && str(data.property_address) !== str(current.property_address))
      changes.push('Address updated')
    if (data.contact_phone !== undefined && str(data.contact_phone) !== str(current.contact_phone))
      changes.push('Phone updated')
    if (data.contact_email !== undefined && str(data.contact_email) !== str(current.contact_email))
      changes.push('Email updated')
    if (data.notes !== undefined && str(data.notes) !== str(current.notes))
      changes.push('Notes updated')
    if (data.invoice_sent !== undefined && bool(data.invoice_sent) !== bool(current.invoice_sent))
      changes.push(data.invoice_sent ? 'Invoice marked sent' : 'Invoice sent unmarked')
    if (data.paid !== undefined && bool(data.paid) !== bool(current.paid))
      changes.push(data.paid ? 'Marked as paid' : 'Marked as unpaid')
    if (data.review_requested !== undefined && bool(data.review_requested) !== bool(current.review_requested))
      changes.push(data.review_requested ? 'Review requested' : 'Review request removed')
    if (data.review_received !== undefined && bool(data.review_received) !== bool(current.review_received))
      changes.push(data.review_received ? 'Review received' : 'Review received removed')

    if (changes.length > 0) await logJobActivity(id, 'updated', changes.join(' · '))
  }

  revalidatePath('/jobs')
  revalidatePath('/')
  revalidatePath(`/clients`)
  return { success: true }
}

export async function updateJobStatus(id: string, status: string) {
  const supabase = await createClient()

  // Sync boolean fields to match the new status
  const booleanUpdates: Record<string, unknown> = { status }
  if (status === 'Invoice Sent') {
    booleanUpdates.invoice_sent = true
    booleanUpdates.paid = false
    booleanUpdates.date_paid = null
  } else if (status === 'Paid') {
    booleanUpdates.invoice_sent = true
    booleanUpdates.paid = true
    // Only set date_paid if not already set — fetch current value first
    const { data: current } = await supabase.from('jobs').select('date_paid').eq('id', id).single()
    if (!current?.date_paid) {
      booleanUpdates.date_paid = new Date().toISOString().split('T')[0]
    }
  } else if (status === 'Cancelled') {
    booleanUpdates.invoice_sent = false
    booleanUpdates.paid = false
    booleanUpdates.date_paid = null
  } else {
    // To Be Booked, Booked In, Completed — pre-invoice stages
    booleanUpdates.invoice_sent = false
    booleanUpdates.paid = false
    booleanUpdates.date_paid = null
  }

  const { error } = await supabase.from('jobs').update(booleanUpdates).eq('id', id)
  if (error) return { error: error.message }

  await logJobActivity(id, 'status_changed', `Status changed to "${status}"`)

  // ── Automation triggers ───────────────────────────────────────────────────
  const { data: job } = await supabase
    .from('jobs')
    .select('id, ref, property_address, service, date, contact_phone, contact_email, client_type, clients(name, email)')
    .eq('id', id)
    .single()

  if (job) {
    const client = (Array.isArray(job.clients) ? job.clients[0] : job.clients) as { name: string; email: string } | null
    const recipientEmail = job.contact_email ?? client?.email ?? null
    const recipientName = client?.name ?? 'there'

    if (status === 'Booked In' && recipientEmail) {
      const { subject, body } = bookingConfirmationEmail({
        clientName: recipientName,
        propertyAddress: job.property_address ?? 'the property',
        service: job.service ?? 'assessment',
        date: job.date ? format(new Date(job.date), 'd MMMM yyyy') : 'TBC',
      })
      await queueMessage({ jobId: job.id, type: 'email', recipient: recipientEmail, subject, body })
      await logJobActivity(id, 'comm_queued', `Booking confirmation email queued for ${recipientEmail}`)
    }

    if (status === 'Paid' && job.client_type !== 'Estate Agent' && job.contact_phone) {
      const { body } = reviewRequestSMS({
        propertyAddress: job.property_address ?? 'the property',
        service: job.service ?? 'assessment',
      })
      await queueMessage({ jobId: job.id, type: 'sms', recipient: job.contact_phone, body })
      await logJobActivity(id, 'comm_queued', `Review request SMS queued for ${job.contact_phone}`)
    }
  }

  revalidatePath('/jobs')
  revalidatePath('/')
  revalidatePath('/comms')
  return { success: true }
}

export async function deleteJob(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('jobs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/jobs')
  revalidatePath('/')
  return { success: true }
}

export async function fetchJobActivity(jobId: string) {
  const supabase = await createClient()
  const [actResult, invResult] = await Promise.all([
    supabase
      .from('job_activity')
      .select('id, type, description, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, ref, amount, status, invoice_date')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false }),
  ])
  return {
    activity: (actResult.data ?? []) as { id: string; type: string; description: string; created_at: string }[],
    invoices: (invResult.data ?? []) as { id: string; ref: string; amount: number | null; status: string | null; invoice_date: string | null }[],
  }
}
