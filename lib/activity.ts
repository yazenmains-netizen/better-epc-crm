import { createClient } from '@/lib/supabase/server'

export async function logJobActivity(
  jobId: string | null | undefined,
  type: string,
  description: string,
) {
  if (!jobId) return
  const supabase = await createClient()
  // Non-critical — ignore errors (e.g. table not yet created)
  await supabase.from('job_activity').insert({ job_id: jobId, type, description })
}
