'use client'

import { useState, useEffect } from 'react'
import { Job, Client, STATUS_COLOURS, JOB_STATUSES } from '@/lib/types'
import { JobModal } from './JobModal'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react'

type SortKey = 'ref' | 'date' | 'client' | 'property_address' | 'service' | 'fee' | 'status'

function sortJobs(jobs: Job[], key: SortKey, dir: 'asc' | 'desc'): Job[] {
  return [...jobs].sort((a, b) => {
    let av: string | number = ''
    let bv: string | number = ''
    if (key === 'client') { av = a.clients?.name || ''; bv = b.clients?.name || '' }
    else if (key === 'fee') { av = a.fee ?? 0; bv = b.fee ?? 0 }
    else { av = (a[key] as string) || ''; bv = (b[key] as string) || '' }
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })
}

export function JobsTable({ initialJobs, clients }: { initialJobs: Job[]; clients: Client[] }) {
  const [jobs] = useState(initialJobs)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [editing, setEditing] = useState<Job | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      j.property_address?.toLowerCase().includes(q) ||
      j.ref?.toLowerCase().includes(q) ||
      j.clients?.name?.toLowerCase().includes(q) ||
      j.service?.toLowerCase().includes(q) ||
      j.postcode?.toLowerCase().includes(q)
    const matchStatus = !statusFilter || j.status === statusFilter
    return matchSearch && matchStatus
  })
  const sorted = sortJobs(filtered, sortKey, sortDir)

  function Th({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
        onClick={() => handleSort(k)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <span className="inline-flex flex-col">
            <ChevronUp className={cn('h-2.5 w-2.5 -mb-0.5', active && sortDir === 'asc' ? 'text-[#16512a]' : 'text-gray-300')} />
            <ChevronDown className={cn('h-2.5 w-2.5', active && sortDir === 'desc' ? 'text-[#16512a]' : 'text-gray-300')} />
          </span>
        </span>
      </th>
    )
  }

  return (
    <>
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search property, client, ref, service…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16512a]/30 focus:border-[#16512a]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#16512a]/30 focus:border-[#16512a] bg-white"
        >
          <option value="">All statuses</option>
          {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('') }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No jobs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <Th k="ref" label="Ref" />
                  <Th k="date" label="Date" />
                  <Th k="client" label="Client" />
                  <Th k="property_address" label="Property" />
                  <Th k="service" label="Service" />
                  <Th k="fee" label="Fee" />
                  <Th k="status" label="Status" />
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Inv</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(job => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => { setEditing(job); setModalOpen(true) }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {job.ref || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {job.date ? new Date(job.date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-32 truncate">
                      {job.clients?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-48 truncate text-xs">
                      {job.property_address || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {job.service || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {job.fee != null ? `£${job.fee}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap', STATUS_COLOURS[job.status] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-xs', job.invoice_sent ? 'text-green-600' : 'text-gray-300')}>●</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-xs', job.paid ? 'text-green-600' : 'text-gray-300')}>●</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <JobModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        job={editing}
        clients={clients}
      />
    </>
  )
}
