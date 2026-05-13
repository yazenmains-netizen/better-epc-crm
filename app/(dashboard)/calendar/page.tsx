import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/calendar/CalendarView'
import { Job, Client } from '@/lib/types'

export default async function CalendarPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: clients }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, clients(id, name)')
      .not('date', 'is', null)
      .order('date', { ascending: true }),
    supabase.from('clients').select('*').order('name'),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <CalendarView
        initialJobs={(jobs as Job[]) || []}
        clients={(clients as Client[]) || []}
      />
    </div>
  )
}
