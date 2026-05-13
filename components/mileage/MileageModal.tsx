'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { createMileage, updateMileage, deleteMileage } from '@/app/actions/mileage'
import { Mileage, Job } from '@/lib/types'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface MileageModalProps {
  open: boolean
  onClose: () => void
  trip?: Mileage | null
  jobs: Job[]
}

const EMPTY: Partial<Mileage> = {
  trip_name: '',
  date: '',
  from_location: '',
  to_location: '',
  purpose: '',
  miles: undefined,
  rate: 0.45,
  notes: '',
}

export function MileageModal({ open, onClose, trip, jobs }: MileageModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Mileage>>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setForm(trip || EMPTY) }, [trip, open])

  function set(field: keyof Mileage, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const estimatedClaim = ((form.miles || 0) * (form.rate || 0.45)).toFixed(2)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      trip_name: form.trip_name || (form.from_location && form.to_location ? `${form.from_location} → ${form.to_location}` : null),
      date: form.date || null,
      from_location: form.from_location || null,
      to_location: form.to_location || null,
      job_id: form.job_id || null,
      purpose: form.purpose || null,
      miles: form.miles ? Number(form.miles) : null,
      rate: form.rate ? Number(form.rate) : 0.45,
      notes: form.notes || null,
    }
    const result = trip ? await updateMileage(trip.id, payload) : await createMileage(payload)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else { toast.success(trip ? 'Trip updated' : 'Trip added'); router.refresh(); onClose() }
  }

  async function handleDelete() {
    if (!trip) return
    if (!confirm('Delete this trip?')) return
    setLoading(true)
    const result = await deleteMileage(trip.id)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else { toast.success('Trip deleted'); router.refresh(); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{trip ? 'Edit Trip' : 'Log Mileage'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Linked Job</Label>
              <NativeSelect value={form.job_id || ''} onChange={e => set('job_id', e.target.value)} placeholder="Optional…">
                <option value="">None</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.ref}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input value={form.from_location || ''} onChange={e => set('from_location', e.target.value)} placeholder="25 Rosefield Road" />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input value={form.to_location || ''} onChange={e => set('to_location', e.target.value)} placeholder="Property address" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Input value={form.purpose || ''} onChange={e => set('purpose', e.target.value)} placeholder="EPC inspection" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Miles</Label>
              <Input type="number" value={form.miles ?? ''} onChange={e => set('miles', e.target.value ? Number(e.target.value) : undefined)} placeholder="12.5" min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label>Rate (£/mile)</Label>
              <Input type="number" value={form.rate ?? 0.45} onChange={e => set('rate', Number(e.target.value))} step="0.001" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Claim (£)</Label>
              <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-[#16512a]">
                £{estimatedClaim}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between pt-2">
            {trip ? (
              <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1.5" />Delete
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" className="bg-[#16512a] hover:bg-[#0f3d1e] text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : trip ? 'Save' : 'Log trip'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
