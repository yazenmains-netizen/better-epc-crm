'use client'

import { useState } from 'react'
import { Client } from '@/lib/types'
import { ClientModal } from './ClientModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function ClientsTable({ initialClients }: { initialClients: Client[] }) {
  const [clients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const types = ['All', ...Array.from(new Set(clients.map(c => c.type).filter(Boolean))) as string[]]

  const filtered = clients.filter(c => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'All' || c.type === filterType
    return matchSearch && matchType
  })

  function openEdit(client: Client) {
    setEditingClient(client)
    setModalOpen(true)
  }

  function openNew() {
    setEditingClient(null)
    setModalOpen(true)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} total</p>
        </div>
        <Button
          onClick={openNew}
          className="bg-[#16512a] hover:bg-[#0f3d1e] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="pl-9 w-56"
          />
        </div>
        <div className="flex gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full font-medium transition-colors border',
                filterType === t
                  ? 'bg-[#16512a] text-white border-[#16512a]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400">
            No clients found.
          </div>
        ) : (
          filtered.map(client => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                  {client.type && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {client.type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {client.active ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                {client.contact_name && (
                  <p className="font-medium text-gray-700">{client.contact_name}</p>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <a href={`tel:${client.phone}`} className="hover:text-[#16512a]">{client.phone}</a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <a href={`mailto:${client.email}`} className="truncate hover:text-[#16512a]">{client.email}</a>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-xs">{client.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(client)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                >
                  Edit
                </button>
                <span className="text-gray-200">·</span>
                <Link
                  href={`/clients/${client.id}`}
                  className="text-xs text-[#16512a] hover:underline font-medium flex items-center gap-1"
                >
                  View profile
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <ClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        client={editingClient}
      />
    </>
  )
}
