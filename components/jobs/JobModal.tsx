'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { createJob, updateJob, deleteJob, fetchJobActivity } from '@/app/actions/jobs'
import { Job, Client, JOB_STATUSES, SERVICES, CLIENT_TYPES } from '@/lib/types'
import { Loader2, Trash2, FileDown, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface JobModalProps {
  open: boolean
  onClose: () => void
  job?: Job | null
  clients: Client[]
  defaultStatus?: string
  defaultDate?: string
}

const EMPTY: Partial<Job> = {
  ref: '', status: 'New Lead', service: '', property_address: '',
  postcode: '', contact_phone: '', contact_email: '', fee: 250, deposit_amount: 60,
  source: '', client_type: '', notes: '', invoice_sent: false, paid: false,
  deposit_paid: false,
}

type ActivityItem = { id: string; type: string; description: string; created_at: string }
type LinkedInvoice = { id: string; ref: string; amount: number | null; status: string | null; invoice_date: string | null }

function activityDot(type: string) {
  if (type === 'created')      return 'bg-green-400'
  if (type === 'status_changed') return 'bg-blue-400'
  if (type === 'comm_sent')    return 'bg-purple-400'
  if (type === 'comm_queued')  return 'bg-amber-400'
  if (type === 'invoice')      return 'bg-teal-400'
  return 'bg-gray-300'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function JobModal({ open, onClose, job, clients, defaultStatus, defaultDate }: JobModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Job>>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'details' | 'activity'>('details')
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [linkedInvoices, setLinkedInvoices] = useState<LinkedInvoice[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => {
    if (job) setForm(job)
    else setForm({ ...EMPTY, status: (defaultStatus as Job['status']) || 'New Lead', date: defaultDate || '' })
    setTab('details')
  }, [job, defaultStatus, open])

  useEffect(() => {
    if (open && job?.id) {
      setLoadingActivity(true)
      fetchJobActivity(job.id).then(({ activity, invoices }) => {
        setActivity(activity)
        setLinkedInvoices(invoices)
        setLoadingActivity(false)
      })
    } else {
      setActivity([])
      setLinkedInvoices([])
    }
  }, [open, job?.id])

  function set(field: keyof Job, value: unknown) {
    if (field === 'status') {
      setForm(f => ({
        ...f,
        status: value as Job['status'],
        deposit_paid: value === 'Deposit Paid' || value === 'Survey Booked' || value === 'Survey Complete' || value === 'Modelling Complete' || value === 'Awaiting Final Payment' || value === 'Report Released' ? true : f.deposit_paid,
        paid: value === 'Report Released' ? true : value === 'New Lead' || value === 'Deposit Paid' || value === 'Survey Booked' ? false : f.paid,
        date_paid: value === 'Report Released' ? (f.date_paid || new Date().toISOString().split('T')[0]) : f.date_paid,
      }))
      return
    }
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ref: form.ref, status: form.status, date: form.date || null, time: form.time || null,
      client_id: form.client_id || null, client_type: form.client_type || null,
      contact_phone: form.contact_phone || null, contact_email: form.contact_email || null,
      property_address: form.property_address || null, postcode: form.postcode || null,
      service: form.service || null,
      fee: form.fee ? Number(form.fee) : null,
      deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
      deposit_paid: form.deposit_paid ?? false,
      invoice_sent: form.invoice_sent ?? false,
      paid: form.paid ?? false, date_paid: form.date_paid || null,
      source: form.source || null, notes: form.notes || null,
    }
    const result = job ? await updateJob(job.id, payload) : await createJob(payload)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else { toast.success(job ? 'Job updated' : 'Job created'); router.refresh(); onClose() }
  }

  async function handleDelete() {
    if (!job || !confirm('Delete this job? This cannot be undone.')) return
    setLoading(true)
    const result = await deleteJob(job.id)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else { toast.success('Job deleted'); router.refresh(); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? `Edit Job — ${job.ref}` : 'Add New Job'}</DialogTitle>
        </DialogHeader>

        {/* Tab switcher — only for existing jobs */}
        {job && (
          <div className="flex border-b border-gray-100 -mx-6 px-6 gap-5 -mt-1 mb-1">
            {(['details', 'activity'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'pb-2 text-sm font-medium border-b-2 capitalize transition-colors',
                  tab === t ? 'border-[#16512a] text-[#16512a]' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {t}
                {t === 'activity' && activity.length > 0 && (
                  <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{activity.length}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Details tab ─────────────────────────────────────────────────── */}
        {tab === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Ref *</Label>
                <Input value={form.ref || ''} onChange={e => set('ref', e.target.value)} placeholder="HA0012" required />
              </div>
              <div className="space-y-1.5">
                <Label>Status *</Label>
                <NativeSelect value={form.status || ''} onChange={e => set('status', e.target.value)}>
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Service</Label>
                <NativeSelect value={form.service || ''} onChange={e => set('service', e.target.value)} placeholder="Select service…">
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={form.time || ''} onChange={e => set('time', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Property Address</Label>
              <Input value={form.property_address || ''} onChange={e => set('property_address', e.target.value)} placeholder="123 High Street, Birmingham" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Postcode</Label>
                <Input value={form.postcode || ''} onChange={e => set('postcode', e.target.value)} placeholder="B17 9QG" />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Phone</Label>
                <Input value={form.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} placeholder="07700 000000" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Contact Email <span className="text-gray-400 font-normal">(used for booking confirmation)</span></Label>
                <Input type="email" value={form.contact_email || ''} onChange={e => set('contact_email', e.target.value)} placeholder="tenant@email.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <NativeSelect value={form.client_id || ''} onChange={e => set('client_id', e.target.value)} placeholder="Select client…">
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label>Client Type</Label>
                <NativeSelect value={form.client_type || ''} onChange={e => set('client_type', e.target.value)} placeholder="Select type…">
                  {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </NativeSelect>
              </div>
            </div>

            {/* Payment tracking */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment — Total £250</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Deposit (£)</Label>
                  <Input type="number" value={form.deposit_amount ?? ''} onChange={e => set('deposit_amount', e.target.value ? Number(e.target.value) : undefined)} placeholder="60" min="0" step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <Label>Total Fee (£)</Label>
                  <Input type="number" value={form.fee ?? ''} onChange={e => set('fee', e.target.value ? Number(e.target.value) : undefined)} placeholder="250" min="0" step="0.01" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                {([['deposit_paid', 'Deposit Paid'], ['paid', 'Final Payment Received'], ['invoice_sent', 'Invoice Sent']] as const).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!form[field]} onChange={e => set(field, e.target.checked)} className="h-4 w-4 rounded border-gray-300 accent-[#16512a]" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Date Final Payment Received</Label>
                <Input type="date" value={form.date_paid || ''} onChange={e => set('date_paid', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" rows={3} />
            </div>

            <div className="flex items-center justify-between pt-2">
              {job ? (
                <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-1.5" />Delete job
                </Button>
              ) : <div />}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button type="submit" className="bg-[#16512a] hover:bg-[#0f3d1e] text-white" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : job ? 'Save changes' : 'Create job'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* ── Activity tab ─────────────────────────────────────────────────── */}
        {tab === 'activity' && (
          <div className="space-y-5 pt-2">
            {/* Linked Invoices */}
            {linkedInvoices.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invoices</p>
                <div className="space-y-2">
                  {linkedInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-gray-800">{inv.ref}</span>
                        {inv.amount != null && <span className="text-sm text-gray-600">£{inv.amount}</span>}
                        {inv.status && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                            inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                            inv.status === 'Draft' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-700'
                          )}>{inv.status}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#16512a] hover:underline font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />View
                        </a>
                        <a
                          href={`/api/invoices/${inv.id}/pdf?download=1`}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 hover:underline"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Log */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Activity</p>
              {loadingActivity ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No activity recorded yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-100" />
                  <div className="space-y-4">
                    {activity.map(item => (
                      <div key={item.id} className="flex items-start gap-3 pl-1">
                        <div className={cn('mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white', activityDot(item.type))} />
                        <div>
                          <p className="text-sm text-gray-700 leading-snug">{item.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(item.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
