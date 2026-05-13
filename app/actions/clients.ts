'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClientRecord(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}

export async function updateClientRecord(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return { success: true }
}

export async function deleteClientRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}
