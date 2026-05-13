import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, sendSMS } from '@/lib/comms/send'
import { logJobActivity } from '@/lib/activity'

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createClient()

  const { data: msg, error } = await supabase
    .from('comms_queue')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single()

  if (error || !msg) return NextResponse.json({ error: 'Message not found or already processed' }, { status: 404 })

  try {
    if (msg.type === 'email') {
      await sendEmail({ to: msg.recipient, subject: msg.subject ?? '(no subject)', body: msg.body })
    } else {
      await sendSMS({ to: msg.recipient, body: msg.body })
    }

    await supabase
      .from('comms_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id)

    if (msg.job_id) {
      await logJobActivity(msg.job_id, 'comm_sent', `${msg.type === 'email' ? 'Email' : 'SMS'} sent to ${msg.recipient}`)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Send failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
