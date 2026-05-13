import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/ClientsTable'
import { Client } from '@/lib/types'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ClientsTable initialClients={(clients as Client[]) || []} />
    </div>
  )
}
