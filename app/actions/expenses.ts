'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createExpense(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/expenses')
  revalidatePath('/')
  return { success: true }
}

export async function updateExpense(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/expenses')
  revalidatePath('/')
  return { success: true }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/expenses')
  return { success: true }
}
