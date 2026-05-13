import { createClient } from '@/lib/supabase/server'
import { InvoicesClient } from '@/components/invoices/InvoicesClient'
import { Invoice, Client, Job } from '@/lib/types'

export default async function InvoicesPage() {
  const supabase = await createClient()

  const [{ data: invoices }, { data: clients }, { data: jobs }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, jobs(ref, property_address), clients(name)')
      .order('invoice_date', { ascending: false }),
    supabase.from('clients').select('*').order('name'),
    supabase.from('jobs').select('id, ref, property_address, postcode, service, client_id, client_type, fee, status').order('ref'),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <InvoicesClient
        initialInvoices={(invoices as Invoice[]) || []}
        clients={(clients as Client[]) || []}
        jobs={(jobs as Job[]) || []}
      />
    </div>
  )
}
