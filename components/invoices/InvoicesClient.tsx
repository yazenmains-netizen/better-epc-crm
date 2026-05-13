'use client'

import { useState } from 'react'
import { Invoice, Client, Job } from '@/lib/types'
import { InvoiceModal } from './InvoiceModal'
import { GenerateInvoiceModal } from './GenerateInvoiceModal'
import { Button } from '@/components/ui/button'
import { Plus, Download, FileDown, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLOURS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-400',
}

const FILTERS = ['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']

export function InvoicesClient({ initialInvoices, clients, jobs }: { initialInvoices: Invoice[]; clients: Client[]; jobs: Job[] }) {
  const [filter, setFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)

  const filtered = filter === 'All' ? initialInvoices : initialInvoices.filter(i => i.status === filter)
  const totalFiltered = filtered.reduce((s, i) => s + (i.amount || 0), 0)

  function openEdit(inv: Invoice) { setEditing(inv); setModalOpen(true) }
  function openNew() { setEditing(null); setModalOpen(true) }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} invoices · £{totalFiltered.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />Add record
          </Button>
          <Button onClick={() => setGenerateOpen(true)} className="bg-[#16512a] hover:bg-[#0f3d1e] text-white">
            <FileDown className="h-4 w-4 mr-2" />Generate Invoice
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full font-medium transition-colors border',
              filter === f ? 'bg-[#16512a] text-white border-[#16512a]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >{f}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No invoices found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(inv)}>
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-800">{inv.ref}</td>
                  <td className="px-5 py-3 text-gray-700">{(inv.clients as Record<string, unknown> | null)?.name as string || '—'}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{(inv.jobs as Record<string, unknown> | null)?.ref as string || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{inv.invoice_date || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{inv.amount ? `£${inv.amount}` : '—'}</td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOURS[inv.status || ''] || 'bg-gray-100 text-gray-500')}>
                      {inv.status || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#16512a] transition-colors px-2 py-1 rounded hover:bg-green-50"
                        title="View PDF"
                      >
                        <Eye className="h-3.5 w-3.5" />View
                      </a>
                      <a
                        href={`/api/invoices/${inv.id}/pdf?download=1`}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#16512a] transition-colors px-2 py-1 rounded hover:bg-green-50"
                        title="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} invoice={editing} clients={clients} jobs={jobs} />
      <GenerateInvoiceModal open={generateOpen} onClose={() => setGenerateOpen(false)} jobs={jobs} clients={clients} />
    </>
  )
}
