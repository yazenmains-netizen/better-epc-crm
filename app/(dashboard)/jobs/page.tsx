import { createClient } from '@/lib/supabase/server'
import { JobsPageClient } from '@/components/jobs/JobsPageClient'
import { Job, Client } from '@/lib/types'

export default async function JobsPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: clients }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, clients(id, name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('*')
      .eq('active', true)
      .order('name'),
  ])

  return (
    <JobsPageClient
      initialJobs={(jobs as Job[]) || []}
      clients={(clients as Client[]) || []}
    />
  )
}
