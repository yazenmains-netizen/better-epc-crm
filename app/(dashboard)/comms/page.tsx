export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { CommsHub } from '@/components/comms/CommsHub'

export default async function CommsPage() {
  const supabase = await createClient()

  const [{ data: commsItems }, { data: jobs }] = await Promise.all([
    supabase
      .from('comms_queue')
      .select('id, type, recipient, subject, body, status, created_at, sent_at, jobs(ref, property_address, service, clients(name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('id, ref, property_address, service, date, fee, contact_phone, client_type, status, clients(name, email, phone)')
      .not('status', 'eq', 'Cancelled')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Approve pending messages, view history, and send manual messages to clients
        </p>
      </div>
      <CommsHub
        initialItems={commsItems as never ?? []}
        jobs={jobs as never ?? []}
        googleReviewUrl={process.env.GOOGLE_REVIEW_URL ?? 'https://www.yourhomespecialist.co.uk'}
      />
    </div>
  )
}
