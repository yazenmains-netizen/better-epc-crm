import { createClient } from '@/lib/supabase/server'
import { MileageClient } from '@/components/mileage/MileageClient'
import { Mileage, Job } from '@/lib/types'

export default async function MileagePage() {
  const supabase = await createClient()

  const [{ data: trips }, { data: jobs }] = await Promise.all([
    supabase
      .from('mileage')
      .select('*, jobs(ref)')
      .order('date', { ascending: false }),
    supabase.from('jobs').select('id, ref').order('ref'),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <MileageClient
        initialTrips={(trips as Mileage[]) || []}
        jobs={(jobs as Job[]) || []}
      />
    </div>
  )
}
