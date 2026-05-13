'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { createInvoice, updateInvoice, deleteInvoice } from '@/app/actions/invoices'
import { Invoice, Client, Job, PAYMENT_METHODS } from '@/lib/types'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']

interface InvoiceModalProps {
  open: boolean
  onClose: () => void
  invoice?: Invoice | null
  clients: Client[]
  jobs: Job[]
}

const EMPTY: Partial<Invoice> = {
  ref: '',
  invoice_date: '',
  due_date: '',
  amount: undefined,
  status: 'Draft',
  notes: '',
}

export function InvoiceModal({ open, onClose, invoice, clients, jobs }: InvoiceModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Invoice>>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm(invoice || EMPTY)
  }, [invoice, open])

  function set(field: keyof Invoice, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleJobChange(jobId: string) {
    setForm(f => {
      const updated: Partial<Invoice> = { ...f, job_id: jobId }
      if (!invoice && jobId) {
        const j = jobs.find(j => j.id === jobId)
        if (j) {
          if (j.client_id) updated.client_id = j.client_id
          if (j.fee != null) updated.amount = j.fee
          if (!f.ref && j.ref) updated.ref = j.ref
        }
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ref: form.ref,
      job_id: form.job_id || null,
      client_id: form.client_id || null,
      invoice_date: form.invoice_date || null,
      due_date: form.due_date || null,
      amount: form.amount ? Number(form.amount) : null,
      status: form.status || 'Draft',
      payment_method: form.payment_method || null,
      date_paid: form.date_paid || null,
      notes: form.notes || null,
    }
    const result = invoice
      ? await updateInvoice(invoice.id, payload)
      : await createInvoice(payload)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(invoice ? 'Invoice updated' : 'Invoice created')
      router.refresh(); onClose()
    }
  }

  async function handleDelete() {
    if (!invoice) return
    if (!confirm('Delete this invoice?')) return
    setLoading(true)
    const result = await deleteInvoice(invoice.id)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else { toast.success('Invoice deleted'); router.refresh(); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice ? `Edit Invoice — ${invoice.ref}` : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Invoice Ref *</Label>
              <Input value={form.ref || ''} onChange={e => set('ref', e.target.value)} placeholder="HA0012" required />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <NativeSelect value={form.status || ''} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <NativeSelect value={form.client_id || ''} onChange={e => set('client_id', e.target.value)} placeholder="Select client…">
                <option value="">None</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Job</Label>
              <NativeSelect value={form.job_id || ''} onChange={e => handleJobChange(e.target.value)} placeholder="Select job…">
                <option value="">None</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.ref ? `${j.ref} – ` : ''}{j.property_address || 'No address'}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Invoice Date</Label>
              <Input type="date" value={form.invoice_date || ''} onChange={e => set('invoice_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount (£)</Label>
              <Input type="number" value={form.amount ?? ''} onChange={e => set('amount', e.target.value ? Number(e.target.value) : undefined)} placeholder="70" min="0" step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <NativeSelect value={form.payment_method || ''} onChange={e => set('payment_method', e.target.value)} placeholder="Select…">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Date Paid</Label>
            <Input type="date" value={form.date_paid || ''} onChange={e => set('date_paid', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between pt-2">
            {invoice ? (
              <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1.5" />Delete
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" className="bg-[#16512a] hover:bg-[#0f3d1e] text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : invoice ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
