'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logJobActivity } from '@/lib/activity'

export async function createInvoice(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: row, error } = await supabase.from('invoices').insert(data).select('id').single()
  if (error) return { error: error.message }
  const jobId = data.job_id as string | null
  const ref = data.ref as string
  await logJobActivity(jobId, 'invoice', `Invoice ${ref} generated`)
  revalidatePath('/invoices')
  revalidatePath('/')
  return { success: true, id: row.id as string }
}

export async function updateInvoice(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/invoices')
  revalidatePath('/')
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/invoices')
  return { success: true }
}
