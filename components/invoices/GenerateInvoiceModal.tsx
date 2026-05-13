'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInvoice } from '@/app/actions/invoices'
import { Job, Client } from '@/lib/types'
import { Loader2, FileDown, Building2, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  jobs: Job[]
  clients: Client[]
}

export function GenerateInvoiceModal({ open, onClose, jobs, clients }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [invoiceRef, setInvoiceRef] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const activeJobs = useMemo(
    () => jobs.filter(j => j.status !== 'Cancelled').sort((a, b) => (b.ref ?? '').localeCompare(a.ref ?? '')),
    [jobs]
  )

  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase()
    return q ? activeJobs.filter(j =>
      (j.ref ?? '').toLowerCase().includes(q) ||
      (j.property_address ?? '').toLowerCase().includes(q)
    ) : activeJobs
  }, [activeJobs, search])

  const selectedJobs = useMemo(() => activeJobs.filter(j => selectedIds.includes(j.id)), [activeJobs, selectedIds])
  const totalAmount = selectedJobs.reduce((s, j) => s + (j.fee ?? 0), 0)

  // Detect shared client + estate agent status
  const sharedClientId = useMemo(() => {
    if (selectedJobs.length === 0) return null
    const ids = new Set(selectedJobs.map(j => j.client_id))
    return ids.size === 1 ? [...ids][0] : null
  }, [selectedJobs])

  const sharedClient = sharedClientId ? clients.find(c => c.id === sharedClientId) : null
  const isEstateAgent = selectedJobs.length > 0 && selectedJobs.every(j => j.client_type === 'Estate Agent')

  // Auto-fill invoice ref from first selected job
  useEffect(() => {
    if (selectedJobs.length > 0 && !invoiceRef) {
      setInvoiceRef(selectedJobs[0].ref ?? '')
    }
  }, [selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      setSelectedIds([]); setInvoiceRef(''); setSearch('')
    }
  }, [open])

  function toggleJob(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleGenerate() {
    if (selectedIds.length === 0) { toast.error('Select at least one job'); return }
    if (!invoiceRef.trim()) { toast.error('Invoice reference is required'); return }
    setLoading(true)

    const isSingle = selectedIds.length === 1
    const result = await createInvoice({
      ref: invoiceRef.trim(),
      job_id: isSingle ? selectedIds[0] : null,
      job_ids: isSingle ? null : selectedIds,
      client_id: sharedClientId ?? selectedJobs[0]?.client_id ?? null,
      invoice_date: new Date().toISOString().split('T')[0],
      amount: totalAmount || null,
      status: 'Draft',
    })

    setLoading(false)
    if ('error' in result && result.error) { toast.error(result.error); return }
    if ('id' in result && result.id) {
      window.open(`/api/invoices/${result.id}/pdf`, '_blank')
    }
    toast.success('Invoice created — PDF opening in new tab')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Job picker */}
          <div className="space-y-2">
            <Label>Select jobs ({selectedIds.length} selected)</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ref or address…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
              {filteredJobs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No jobs found</p>
              ) : filteredJobs.map(j => {
                const selected = selectedIds.includes(j.id)
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => toggleJob(j.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      selected ? 'bg-green-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center',
                      selected ? 'bg-[#16512a] border-[#16512a]' : 'border-gray-300'
                    )}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-mono font-semibold text-gray-700">{j.ref}</span>
                      <span className="text-xs text-gray-500 ml-2 truncate">{j.property_address}</span>
                    </div>
                    {j.fee != null && (
                      <span className="ml-auto text-xs font-medium text-gray-600 shrink-0">£{j.fee}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected summary + ref */}
          {selectedJobs.length > 0 && (
            <>
              {selectedJobs.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedJobs.map(j => (
                    <span key={j.id} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-800 border border-green-200 rounded-full px-2 py-0.5">
                      {j.ref}
                      <button onClick={() => toggleJob(j.id)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Invoice Ref *</Label>
                  <Input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="AB0001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Total Amount</Label>
                  <div className="h-9 flex items-center px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                    £{totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {isEstateAgent && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Bill To (Estate Agent)
                  </p>
                  {sharedClient?.contact_name && <p className="text-sm text-gray-700">{sharedClient.contact_name}</p>}
                  {sharedClient?.name && <p className="text-sm text-gray-700">{sharedClient.name}</p>}
                  {!sharedClient?.contact_name && !sharedClient?.name && (
                    <p className="text-xs text-amber-700">Client contact name not set — edit the client record to add it.</p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-1 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || selectedIds.length === 0 || !invoiceRef.trim()}
              className="bg-[#16512a] hover:bg-[#0f3d1e] text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
              Generate PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
