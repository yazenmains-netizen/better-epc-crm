import { createClient } from '@/lib/supabase/server'
import { ExpensesClient } from '@/components/expenses/ExpensesClient'
import { Expense } from '@/lib/types'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ExpensesClient initialExpenses={(expenses as Expense[]) || []} />
    </div>
  )
}
