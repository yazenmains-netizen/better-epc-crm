import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = new URLSearchParams(body)

  const from = params.get('From') ?? ''
  const messageBody = params.get('Body') ?? ''

  if (!from || !messageBody) {
    return new NextResponse('', { status: 200 })
  }

  const supabase = await createClient()

  // Find the most recent sent SMS to this number to link the reply
  const normalised = from.replace(/\s+/g, '')
  const { data: original } = await supabase
    .from('comms_queue')
    .select('id, job_id')
    .eq('type', 'sms')
    .eq('status', 'sent')
    .eq('recipient', normalised)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  await supabase.from('sms_replies').insert({
    from_number: from,
    body: messageBody,
    comms_queue_id: original?.id ?? null,
    job_id: original?.job_id ?? null,
  })

  // Twilio expects an empty TwiML response
  return new NextResponse('<Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
