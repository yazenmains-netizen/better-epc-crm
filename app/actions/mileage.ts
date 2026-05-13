'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMileage(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('mileage').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/mileage')
  return { success: true }
}

export async function updateMileage(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase.from('mileage').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/mileage')
  return { success: true }
}

export async function deleteMileage(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('mileage').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/mileage')
  return { success: true }
}
