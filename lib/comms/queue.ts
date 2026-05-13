import { createClient } from '@/lib/supabase/server'

interface QueueMessageParams {
  jobId: string
  type: 'email' | 'sms'
  recipient: string
  subject?: string
  body: string
}

export async function queueMessage(params: QueueMessageParams) {
  const supabase = await createClient()
  const { error } = await supabase.from('comms_queue').insert({
    job_id: params.jobId,
    type: params.type,
    recipient: params.recipient,
    subject: params.subject ?? null,
    body: params.body,
    status: 'pending',
  })
  if (error) console.error('[comms_queue] insert error:', error.message)
}
